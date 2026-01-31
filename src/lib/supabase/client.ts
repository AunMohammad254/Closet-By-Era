import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

// Validate environment variables at module load time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Please check your .env.local file.'
    );
}

if (!supabaseAnonKey) {
    throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
        'Please check your .env.local file.'
    );
}

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
    if (client) return client;

    client = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
        // Use singleton pattern to avoid multiple clients
        isSingleton: true,
        auth: {
            // Persist session in localStorage and sync across tabs
            persistSession: true,
            detectSessionInUrl: true,
            // Suppress abort errors by disabling flow state
            flowType: 'pkce',
        },
        global: {
            headers: {
                'X-Client-Info': 'closet-by-era',
            },
        },
    });

    return client;
}


