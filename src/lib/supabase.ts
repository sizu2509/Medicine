import { createClient, SupabaseClient } from '@supabase/supabase-js';

// User's configured project credentials
export const DEFAULT_SUPABASE_URL = 'https://njiojrpqihbarnotdewi.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Qw74GvfXM3omQCSLvYYyHQ_9NKvvHVy';

// Environment variables or runtime localStorage override with user's project as default
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('medistock_supabase_url') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('medistock_supabase_key') : null;

  return {
    url: customUrl || envUrl || DEFAULT_SUPABASE_URL,
    key: customKey || envKey || DEFAULT_SUPABASE_ANON_KEY,
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

/**
 * Upload files (photos, videos, prescriptions, documents, notices) to Supabase Storage
 */
export const uploadFileToStorage = async (
  file: File,
  bucket = 'media',
  folder = 'uploads'
): Promise<{ url: string | null; error: string | null }> => {
  const supabase = getSupabase();
  if (!supabase) {
    // Local fallback: create object URL
    const localUrl = URL.createObjectURL(file);
    return { url: localUrl, error: null };
  }

  try {
    const ext = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      // Fallback to local blob URL if bucket not yet created
      return { url: URL.createObjectURL(file), error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url: URL.createObjectURL(file), error: msg };
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
      message: 'Supabase credentials not configured.',
    };
  }

  try {
    const { error } = await supabase.from('medicines').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "medicines" does not exist')) {
        return {
          connected: true,
          message: 'Successfully connected to your Supabase project (njiojrpqihbarnotdewi)! Tables need to be initialized in SQL Editor.',
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
      message: 'Connected to live Supabase project (njiojrpqihbarnotdewi)! Real-time PostgreSQL database ready.',
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
