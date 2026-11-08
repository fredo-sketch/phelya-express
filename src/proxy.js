import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const HOME = { pelanggan: "/dashboard", kurir: "/kurir", admin: "/admin" };

function areaDari(path) {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/kurir")) return "kurir";
  if (path.startsWith("/dashboard")) return "pelanggan";
  return null;
}

/**
 * Proxy: menyegarkan sesi Supabase dan melakukan pemeriksaan awal akses per peran.
 * Ini hanya lapisan pertama (UX). Otorisasi sebenarnya ada di RLS dan fungsi database.
 */
export async function proxy(request) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = data?.role ?? null;
  }

  const path = request.nextUrl.pathname;
  const area = areaDari(path);
  const alihkan = (tujuan) => {
    const res = NextResponse.redirect(new URL(tujuan, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (area) {
    if (!user || !role) return alihkan(`/masuk?next=${encodeURIComponent(path)}`);
    if (role !== area) return alihkan(HOME[role]);
  }
  if ((path === "/masuk" || path === "/daftar") && user && role) return alihkan(HOME[role]);

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/kurir/:path*", "/admin/:path*", "/masuk", "/daftar"],
};
