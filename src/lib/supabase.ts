import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Create a mock client if env vars are not set (for build time)
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: isClient,
            autoRefreshToken: isClient,
            detectSessionInUrl: isClient,
        },
    });
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
                order: () => ({
                    data: [],
                    error: null,
                    then: (resolve: (value: { data: never[]; error: null }) => void) => resolve({ data: [], error: null }),
                }),
            }),
            insert: (data: unknown) => ({
                select: () => ({
                    single: async () => ({ data: null, error: null }),
                }),
                then: (resolve: (value: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
            }),
            upsert: async () => ({ data: null, error: null }),
            update: () => ({
                eq: (column: string, value: unknown) => ({
                    eq: async () => ({ data: null, error: null }),
                    then: (resolve: (value: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
                }),
            }),
            delete: () => ({
                eq: (column: string, value: unknown) => ({
                    eq: async () => ({ data: null, error: null }),
                    then: (resolve: (value: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
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
    shipping_address: ShippingAddress;
    billing_address?: object;
    payment_method?: string;
    notes?: string;
    created_at: string;
}

export interface ShippingAddress {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    product_name: string;
    size?: string;
    color?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
}

export interface CartItemDB {
    id: string;
    user_id: string;
    product_id: string;
    product_name: string;
    product_price: number;
    product_image?: string;
    size?: string;
    color?: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}

// Helper function to get customer by auth_id
export async function getCustomerByAuthId(authId: string): Promise<Customer | null> {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authId)
        .single();

    if (error || !data) return null;
    return data as Customer;
}

// Helper function to create or get customer
export async function getOrCreateCustomer(authId: string, email: string, firstName?: string, lastName?: string): Promise<Customer | null> {
    // First try to get existing customer
    let customer = await getCustomerByAuthId(authId);

    if (!customer) {
        // Create new customer
        const { data, error } = await supabase
            .from('customers')
            .insert({
                auth_id: authId,
                email: email,
                first_name: firstName,
                last_name: lastName,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating customer:', error);
            return null;
        }
        customer = data as Customer;
    }

    return customer;
}
