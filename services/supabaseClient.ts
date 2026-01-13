import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize the client only if the URL and Key are provided.
// Otherwise, export a Proxy that throws an error only if the client is accessed.
// This allows the app to run in "Google Sheets mode" without Supabase credentials causing a crash at startup.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as SupabaseClient, {
      get: (_target, prop) => {
        // Safe check for Promises to avoid unhandled rejections during framework type checking
        if (prop === 'then') return undefined;
        
        throw new Error(
          'Supabase client is not initialized. ' +
          'If you want to use Supabase, set VITE_DATA_SOURCE=supabase and ensure VITE_SUPABASE_URL/ANON_KEY are set.'
        );
      },
    });
