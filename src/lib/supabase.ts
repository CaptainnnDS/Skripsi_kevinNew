import { createClient } from '@supabase/supabase-js';

// Ngambil kunci dari file .env.local 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Bikin koneksi ke Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Wrapper untuk semua panggilan Supabase dengan timeout.
 * Mencegah request menggantung selamanya saat koneksi hilang.
 */
const FETCH_TIMEOUT = 10000; // 10 detik

export async function safeFetch<T>(
  promise: PromiseLike<{ data: T | null; error: any }>,
  timeoutMs = FETCH_TIMEOUT
): Promise<{ data: T | null; error: any }> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Koneksi timeout. Periksa jaringan Anda.")), timeoutMs)
  );
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } catch (err: any) {
    return { data: null, error: err };
  }
}
