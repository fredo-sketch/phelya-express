"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ImagePlus, MapPin, PackageCheck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import Button from "@/components/ui/button";
import MapPickerLoader from "@/components/tracking/map-picker-loader";
import { useToast } from "@/components/ui/toast";
import { useOrders } from "@/components/order-store";
import { PELANGGAN_AKTIF } from "@/data/mock";
import { KOTA, LAYANAN, hitungOngkir, kotaById } from "@/lib/tariff";
import { cn, rupiah } from "@/lib/format";

const LANGKAH = ["Pengirim", "Penerima", "Detail Barang", "Layanan & Ongkir"];
const HP_RE = /^(08|\+628)\d{8,11}$/;
const MAKS_FOTO = 2 * 1024 * 1024;

function noResi(orders) {
  const n = orders.length + 1;
  return `PEX26110${String(n).padStart(5, "0")}`.slice(0, 13);
}

export default function BuatPesanan() {
  const router = useRouter();
  const { toast } = useToast();
  const { orders, tambahOrder } = useOrders();
  const fotoRef = useRef(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});
  const [f, setF] = useState({
    pNama: PELANGGAN_AKTIF.nama, pHp: PELANGGAN_AKTIF.hp, pKota: "semarang", pAlamat: "", pPin: null,
    rNama: "", rHp: "", rKota: "jakarta", rAlamat: "", rPin: null,
    isi: "", berat: "1", catatan: "", layanan: "reguler",
  });
  const [foto, setFoto] = useState(null); // { file, url }
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const ongkir = useMemo(() => hitungOngkir({ asal: f.pKota, tujuan: f.rKota, berat: f.berat, layanan: f.layanan }), [f.pKota, f.rKota, f.berat, f.layanan]);

  function validasi(s) {
    const n = {};
    if (s === 0) {
      if (f.pNama.trim().length < 3) n.pNama = "Nama pengirim minimal 3 karakter.";
      if (!HP_RE.test(f.pHp.replace(/[\s-]/g, ""))) n.pHp = "Nomor HP tidak valid.";
      if (f.pAlamat.trim().length < 10) n.pAlamat = "Alamat lengkap minimal 10 karakter.";
    }
    if (s === 1) {
      if (f.rNama.trim().length < 3) n.rNama = "Nama penerima minimal 3 karakter.";
      if (!HP_RE.test(f.rHp.replace(/[\s-]/g, ""))) n.rHp = "Nomor HP tidak valid.";
      if (f.rAlamat.trim().length < 10) n.rAlamat = "Alamat lengkap minimal 10 karakter.";
      if (f.rKota === f.pKota) n.rKota = "Kota tujuan tidak boleh sama dengan kota asal.";
    }
    if (s === 2) {
      if (f.isi.trim().length < 3) n.isi = "Isi paket wajib diisi.";
      const kg = Number(f.berat);
      if (!kg || kg <= 0) n.berat = "Berat harus lebih dari 0 kg.";
      else if (kg > 100) n.berat = "Berat maksimal 100 kg.";
    }
    if (s === 3 && !ongkir.ok) n.layanan = ongkir.error;
    return n;
  }

  function lanjut() {
    const n = validasi(step);
    setErr(n);
    if (Object.keys(n).length === 0) setStep((s) => s + 1);
  }

  function pilihFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErr((x) => ({ ...x, foto: "Foto harus berformat JPG, PNG, atau WebP." }));
      e.target.value = "";
      return;
    }
    if (file.size > MAKS_FOTO) {
      setErr((x) => ({ ...x, foto: "Ukuran foto maksimal 2 MB." }));
      e.target.value = "";
      return;
    }
    if (foto) URL.revokeObjectURL(foto.url);
    setErr((x) => ({ ...x, foto: undefined }));
    setFoto({ file, url: URL.createObjectURL(file) });
  }

  function hapusFoto() {
    if (foto) URL.revokeObjectURL(foto.url);
    setFoto(null);
    if (fotoRef.current) fotoRef.current.value = "";
  }

  async function kirim() {
    if (loading) return;
    const n = validasi(3);
    setErr(n);
    if (Object.keys(n).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    const resi = noResi(orders);
    const waktu = new Date().toISOString();
    tambahOrder({
      resi,
      ownerId: PELANGGAN_AKTIF.id,
      pengirim: { nama: f.pNama, hp: f.pHp, kota: f.pKota, alamat: f.pAlamat },
      penerima: { nama: f.rNama, hp: f.rHp, kota: f.rKota, alamat: f.rAlamat },
      barang: { isi: f.isi, berat: Number(f.berat) },
      layanan: f.layanan,
      ongkir: ongkir.ongkir,
      bayar: "menunggu",
      status: "menunggu_kurir",
      kurirId: null,
      dibuat: waktu,
      estimasi: new Date(Date.now() + 2 * 86400000).toISOString(),
      timeline: [{ waktu, judul: "Pesanan dibuat", lokasi: kotaById(f.pKota)?.nama ?? "-", deskripsi: "Menunggu kurir ditugaskan untuk penjemputan." }],
    });
    toast({ type: "success", title: "Pesanan berhasil dibuat", description: `Nomor resi ${resi}.` });
    router.push(`/dashboard/pesanan/${resi}`);
  }

  const kotaOpsi = KOTA.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-black">Buat Pesanan</h1>
        <p className="text-muted">Isi data pengiriman dalam 4 langkah singkat.</p>
      </div>

      <ol className="grid grid-cols-4 gap-2" aria-label="Langkah pembuatan pesanan">
        {LANGKAH.map((l, i) => (
          <li key={l} aria-current={i === step ? "step" : undefined} className="flex flex-col items-center gap-2 text-center">
            <span className={cn("flex size-9 items-center justify-center rounded-full text-sm font-extrabold transition", i < step ? "bg-primary text-white dark:text-[#1c1310]" : i === step ? "bg-accent text-white" : "bg-soft text-muted")}>
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("text-xs font-bold sm:text-sm", i === step ? "text-fg" : "text-muted")}>{l}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5 sm:p-7">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black">Data Pengirim</h2>
              <Field label="Nama pengirim" required error={err.pNama}>{(p) => <Input {...p} value={f.pNama} invalid={!!err.pNama} onChange={set("pNama")} />}</Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nomor HP" required error={err.pHp}>{(p) => <Input {...p} type="tel" inputMode="tel" value={f.pHp} invalid={!!err.pHp} onChange={set("pHp")} />}</Field>
                <Field label="Kota asal" required>{(p) => <Select {...p} value={f.pKota} onChange={(e) => setF((x) => ({ ...x, pKota: e.target.value, pPin: null }))}>{kotaOpsi}</Select>}</Field>
              </div>
              <Field label="Alamat lengkap penjemputan" required error={err.pAlamat}>{(p) => <Textarea {...p} value={f.pAlamat} invalid={!!err.pAlamat} onChange={set("pAlamat")} placeholder="Jalan, nomor, kelurahan, kecamatan" />}</Field>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold"><MapPin className="size-4 text-accent" aria-hidden />Pilih titik jemput di peta (opsional)</p>
                <MapPickerLoader kotaId={f.pKota} value={f.pPin} onChange={(v) => setF((x) => ({ ...x, pPin: v }))} />
                <p className="mt-2 text-xs text-muted">{f.pPin ? `Titik dipilih: ${f.pPin[0].toFixed(4)}, ${f.pPin[1].toFixed(4)}` : "Klik peta untuk menaruh pin."}</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black">Data Penerima</h2>
              <Field label="Nama penerima" required error={err.rNama}>{(p) => <Input {...p} value={f.rNama} invalid={!!err.rNama} onChange={set("rNama")} />}</Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nomor HP" required error={err.rHp}>{(p) => <Input {...p} type="tel" inputMode="tel" value={f.rHp} invalid={!!err.rHp} onChange={set("rHp")} />}</Field>
                <Field label="Kota tujuan" required error={err.rKota}>{(p) => <Select {...p} value={f.rKota} invalid={!!err.rKota} onChange={(e) => setF((x) => ({ ...x, rKota: e.target.value, rPin: null }))}>{kotaOpsi}</Select>}</Field>
              </div>
              <Field label="Alamat lengkap tujuan" required error={err.rAlamat}>{(p) => <Textarea {...p} value={f.rAlamat} invalid={!!err.rAlamat} onChange={set("rAlamat")} placeholder="Jalan, nomor, kelurahan, kecamatan" />}</Field>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-bold"><MapPin className="size-4 text-accent" aria-hidden />Tandai titik tujuan di peta (opsional)</p>
                <MapPickerLoader kotaId={f.rKota} value={f.rPin} onChange={(v) => setF((x) => ({ ...x, rPin: v }))} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black">Detail Barang</h2>
              <Field label="Isi paket" required error={err.isi}>{(p) => <Input {...p} value={f.isi} invalid={!!err.isi} onChange={set("isi")} placeholder="Contoh: Pakaian batik" />}</Field>
              <Field label="Berat (kg)" required error={err.berat} hint="Dibulatkan ke atas per kilogram.">{(p) => <Input {...p} type="number" min="0.1" step="0.1" inputMode="decimal" value={f.berat} invalid={!!err.berat} onChange={set("berat")} />}</Field>
              <Field label="Catatan untuk kurir">{(p) => <Textarea {...p} value={f.catatan} onChange={set("catatan")} placeholder="Opsional, mis. barang mudah pecah" />}</Field>
              <Field label="Foto barang (JPG/PNG/WebP, maks. 2 MB)" error={err.foto}>
                {(p) => (
                  <div>
                    <input ref={fotoRef} {...p} type="file" accept="image/jpeg,image/png,image/webp" onChange={pilihFoto} className="sr-only" />
                    {foto ? (
                      <div className="flex items-center gap-4 rounded-xl bg-surface2 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={foto.url} alt="Pratinjau foto barang" className="size-20 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1 text-sm"><p className="truncate font-bold">{foto.file.name}</p><p className="text-muted">{(foto.file.size / 1024).toFixed(0)} KB</p></div>
                        <button type="button" onClick={hapusFoto} aria-label="Hapus foto" className="inline-flex size-9 items-center justify-center rounded-full bg-soft"><X className="size-4" /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fotoRef.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-surface2 px-4 py-7 text-sm text-muted transition hover:border-primary">
                        <ImagePlus className="size-5 text-primary" aria-hidden /> Pilih foto barang
                      </button>
                    )}
                  </div>
                )}
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black">Pilih Layanan</h2>
              <div className="space-y-3" role="radiogroup" aria-label="Layanan pengiriman">
                {Object.values(LAYANAN).map((l) => {
                  const hasil = hitungOngkir({ asal: f.pKota, tujuan: f.rKota, berat: f.berat, layanan: l.id });
                  const on = f.layanan === l.id;
                  return (
                    <label key={l.id} className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition", on ? "border-accent bg-accent-soft/40" : "border-line hover:border-primary", !hasil.ok && "opacity-60")}>
                      <input type="radio" name="layanan" value={l.id} checked={on} onChange={set("layanan")} className="size-5 accent-[var(--accent)]" />
                      <span className="flex-1">
                        <span className="block font-extrabold">{l.nama}</span>
                        <span className="block text-sm text-muted">{hasil.ok ? `Estimasi ${hasil.estimasi}` : hasil.error}</span>
                      </span>
                      {hasil.ok && <span className="font-black">{rupiah(hasil.ongkir)}</span>}
                    </label>
                  );
                })}
              </div>
              {err.layanan && <p role="alert" className="text-sm font-semibold text-danger">{err.layanan}</p>}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => { setErr({}); setStep((s) => s - 1); }} disabled={step === 0 || loading}>Kembali</Button>
            {step < 3 ? (
              <Button iconRight={ArrowRight} onClick={lanjut}>Lanjut</Button>
            ) : (
              <Button icon={PackageCheck} loading={loading} onClick={kirim} disabled={!ongkir.ok}>{loading ? "Membuat pesanan..." : "Buat Pesanan"}</Button>
            )}
          </div>
        </Card>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5 sm:p-6" aria-live="polite">
            <h2 className="text-lg font-black">Ringkasan Ongkir</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Rute</dt><dd className="font-bold">{kotaById(f.pKota)?.nama} → {kotaById(f.rKota)?.nama}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Berat</dt><dd className="font-bold">{f.berat || 0} kg</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Layanan</dt><dd className="font-bold">{LAYANAN[f.layanan].nama}</dd></div>
              {ongkir.ok && (
                <>
                  <div className="flex justify-between"><dt className="text-muted">Zona</dt><dd className="font-bold">{ongkir.zona.nama.split("·")[0].trim()}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Estimasi</dt><dd className="font-bold">{ongkir.estimasi}</dd></div>
                </>
              )}
            </dl>
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-sm text-muted">Total ongkos kirim</p>
              <p className="text-3xl font-black text-primary">{ongkir.ok ? rupiah(ongkir.ongkir) : "—"}</p>
              {!ongkir.ok && <p className="mt-1 text-xs text-danger">{ongkir.error}</p>}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
