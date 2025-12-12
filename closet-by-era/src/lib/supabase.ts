import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a mock client if env vars are not set (for build time)
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Create a mock client for build time
    console.warn('Supabase environment variables not set. Using mock client.');
    supabase = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
            signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
            signOut: async () => ({ error: null }),
            resetPasswordForEmail: async () => ({ data: {}, error: new Error('Supabase not configured') }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        single: async () => ({ data: null, error: null }),
                        limit: async () => ({ data: [], error: null }),
                        order: () => ({
                            limit: async () => ({ data: [], error: null }),
                        }),
                    }),
                    single: async () => ({ data: null, error: null }),
                    limit: async () => ({ data: [], error: null }),
                    is: () => ({
                        order: async () => ({ data: [], error: null }),
                    }),
                    neq: () => ({
                        eq: () => ({
                            limit: async () => ({ data: [], error: null }),
                        }),
                    }),
                    order: () => ({
                        limit: async () => ({ data: [], error: null }),
                        range: async () => ({ data: [], error: null }),
                    }),
                    ilike: () => ({
                        eq: () => ({
                            limit: async () => ({ data: [], error: null }),
                        }),
                    }),
                }),
                or: () => ({
                    eq: () => ({
                        limit: async () => ({ data: [], error: null }),
                    }),
                }),
                single: async () => ({ data: null, error: null }),
                order: async () => ({ data: [], error: null }),
            }),
            insert: () => ({
                select: () => ({
                    single: async () => ({ data: null, error: null }),
                }),
            }),
        }),
    } as unknown as SupabaseClient;
}

export { supabase };

// Database types
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    short_description?: string;
    price: number;
    original_price?: number;
    category_id: string;
    image_url?: string;
    images?: string[];
    sizes?: string[];
    colors?: string[];
    in_stock: boolean;
    is_featured: boolean;
    is_new?: boolean;
    is_sale?: boolean;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    description?: string;
    parent_id?: string;
    display_order?: number;
    is_active: boolean;
}

export interface Banner {
    id: string;
    title: string;
    subtitle?: string;
    image_url?: string;
    link_url?: string;
    position?: string;
    is_active: boolean;
}

export interface Customer {
    id: string;
    auth_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    customer_id?: string;
    status: string;
    subtotal: number;
    discount: number;
    shipping_cost: number;
    total: number;
    shipping_address: object;
    billing_address?: object;
    notes?: string;
    created_at: string;
}
