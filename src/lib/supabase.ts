import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_FALLBACK = 'https://example.supabase.co';
const SUPABASE_ANON_FALLBACK = 'public-anon-key-placeholder';

const resolvedSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = resolvedSupabaseUrl || SUPABASE_URL_FALLBACK;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_FALLBACK;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('[supabase] Public environment variables are missing. Using placeholder client; public queries will fail until .env is configured.');
}

// Public client for site reading
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only client for admin operations (needs service role key)
export function getAdminSupabase() {
  const adminSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing: string[] = [];
  if (!adminSupabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  }
  if (!serviceRoleKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. Cannot initialize admin client.`);
  }

  const finalUrl = adminSupabaseUrl as string;
  const finalServiceRoleKey = serviceRoleKey as string;

  return createClient(finalUrl, finalServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
