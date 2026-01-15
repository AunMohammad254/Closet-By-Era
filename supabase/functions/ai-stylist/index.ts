
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Database } from "../database.types.ts";

const GEMINI_API_KEY = Deno.env.get('GeminiAPIKey') || Deno.env.get('GemeniAPIKey');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
}

interface Product {
    id: string;
    name: string;
    price: number;
    image_url: string;
    slug: string;
    category_id: string;
    description: string;
}

interface StylistRequest {
    prompt: string;
    categories?: string[];
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { prompt, categories = [] }: StylistRequest = await req.json();

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: 'Prompt is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // Initialize Supabase client
        const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Fetch available categories for context
        const { data: allCategories } = await supabase
            .from('categories')
            .select('id, name, slug')
            .eq('is_active', true);

        const categoryNames = allCategories?.map((c: any) => c.name).join(', ') || '';

        // Create prompt for Gemini
        const systemPrompt = `You are a fashion stylist AI for "Closet By Era", a Pakistani fashion e-commerce store specializing in women's clothing.

Available categories: ${categoryNames}

Your task is to analyze the user's request and provide:
1. A friendly, personalized styling message (2-3 sentences in Urdu/English mix style)
2. Which categories to show products from (return as JSON array of category names)
3. Any price preferences (budget/mid-range/luxury)
4. Keywords to search for in product names/descriptions

Respond ONLY in valid JSON format:
{
    "message": "Your personalized styling advice message",
    "categories": ["Category1", "Category2"],
    "priceRange": "budget" | "mid-range" | "luxury" | "any",
    "keywords": ["keyword1", "keyword2"]
}

Be warm, helpful, and fashion-forward in your advice. Use occasional Urdu words like "bohat", "perfect", "stunning" to connect with Pakistani customers.`;

        let aiResponse = {
            message: "Here are some beautiful pieces that might interest you!",
            categories: [] as string[],
            priceRange: "any",
            keywords: [] as string[]
        };

        // Call Gemini API if key is available
        if (GEMINI_API_KEY) {
            try {
                const geminiResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: `${systemPrompt}\n\nUser request: "${prompt}"`
                                }]
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 500,
                            }
                        })
                    }
                );

                const geminiData: GeminiResponse = await geminiResponse.json();
                const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

                if (textResponse) {
                    // Extract JSON from response (Gemini sometimes wraps it in markdown)
                    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        aiResponse = { ...aiResponse, ...parsed };
                    }
                }
            } catch (geminiError) {
                console.error('Gemini API error:', geminiError);
                // Fall back to keyword-based matching
                aiResponse = fallbackKeywordMatch(prompt);
            }
        } else {
            // No API key, use fallback
            aiResponse = fallbackKeywordMatch(prompt);
        }

        // Now fetch products based on AI response
        let productsQuery = supabase
            .from('products')
            .select('id, name, price, image_url, slug, category_id, description, categories(name)')
            .eq('in_stock', true)
            .limit(8);

        // Filter by categories if AI suggested some
        if (aiResponse.categories.length > 0 && allCategories) {
            const matchingCategoryIds = allCategories
                .filter((c: any) => aiResponse.categories.some(
                    (ac) => c.name.toLowerCase().includes(ac.toLowerCase()) ||
                        ac.toLowerCase().includes(c.name.toLowerCase())
                ))
                .map((c: any) => c.id);

            if (matchingCategoryIds.length > 0) {
                productsQuery = productsQuery.in('category_id', matchingCategoryIds);
            }
        }

        // Apply price range filter
        if (aiResponse.priceRange === 'budget') {
            productsQuery = productsQuery.lte('price', 5000);
        } else if (aiResponse.priceRange === 'mid-range') {
            productsQuery = productsQuery.gte('price', 5000).lte('price', 15000);
        } else if (aiResponse.priceRange === 'luxury') {
            productsQuery = productsQuery.gte('price', 15000);
        }

        // Apply keyword search if available
        if (aiResponse.keywords && aiResponse.keywords.length > 0) {
            // Take top 3 keywords to avoid hitting URL length limits or complex queries
            const searchTerms = aiResponse.keywords.slice(0, 3);
            if (searchTerms.length > 0) {
                // Construct OR query for keywords in name or description
                const orConditions = searchTerms.map(term =>
                    `name.ilike.%${term}%,description.ilike.%${term}%`
                ).join(',');
                productsQuery = productsQuery.or(orConditions);
            }
        }

        const { data: products, error: productsError } = await productsQuery;

        if (productsError) {
            console.error('Products fetch error:', productsError);
        }

        return new Response(
            JSON.stringify({
                message: aiResponse.message,
                products: products || [],
                categories: aiResponse.categories,
                debug: { priceRange: aiResponse.priceRange, keywords: aiResponse.keywords }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('AI Stylist error:', error);
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});

// Fallback keyword matching (same logic as original stylist.ts)
function fallbackKeywordMatch(prompt: string) {
    const lowerPrompt = prompt.toLowerCase();

    const KEYWORD_MAP: Record<string, { categories: string[], message: string, priceRange: string }> = {
        'wedding': {
            categories: ['Formals', 'Luxury Pret', 'Bridal', 'Velvet'],
            message: "For a wedding, we recommend our elegant Formals and Luxury collections. You'll look absolutely stunning! 💫",
            priceRange: 'luxury'
        },
        'shadi': {
            categories: ['Formals', 'Luxury Pret', 'Bridal', 'Velvet'],
            message: "Shadi season calls for something spectacular! Check out these gorgeous formals. Bohat khubsurat! ✨",
            priceRange: 'luxury'
        },
        'party': {
            categories: ['Luxury Pret', 'Silk', 'Chiffon'],
            message: "Get ready to shine at your party! Here are some stunning options that'll turn heads. 🎉",
            priceRange: 'mid-range'
        },
        'office': {
            categories: ['Co-ords', 'Kurtas', '2 Piece', 'Basic'],
            message: "Professional yet stylish - perfect for the workplace. You'll look smart and feel confident! 💼",
            priceRange: 'mid-range'
        },
        'casual': {
            categories: ['Kurtas', 'Basic', '2 Piece', 'Lawn'],
            message: "Effortless style for your everyday moments. Comfortable aur trendy! 😊",
            priceRange: 'budget'
        },
        'eid': {
            categories: ['Luxury Pret', 'Formals', 'Chiffon'],
            message: "Eid Mubarak in advance! Celebrate in style with our festive collection. 🌙",
            priceRange: 'mid-range'
        },
        'summer': {
            categories: ['Lawn', 'Cotton', 'Basic'],
            message: "Beat the heat with our breathable Lawn and Cotton fabrics. Perfect for garmi! ☀️",
            priceRange: 'budget'
        },
        'winter': {
            categories: ['Velvet', 'Khaddar', 'Linen', 'Shawls'],
            message: "Stay cozy and chic with our Winter essentials. Sardi mein bhi stylish! ❄️",
            priceRange: 'mid-range'
        }
    };

    for (const [key, value] of Object.entries(KEYWORD_MAP)) {
        if (lowerPrompt.includes(key)) {
            return {
                message: value.message,
                categories: value.categories,
                priceRange: value.priceRange,
                keywords: [key]
            };
        }
    }

    return {
        message: "I'd love to help you find the perfect outfit! Try telling me about the occasion - like 'wedding', 'casual', 'office', or 'Eid'. 😊",
        categories: [],
        priceRange: 'any',
        keywords: []
    };
}
