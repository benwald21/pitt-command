import { createClient } from '@supabase/supabase-js';

// Reads the two values you set in Vercel (Settings → Environment Variables).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Holds the signed-in user's email + role so the save function can check it.
export const acl = { email: null, role: null };
