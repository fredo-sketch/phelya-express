import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase untuk browser. HANYA dipakai untuk Auth (masuk, daftar, keluar).
 * Semua data aplikasi diambil lewat Route Handlers (/api/*), bukan langsung dari browser.
 */
export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
