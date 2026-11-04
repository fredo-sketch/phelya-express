"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Send, X } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import Mascot from "@/components/ui/mascot";
import { useToast } from "@/components/ui/toast";

const MAKS_BYTE = 2 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ApplyForm({ posisi }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [f, setF] = useState({ nama: "", email: "", hp: "", kota: "", pesan: "" });
  const [cv, setCv] = useState(null);
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function pilihFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validasi di klien hanya untuk kenyamanan. Validasi sebenarnya wajib diulang di server saat upload.
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setCv(null);
      setErr((x) => ({ ...x, cv: "CV harus berformat PDF." }));
      e.target.value = "";
      return;
    }
    if (file.size > MAKS_BYTE) {
      setCv(null);
      setErr((x) => ({ ...x, cv: "Ukuran CV maksimal 2 MB." }));
      e.target.value = "";
      return;
    }
    setErr((x) => ({ ...x, cv: undefined }));
    setCv(file);
  }

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    const n = {};
    if (f.nama.trim().length < 3) n.nama = "Nama lengkap minimal 3 karakter.";
    if (!EMAIL_RE.test(f.email.trim())) n.email = "Email tidak valid.";
    if (!/^(08|\+628)\d{8,11}$/.test(f.hp.replace(/[\s-]/g, ""))) n.hp = "Nomor HP tidak valid.";
    if (!f.kota.trim()) n.kota = "Domisili wajib diisi.";
    if (!cv) n.cv = err.cv ?? "Unggah CV dalam format PDF.";
    setErr(n);
    if (Object.keys(n).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    setLoading(false);
    setSukses(true);
    toast({ type: "success", title: "Lamaran terkirim", description: `Lamaran untuk ${posisi} sudah kami terima.` });
  }

  if (sukses)
    return (
      <div className="flex flex-col items-center py-6 text-center" role="status">
        <Mascot pose="sukses" height={150} />
        <CheckCircle2 className="mt-4 size-8 text-primary" aria-hidden />
        <h3 className="mt-2 text-xl font-black">Lamaran terkirim!</h3>
        <p className="mt-1 max-w-xs text-sm text-muted">Terima kasih sudah melamar sebagai {posisi}. Tim kami akan menghubungi lewat email jika profilmu sesuai.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nama lengkap" required error={err.nama}>{(p) => <Input {...p} autoComplete="name" value={f.nama} invalid={!!err.nama} onChange={set("nama")} />}</Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" required error={err.email}>{(p) => <Input {...p} type="email" autoComplete="email" value={f.email} invalid={!!err.email} onChange={set("email")} />}</Field>
        <Field label="Nomor HP" required error={err.hp}>{(p) => <Input {...p} type="tel" inputMode="tel" value={f.hp} invalid={!!err.hp} onChange={set("hp")} />}</Field>
      </div>
      <Field label="Domisili" required error={err.kota}>{(p) => <Input {...p} value={f.kota} invalid={!!err.kota} onChange={set("kota")} placeholder="Kota tempat tinggal" />}</Field>

      <Field label="Unggah CV (PDF, maks. 2 MB)" required error={err.cv}>
        {(p) => (
          <div>
            <input ref={fileRef} {...p} type="file" accept="application/pdf,.pdf" onChange={pilihFile} className="sr-only" />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-line bg-surface2 px-4 py-4 text-left text-sm transition hover:border-primary">
              <FileUp className="size-5 text-primary" aria-hidden />
              {cv ? (
                <span className="flex-1 truncate font-bold">{cv.name} <span className="font-normal text-muted">({(cv.size / 1024).toFixed(0)} KB)</span></span>
              ) : (
                <span className="text-muted">Pilih berkas PDF dari perangkatmu</span>
              )}
              {cv && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Hapus berkas"
                  onClick={(e) => { e.stopPropagation(); setCv(null); if (fileRef.current) fileRef.current.value = ""; }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setCv(null); if (fileRef.current) fileRef.current.value = ""; } }}
                  className="inline-flex size-7 items-center justify-center rounded-full bg-soft"
                >
                  <X className="size-4" />
                </span>
              )}
            </button>
          </div>
        )}
      </Field>

      <Field label="Pesan singkat">{(p) => <Textarea {...p} value={f.pesan} onChange={set("pesan")} placeholder="Ceritakan singkat tentang dirimu (opsional)" />}</Field>
      <Button type="submit" size="lg" loading={loading} className="w-full" iconRight={Send}>{loading ? "Mengirim..." : "Kirim Lamaran"}</Button>
    </form>
  );
}
