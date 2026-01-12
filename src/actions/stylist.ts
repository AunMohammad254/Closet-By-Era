'use server';

import { Product } from '@/lib/supabase';

export interface StylistRecommendation {
    products: Product[];
    message: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getStylistRecommendations(prompt: string): Promise<StylistRecommendation> {
    try {
        // Call the AI Stylist Edge Function
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/ai-stylist`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ prompt }),
            }
        );

        if (!response.ok) {
            console.error('AI Stylist Edge Function error:', response.statusText);
            return {
                products: [],
                message: "Sorry, I'm having trouble right now. Please try again! 😊"
            };
        }

        const data = await response.json();

        return {
            products: data.products || [],
            message: data.message || "Here are some beautiful pieces for you!"
        };
    } catch (error) {
        console.error('Stylist Error:', error);
        return {
            products: [],
            message: "Sorry, I had trouble checking the closet. Please try again."
        };
    }
}

