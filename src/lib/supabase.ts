import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or runtime localStorage override
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('medistock_supabase_url') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('medistock_supabase_key') : null;

  return {
    url: customUrl || envUrl || '',
    key: customKey || envKey || '',
  };
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || url.includes('your-project-id')) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
};

export const setCustomSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('medistock_supabase_url', url.trim());
      localStorage.setItem('medistock_supabase_key', key.trim());
    } else {
      localStorage.removeItem('medistock_supabase_url');
      localStorage.removeItem('medistock_supabase_key');
    }
    supabaseInstance = null; // reset instance
  }
};

export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
  hasTables?: boolean;
}> => {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      connected: false,
      message: 'Supabase credentials not configured. Currently running on local persistent reactive engine.',
    };
  }

  try {
    const { error } = await supabase.from('medicines').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "medicines" does not exist')) {
        return {
          connected: true,
          message: 'Connected to Supabase! (Tables not yet initialized, run supabase/schema.sql in SQL Editor).',
          hasTables: false,
        };
      }
      return {
        connected: false,
        message: `Supabase error: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Connected to live Supabase PostgreSQL database!',
      hasTables: true,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Connection failed: ${msg}`,
    };
  }
};
