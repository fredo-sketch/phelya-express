"use client";

import { useState, useSyncExternalStore } from "react";
import { BellRing, BellOff, Copy, Share2, Check } from "lucide-react";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CopyResi({ resi }) {
  const { toast } = useToast();
  const [ok, setOk] = useState(false);
  async function salin() {
    try {
      await navigator.clipboard.writeText(resi);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {
      toast({ type: "error", title: "Gagal menyalin", description: "Salin manual nomor resi." });
    }
  }
  return (
    <button onClick={salin} aria-label="Salin nomor resi" className="inline-flex size-8 items-center justify-center rounded-lg bg-soft text-muted hover:text-fg">
      {ok ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
    </button>
  );
}

export function ShareButton({ resi }) {
  const { toast } = useToast();
  async function bagikan() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: `Resi ${resi}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ type: "success", title: "Tautan disalin", description: "Bagikan tautan pelacakan ke siapa saja." });
      }
    } catch {
      /* dibatalkan pengguna */
    }
  }
  return (
    <Button variant="soft" size="sm" icon={Share2} onClick={bagikan}>
      Bagikan
    </Button>
  );
}

/**
 * Tombol izin notifikasi. Izin hanya diminta saat tombol diklik (interaksi pengguna).
 * Menangani: browser tidak mendukung, izin ditolak, dan izin sudah diberikan.
 * Pendaftaran Service Worker + subscription VAPID dikerjakan di tahap backend.
 */
export function NotifButton() {
  const { toast } = useToast();
  // Izin notifikasi dibaca langsung dari browser. `override` menyimpan hasil terbaru setelah diminta.
  const awal = useSyncExternalStore(
    () => () => {},
    () => {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) return "tidak_didukung";
      return Notification.permission;
    },
    () => "memuat",
  );
  const [override, setOverride] = useState(null);
  const state = override ?? awal;
  const setState = setOverride;

  async function aktifkan() {
    setState("meminta");
    try {
      const hasil = await Notification.requestPermission();
      setState(hasil);
      if (hasil === "granted") {
        toast({ type: "success", title: "Notifikasi aktif", description: "Kamu akan diberi tahu saat status paket berubah." });
      } else if (hasil === "denied") {
        toast({ type: "error", title: "Izin notifikasi ditolak", description: "Aktifkan lewat pengaturan situs di browser kamu." });
      }
    } catch {
      setState("default");
    }
  }

  if (state === "tidak_didukung")
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <BellOff className="size-4" aria-hidden /> Browser ini belum mendukung notifikasi.
      </p>
    );
  if (state === "granted")
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-primary">
        <BellRing className="size-4" aria-hidden /> Notifikasi aktif untuk perangkat ini
      </p>
    );
  if (state === "denied")
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-danger">
        <BellOff className="size-4" aria-hidden /> Izin ditolak. Ubah lewat pengaturan situs browser.
      </p>
    );
  return (
    <Button icon={BellRing} size="sm" loading={state === "meminta"} disabled={state === "memuat"} onClick={aktifkan}>
      Aktifkan Notifikasi
    </Button>
  );
}
