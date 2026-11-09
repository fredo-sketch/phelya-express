"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BellRing, BellOff, Copy, Share2, Check } from "lucide-react";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { aktifkanPush, matikanPush, pushDidukung, sudahBerlangganan } from "@/lib/push";

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
 * Tombol notifikasi push. Izin hanya diminta saat tombol diklik.
 * Tanpa `resi` = langganan akun (profil/lonceng); dengan `resi` = langganan tamu untuk satu paket.
 */
export function NotifButton({ resi } = {}) {
  const { toast } = useToast();
  // Status awal dibaca dari browser; `override` menyimpan hasil terbaru setelah aksi.
  const awal = useSyncExternalStore(
    () => () => {},
    () => (pushDidukung() ? Notification.permission : "tidak_didukung"),
    () => "memuat",
  );
  const [override, setOverride] = useState(null);
  const [aktif, setAktif] = useState(null);
  const state = override ?? awal;

  useEffect(() => {
    let batal = false;
    sudahBerlangganan().then((v) => !batal && setAktif(v));
    return () => {
      batal = true;
    };
  }, []);

  async function aktifkan() {
    setOverride("meminta");
    const j = await aktifkanPush({ resi });
    if (j.ok) {
      setOverride("granted");
      setAktif(true);
      toast({ type: "success", title: "Notifikasi aktif", description: resi ? "Kamu akan diberi tahu saat status paket ini berubah." : "Kamu akan diberi tahu saat ada pembaruan." });
    } else {
      setOverride(j.izin === "denied" ? "denied" : Notification.permission);
      toast({ type: "error", title: "Notifikasi belum aktif", description: j.error });
    }
  }

  async function matikan() {
    setOverride("meminta");
    await matikanPush();
    setAktif(false);
    setOverride(null);
    toast({ type: "info", title: "Notifikasi dimatikan untuk perangkat ini" });
  }

  if (state === "tidak_didukung")
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <BellOff className="size-4" aria-hidden /> Browser ini belum mendukung notifikasi.
      </p>
    );
  if (state === "denied")
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-danger">
        <BellOff className="size-4" aria-hidden /> Izin ditolak. Ubah lewat pengaturan situs browser.
      </p>
    );
  if (aktif && state === "granted")
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex items-center gap-2 text-sm font-bold text-primary">
          <BellRing className="size-4" aria-hidden /> Notifikasi aktif di perangkat ini
        </p>
        <Button variant="soft" size="sm" onClick={matikan}>Matikan</Button>
      </div>
    );
  return (
    <Button icon={BellRing} size="sm" loading={state === "meminta"} disabled={state === "memuat"} onClick={aktifkan}>
      Aktifkan Notifikasi
    </Button>
  );
}
