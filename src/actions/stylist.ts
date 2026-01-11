'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { Product } from '@/lib/supabase';

export interface StylistRecommendation {
    products: Product[];
    message: string;
}

// Simple keyword mapping engine
// In future, replace this with an LLM call
const KEYWORD_MAP: Record<string, { categories?: string[], priceRange?: [number, number], message: string }> = {
    'wedding': {
        categories: ['Formals', 'Luxury Pret', 'Bridal', 'Velvet'],
        message: "For a wedding, we recommend our elegant Formals and Luxury collections."
    },
    'shadi': {
        categories: ['Formals', 'Luxury Pret', 'Bridal', 'Velvet'],
        message: "Shadi season calls for something spectacular! Check out these formals."
    },
    'party': {
        categories: ['Luxury Pret', 'Silk', 'Chiffon'],
        message: "Get ready to shine! Here are some stunning party-wear options."
    },
    'office': {
        categories: ['Co-ords', 'Kurtas', '2 Piece', 'Basic'],
        message: "Professional yet stylish. These cuts are perfect for the workplace."
    },
    'work': {
        categories: ['Co-ords', 'Kurtas', '2 Piece'],
        message: "Workwear that works for you. Comfortable and chic."
    },
    'casual': {
        categories: ['Kurtas', 'Basic', '2 Piece', 'Lawn'],
        message: "Effortless style for your everyday moments."
    },
    'college': {
        categories: ['Kurtas', 'Basic', 'Fusion'],
        message: "Trendy and comfortable picks for campus life."
    },
    'date': {
        categories: ['Silk', 'Luxury Pret', 'Co-ords'],
        message: "Impress with these elegant and sophisticated styles."
    },
    'eid': {
        categories: ['Luxury Pret', 'Formals', 'Chiffon'],
        message: "Celebrate Eid in style with our curated festive collection."
    },
    'summer': {
        categories: ['Lawn', 'Cotton', 'Basic'],
        message: "Beat the heat with our breathable Lawn and Cotton fabrics."
    },
    'winter': {
        categories: ['Velvet', 'Khaddar', 'Linen', 'Shawls'],
        message: "Stay cozy and chic with our Winter essentials."
    }
};

export async function getStylistRecommendations(prompt: string): Promise<StylistRecommendation> {
    const lowercasePrompt = prompt.toLowerCase();

    // 1. Find matching logic
    let match = null;
    for (const [key, value] of Object.entries(KEYWORD_MAP)) {
        if (lowercasePrompt.includes(key)) {
            match = value;
            break; // Stop at first match for now
        }
    }

    // Default fallback
    if (!match) {
        return {
            products: [],
            message: "I'm not sure about that occasion yet! Try 'Wedding', 'Office', or 'Casual'."
        };
    }

    // 2. Query Supabase
    // We need to fetch products that match the categories.
    // Since Supabase filter on related tables is tricky with simple syntax, 
    // we'll fetch products and filter in memory OR fetch by category string if possible.
    // Assuming 'category.name' concept. Ideally we'd map category names to IDs, but let's try text search or relation filter.

    // Better approach: Get Category IDs first for these names, then fetch products.
    // Optimization: Just search 'categories(name)' with simple text match if relation allows, 
    // OR just fetch popular items if we can't match specific categories easily.

    // Let's try to find category IDs matching the names
    const { data: categories } = await supabaseServer
        .from('categories')
        .select('id, name')
        .in('name', match.categories || []);

    const categoryIds = categories?.map(c => c.id) || [];

    let query = supabaseServer
        .from('products')
        .select('*, categories(name)')
        .eq('in_stock', true)
        .limit(4);

    if (categoryIds.length > 0) {
        query = query.in('category_id', categoryIds);
    } else {
        // If no categories matched (maybe exact name mismatch), try text search on description or name
        // as a fallback? Or just return nothing.
        // Let's try a fallback to fetch *something* if categories imply 'New'
        if (match.categories?.includes('New')) {
            query = query.eq('is_new', true);
        }
    }

    const { data: products, error } = await query;

    if (error) {
        console.error("Stylist Error:", error);
        return { products: [], message: "Sorry, I had trouble checking the closet. Please try again." };
    }

    return {
        products: (products as unknown as Product[]) || [], // Type casting safe-ish here
        message: match.message
    };
}
