import { createClient } from '@supabase/supabase-js';

// Ngambil kunci dari file .env.local 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Bikin koneksi ke Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);