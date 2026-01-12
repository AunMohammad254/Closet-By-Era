import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Re-export types from generated file for convenience
export type {
    Product,
    Category,
    Customer,
    Order,
    OrderItem,
    CartItem,
    Wishlist,
    Review,
    Banner,
    Coupon,
    Address,
    AnalyticsEvent,
    Database,
    Tables,
    InsertTables,
    UpdateTables,
    Enums
} from '@/types/supabase';

// Import Customer type for use in helper functions
import type { Customer } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Create a mock client if env vars are not set (for build time)
let supabase: SupabaseClient<Database>;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
            insert: () => ({
                select: () => ({
                    single: async () => ({ data: null, error: null }),
                }),
                then: (resolve: (value: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
            }),
            upsert: async () => ({ data: null, error: null }),
            update: () => ({
                eq: () => ({
                    eq: async () => ({ data: null, error: null }),
                    then: (resolve: (value: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
                }),
            }),
            delete: () => ({
                eq: () => ({
                    eq: async () => ({ data: null, error: null }),
                    then: (resolve: (value: { data: null; error: null }) => void) => resolve({ data: null, error: null }),
                }),
            }),
        }),
        rpc: async () => ({ data: null, error: null }),
    } as unknown as SupabaseClient<Database>;
}

export { supabase };

// Shipping Address type (used in orders JSON field)
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

// Helper function to get customer by auth_id
export async function getCustomerByAuthId(authId: string): Promise<Customer | null> {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authId)
        .single();

    if (error || !data) return null;
    return data;
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
        customer = data;
    }

    return customer;
}
