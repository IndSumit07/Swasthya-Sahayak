import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from '../utils/logger';

// Default Supabase client with anon key
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Admin / Service Role Supabase client (used for backend admin operations like user management)
export const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      logger.warn(`Supabase Auth check notice: ${error.message}`);
      return false;
    }
    return true;
  } catch (err: unknown) {
    logger.error('Supabase connection check failed:', err);
    return false;
  }
};
