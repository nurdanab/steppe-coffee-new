// serverSupabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key are not defined in environment variables.');
}

export const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);