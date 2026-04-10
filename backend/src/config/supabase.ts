import { createClient } from '@supabase/supabase-js';

// Service role client — full access, bypasses RLS
// ONLY used server-side, never exposed to frontend
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Anon client — used to verify user JWTs from Supabase Auth
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
