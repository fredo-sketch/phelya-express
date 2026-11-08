"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Mewujudkan opsi "Ingat saya di perangkat ini". Bila pengguna memilih tidak diingat,
 * sesi diakhiri saat browser dibuka kembali (sessionStorage hilang ketika tab/browser ditutup).
 */
export default function SessionGuard() {
  useEffect(() => {
    try {
      if (localStorage.getItem("phelya-ingat") === "0" && !sessionStorage.getItem("phelya-aktif")) {
        localStorage.removeItem("phelya-ingat");
        supabaseBrowser().auth.signOut().then(() => {
          // Muat ulang penuh (bukan router.push) agar cookie sesi & state klien bersih
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          if (/^\/(dashboard|kurir|admin)/.test(window.location.pathname)) window.location.assign("/masuk");
        });
      }
    } catch {}
  }, []);
  return null;
}
