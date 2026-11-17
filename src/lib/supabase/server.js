import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Client Supabase di server dengan sesi pengguna dari cookie (RLS aktif sebagai pengguna tersebut). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // dipanggil dari Server Component: penyegaran sesi ditangani proxy
        }
      },
    },
  });
}

/** Client anonim tanpa cookie, untuk data publik (lowongan, pelacakan). Aman dipakai di dalam "use cache". */
export function supabaseAnon() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Client dengan service_role: MELEWATI RLS. Hanya untuk route handler tepercaya yang tidak punya sesi pengguna
 * (webhook Midtrans) dan hanya memanggil fungsi database yang di-GRANT khusus ke service_role.
 * Kunci ini wajib berupa env server (tanpa awalan NEXT_PUBLIC_), jangan pernah dikirim ke browser.
 */
export function supabaseService() {
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!kunci) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi di environment server.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, kunci, { auth: { persistSession: false, autoRefreshToken: false } });
}
