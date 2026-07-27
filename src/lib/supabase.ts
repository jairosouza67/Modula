import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'mock';

// Resolve relative paths to absolute URLs (necessary for Netlify redirects proxying)
const resolvedUrl = SUPABASE_URL.startsWith('/')
  ? `${window.location.origin}${SUPABASE_URL}`
  : SUPABASE_URL;

export const supabase = createClient<Database>(resolvedUrl, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
