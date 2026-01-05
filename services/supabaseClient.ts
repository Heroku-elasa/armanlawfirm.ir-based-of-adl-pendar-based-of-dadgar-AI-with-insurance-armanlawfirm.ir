import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL || '';

const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured. Some features may be unavailable.');
    return {
      from: () => ({
        select: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
        insert: async () => ({ error: { message: 'Supabase not configured' } }),
        update: async () => ({ error: { message: 'Supabase not configured' } }),
        upsert: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
        delete: () => ({ eq: async () => ({ error: { message: 'Supabase not configured' } }) }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
      },
    } as unknown as SupabaseClient;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
})();

export const getSupabaseUrl = () => SUPABASE_URL;
export const getSupabaseAnonKey = () => SUPABASE_ANON_KEY;
export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
