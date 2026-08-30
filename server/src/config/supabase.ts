import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Admin client using the Service Role key — NEVER exposed to the browser.
// Used server-side only for admin operations.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Public client for user-facing actions like signUp (which triggers verification email)
export const supabasePublic = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Health-check helper — pings Supabase to confirm connectivity.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  } catch {
    return false;
  }
}
