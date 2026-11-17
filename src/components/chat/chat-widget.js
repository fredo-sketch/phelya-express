"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import Mascot from "@/components/ui/mascot";
import { api } from "@/components/order-store";
import { SARAN_AWAL } from "@/lib/faq";
import { cn } from "@/lib/format";

const SAPA = { peran: "bot", teks: "Halo! Aku Phely, asisten Phelya Express. Tanya soal cek resi, tarif, layanan, packing, atau pembayaran ya." };

/** Chatbot pop-up di pojok kanan bawah: tetap di halaman yang sama, tidak membuka halaman lain. */
export default function ChatWidget() {
  const [buka, setBuka] = useState(false);
  const [pesan, setPesan] = useState([SAPA]);
  const [teks, setTeks] = useState("");
  const [kirim, setKirim] = useState(false);
  const [wa, setWa] = useState("");
  const [butuhAdmin, setButuhAdmin] = useState(false);
  const daftarRef = useRef(null);
  const inputRef = useRef(null);
  const tombolRef = useRef(null);

  // Nomor WhatsApp admin diambil sekali saat pertama dibuka
  useEffect(() => {
    if (!buka || wa) return;
    let batal = false;
    api("/api/pengaturan").then((j) => {
      if (!batal && j.ok) setWa(j.pengaturan.waAdmin);
    });
    return () => {
      batal = true;
    };
  }, [buka, wa]);

  useEffect(() => {
    if (buka) inputRef.current?.focus();
  }, [buka]);
  useEffect(() => {
    daftarRef.current?.scrollTo({ top: daftarRef.current.scrollHeight, behavior: "smooth" });
  }, [pesan, kirim]);

  function tutup() {
    setBuka(false);
    tombolRef.current?.focus();
  }

  async function tanya(isi) {
    const t = isi.trim();
    if (!t || kirim) return;
    const riwayat = pesan.filter((m) => m !== SAPA).map((m) => ({ peran: m.peran, teks: m.teks }));
    setPesan((p) => [...p, { peran: "user", teks: t }]);
    setTeks("");
    setKirim(true);
    const j = await api("/api/chat", { method: "POST", body: { pesan: t, riwayat } });
    setKirim(false);
    if (!j.ok) {
      setButuhAdmin(true);
      return setPesan((p) => [...p, { peran: "bot", teks: j.error, galat: true }]);
    }
    if (j.wa) setButuhAdmin(true);
    setPesan((p) => [...p, { peran: "bot", teks: j.jawaban, tautan: j.tautan }]);
  }

  const pertanyaanTerakhir = [...pesan].reverse().find((m) => m.peran === "user")?.teks;
  const linkWa = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Halo admin Phelya Express, saya ingin bertanya${pertanyaanTerakhir ? `: ${pertanyaanTerakhir}` : "."}`)}`
    : null;

  return (
    <>
      {buka && (
        <section
          role="dialog"
          aria-label="Chat dengan Phely"
          onKeyDown={(e) => e.key === "Escape" && tutup()}
          className="fixed bottom-24 right-4 z-[60] flex h-[min(74vh,560px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-3 text-white dark:text-[#1c1310]">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent"><Mascot pose="sapa" height={34} className="mt-1" /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <b className="block text-base">Phely</b>
              <span className="block text-xs opacity-90">Asisten Phelya Express</span>
            </span>
            <button onClick={tutup} aria-label="Tutup chat" className="inline-flex size-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"><X className="size-4" /></button>
          </header>

          <div ref={daftarRef} className="flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-4" aria-live="polite">
            {pesan.map((m, i) => (
              <div key={i} className={cn("flex", m.peran === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm", m.peran === "user" ? "rounded-br-md bg-accent text-white" : m.galat ? "rounded-bl-md bg-danger-soft text-danger" : "rounded-bl-md bg-soft")}>
                  {m.teks}
                  {m.tautan?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.tautan.map((t) => (
                        <Link key={t.href} href={t.href} onClick={tutup} className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-primary ring-1 ring-line hover:bg-primary-soft">{t.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {kirim && <p className="text-xs text-muted" role="status">Phely sedang mengetik...</p>}
            {pesan.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SARAN_AWAL.map((s) => (
                  <button key={s} onClick={() => tanya(s)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold hover:border-primary">{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-line bg-surface p-3">
            {linkWa && (
              <a
                href={linkWa}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition", butuhAdmin ? "bg-[#25D366] text-[#073b1d]" : "bg-soft text-fg/80 hover:bg-primary-soft")}
              >
                <MessageCircle className="size-4" aria-hidden /> Tanya admin via WhatsApp
              </a>
            )}
            <form onSubmit={(e) => { e.preventDefault(); tanya(teks); }} className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">Pesan untuk Phely</label>
              <input
                id="chat-input"
                ref={inputRef}
                value={teks}
                onChange={(e) => setTeks(e.target.value)}
                maxLength={500}
                placeholder="Tulis pertanyaanmu..."
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button type="submit" disabled={kirim || !teks.trim()} aria-label="Kirim" className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-50"><Send className="size-4" /></button>
            </form>
          </div>
        </section>
      )}

      <button
        ref={tombolRef}
        onClick={() => (buka ? tutup() : setBuka(true))}
        aria-expanded={buka}
        aria-label={buka ? "Tutup chat" : "Butuh bantuan? Tanya Phely"}
        className="group fixed bottom-4 right-4 z-[60] flex items-center gap-2"
      >
        {!buka && <span className="hidden rounded-full bg-surface px-4 py-2 text-sm font-bold shadow-card ring-1 ring-line transition group-hover:-translate-x-1 sm:block">Butuh bantuan? Tanya Phely!</span>}
        <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-accent shadow-[0_10px_24px_-8px_var(--accent)] ring-4 ring-bg">
          {!buka && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent" aria-hidden />}
          {buka ? <X className="relative size-7 text-white" aria-hidden /> : <Mascot pose="sapa" height={52} className="relative mt-2 drop-shadow-none" />}
        </span>
      </button>
    </>
  );
}
