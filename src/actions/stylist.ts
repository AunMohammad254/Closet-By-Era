'use server';

import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/database';

export interface StylistRecommendation {
    products: Product[];
    message: string;
}

export async function getStylistRecommendations(prompt: string): Promise<StylistRecommendation> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.functions.invoke('ai-stylist', {
            body: { prompt }
        });

        if (error) {
            console.error('AI Stylist Edge Function error:', error);
            return {
                products: [],
                message: "Sorry, I'm having trouble right now. Please try again! 😊"
            };
        }

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

