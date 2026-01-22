import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hffdikduiqwzioyxxxkh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_cGc1M5hG8f6RXVNbdB4WUg_nonEpbIB";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
