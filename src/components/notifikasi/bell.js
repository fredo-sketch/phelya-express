"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/components/order-store";
import { NotifButton } from "@/components/tracking/resi-actions";
import { cn, tanggalJam } from "@/lib/format";

const POLLING_MS = 30_000;

/** Lonceng notifikasi in-app: badge belum dibaca, daftar terbaru, tandai dibaca, dan tombol aktifkan push. */
export default function NotifBell() {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [data, setData] = useState({ belumDibaca: 0, notifikasi: [] });
  const [memuat, setMemuat] = useState(true);
  const kotak = useRef(null);

  const muat = useCallback(async () => {
    const j = await api("/api/notifikasi");
    if (j.ok) setData({ belumDibaca: j.belumDibaca, notifikasi: j.notifikasi });
    setMemuat(false);
  }, []);

  // muat pertama dan polling berkala selama tab terlihat
  useEffect(() => {
    let batal = false;
    const tarik = () => {
      if (document.visibilityState === "visible") api("/api/notifikasi").then((j) => !batal && j.ok && (setData({ belumDibaca: j.belumDibaca, notifikasi: j.notifikasi }), setMemuat(false)));
    };
    tarik();
    const t = setInterval(tarik, POLLING_MS);
    document.addEventListener("visibilitychange", tarik);
    return () => {
      batal = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", tarik);
    };
  }, []);

  // tutup saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!buka) return;
    const luar = (e) => kotak.current && !kotak.current.contains(e.target) && setBuka(false);
    const esc = (e) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", luar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", luar);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  async function klik(n) {
    setBuka(false);
    if (!n.dibaca) {
      setData((d) => ({ belumDibaca: Math.max(0, d.belumDibaca - 1), notifikasi: d.notifikasi.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)) }));
      api("/api/notifikasi/baca", { method: "POST", body: { id: n.id } });
    }
    if (n.url) router.push(n.url);
  }

  async function bacaSemua() {
    setData((d) => ({ belumDibaca: 0, notifikasi: d.notifikasi.map((x) => ({ ...x, dibaca: true })) }));
    await api("/api/notifikasi/baca", { method: "POST", body: { semua: true } });
  }

  return (
    <div className="relative" ref={kotak}>
      <button
        onClick={() => {
          setBuka((b) => !b);
          if (!buka) muat();
        }}
        aria-label={data.belumDibaca > 0 ? `Notifikasi, ${data.belumDibaca} belum dibaca` : "Notifikasi"}
        aria-expanded={buka}
        aria-haspopup="dialog"
        className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-soft"
      >
        <Bell className="size-5" />
        {data.belumDibaca > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold leading-[18px] text-white ring-2 ring-bg">
            {data.belumDibaca > 9 ? "9+" : data.belumDibaca}
          </span>
        )}
      </button>

      {buka && (
        <div role="dialog" aria-label="Notifikasi" className="fixed inset-x-3 top-[68px] z-[80] max-h-[80vh] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-base font-extrabold">Notifikasi</h2>
            <button onClick={bacaSemua} disabled={data.belumDibaca === 0} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary disabled:opacity-40">
              <CheckCheck className="size-4" aria-hidden /> Tandai semua dibaca
            </button>
          </div>
          <ul className="max-h-[52vh] overflow-y-auto">
            {memuat && <li className="px-4 py-6 text-center text-sm text-muted">Memuat...</li>}
            {!memuat && data.notifikasi.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Belum ada notifikasi.</li>}
            {data.notifikasi.map((n) => (
              <li key={n.id} className="border-b border-line last:border-0">
                <button onClick={() => klik(n)} className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-soft", !n.dibaca && "bg-primary-soft/40")}>
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", n.dibaca ? "bg-transparent" : "bg-accent")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold">{n.judul}</span>
                    <span className="mt-0.5 block text-sm text-muted">{n.isi}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-muted">{tanggalJam(n.waktu)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line bg-surface2 px-4 py-3">
            <NotifButton />
          </div>
        </div>
      )}
    </div>
  );
}
