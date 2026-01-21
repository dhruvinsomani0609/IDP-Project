import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uxfmlkbszjatrmmbedis.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_RF5y_6NEGKZ3Rpy7kWMPYA_3sqftct7";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
