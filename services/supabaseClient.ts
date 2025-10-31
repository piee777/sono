import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Export the client directly, but it can be null if credentials are not provided.
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.error("Supabase URL and Key must be provided in environment variables. Backend functionality will be disabled.");
}