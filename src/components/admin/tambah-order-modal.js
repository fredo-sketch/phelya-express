"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MapPin, Search, Store, Truck, UserRound, Users } from "lucide-react";
import Modal from "@/components/admin/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import Button from "@/components/ui/button";
import MapPickerLoader from "@/components/tracking/map-picker-loader";
import RincianBiaya from "@/components/ui/rincian-biaya";
import TombolBayar from "@/components/ui/tombol-bayar";
import { useToast } from "@/components/ui/toast";
import { api, useOrders } from "@/components/order-store";
import { KOTA, LAYANAN, kotaById } from "@/lib/tariff";
import { useOngkir } from "@/lib/use-ongkir";
import { cn, rupiah } from "@/lib/format";

const HP_RE = /^(08|\+628)\d{8,11}$/;
const bersih = (v) => String(v ?? "").replace(/[\s-]/g, "");
const AWAL = {
  tipe: "umum", member: null,
  pNama: "", pHp: "", pKota: "semarang", pAlamat: "",
  rNama: "", rHp: "", rKota: "jakarta", rAlamat: "",
  isi: "", berat: "1", catatan: "", layanan: "reguler", packing: "tidak",
  metode: "antar_sendiri", jAlamat: "", pin: null, bayar: "tunai",
};

/** Pop-up "Tambah Order": admin menginput pesanan pelanggan yang datang langsung ke kantor. */
export default function TambahOrderModal({ onClose }) {
  const { toast } = useToast();
  const { tambahOrderAdmin } = useOrders();
  const [f, setF] = useState(AWAL);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [selesai, setSelesai] = useState(null);
  const [packingList, setPackingList] = useState([]);
  const [aturan, setAturan] = useState(null);
  const [q, setQ] = useState("");
  const [cari, setCari] = useState({ memuat: false, hasil: [] });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const adalahMember = f.tipe === "member";

  useEffect(() => {
    let batal = false;
    Promise.all([api("/api/packing"), api("/api/pengaturan")]).then(([p, a]) => {
      if (batal) return;
      if (p.ok) setPackingList(p.packing);
      if (a.ok) setAturan(a.pengaturan);
    });
    return () => {
      batal = true;
    };
  }, []);

  // Pencarian member (nama / HP / email), ditunda 300 ms supaya tidak memanggil server tiap ketukan
  useEffect(() => {
    if (!adalahMember || f.member || q.trim().length < 2) return;
    let batal = false;
    const t = setTimeout(async () => {
      setCari((c) => ({ ...c, memuat: true }));
      const j = await api(`/api/pelanggan/cari?q=${encodeURIComponent(q.trim())}`);
      if (!batal) setCari({ memuat: false, hasil: j.ok ? j.hasil : [] });
    }, 300);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [q, adalahMember, f.member]);

  const kg = Number(f.berat);
  const jemputBolehBerat = !aturan || kg >= aturan.jemputMinBerat;
  const jemputTersedia = adalahMember && jemputBolehBerat;
  const jemput = f.metode === "jemput" && jemputTersedia;
  const { rincian, semua } = useOngkir({
    asal: f.pKota, tujuan: f.rKota, berat: f.berat, layanan: f.layanan, packing: f.packing,
    metode: jemput ? "jemput" : "antar_sendiri", jemputLat: jemput && f.pin ? f.pin[0] : null, jemputLng: jemput && f.pin ? f.pin[1] : null,
    member: adalahMember,
  });

  function pilihTipe(tipe) {
    setF((x) => ({ ...AWAL, ...{ rNama: x.rNama, rHp: x.rHp, rKota: x.rKota, rAlamat: x.rAlamat, isi: x.isi, berat: x.berat, catatan: x.catatan, layanan: x.layanan, packing: x.packing, bayar: x.bayar }, tipe }));
    setQ("");
    setCari({ memuat: false, hasil: [] });
    setErr({});
  }
  function pilihMember(m) {
    setF((x) => ({ ...x, member: m, pNama: m.nama, pHp: m.hp, pKota: m.kota ?? x.pKota, pin: null }));
    setQ("");
  }

  function validasi() {
    const n = {};
    if (adalahMember && !f.member) n.member = "Pilih pelanggan membership terlebih dahulu.";
    if (f.pNama.trim().length < 2) n.pNama = "Nama minimal 2 karakter.";
    if (!HP_RE.test(bersih(f.pHp))) n.pHp = "Nomor HP tidak valid.";
    if (f.pAlamat.trim().length < 5) n.pAlamat = "Alamat minimal 5 karakter.";
    if (f.rNama.trim().length < 2) n.rNama = "Nama penerima minimal 2 karakter.";
    if (!HP_RE.test(bersih(f.rHp))) n.rHp = "Nomor HP tidak valid.";
    if (f.rAlamat.trim().length < 5) n.rAlamat = "Alamat tujuan minimal 5 karakter.";
    if (f.rKota === f.pKota) n.rKota = "Kota tujuan tidak boleh sama dengan kota asal.";
    if (f.isi.trim().length < 2) n.isi = "Isi paket wajib diisi.";
    if (!(kg > 0 && kg <= 100)) n.berat = "Berat harus antara 0 dan 100 kg.";
    if (jemput) {
      if (f.jAlamat.trim().length < 5) n.jAlamat = "Alamat jemput minimal 5 karakter.";
      if (!f.pin) n.pin = "Tandai titik jemput di peta.";
    }
    if (!rincian.ok && !n.berat) n.biaya = rincian.error || "Tunggu perhitungan biaya selesai.";
    return n;
  }

  async function simpan(e) {
    e.preventDefault();
    if (busy) return;
    const n = validasi();
    setErr(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    const j = await tambahOrderAdmin({
      tipe: f.tipe, memberId: f.member?.id,
      pNama: f.pNama, pHp: f.pHp, pKota: f.pKota, pAlamat: f.pAlamat,
      rNama: f.rNama, rHp: f.rHp, rKota: f.rKota, rAlamat: f.rAlamat,
      isi: f.isi, berat: kg, catatan: f.catatan, layanan: f.layanan, packing: f.packing,
      metode: jemput ? "jemput" : "antar_sendiri",
      jemputAlamat: jemput ? f.jAlamat : undefined, jemputLat: jemput ? f.pin?.[0] : undefined, jemputLng: jemput ? f.pin?.[1] : undefined,
      bayar: f.bayar,
    });
    setBusy(false);
    if (!j.ok) return toast({ type: "error", title: "Order belum tersimpan", description: j.error });
    toast({ type: "success", title: "Order berhasil ditambahkan", description: `Nomor resi ${j.resi}.` });
    setSelesai({ resi: j.resi, total: j.total, bayar: j.bayar });
  }

  const kotaOpsi = KOTA.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>);
  const pilihan = (aktif) => cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 transition", aktif ? "border-accent bg-accent-soft/40" : "border-line hover:border-primary");

  if (selesai)
    return (
      <Modal judul="Order ditambahkan" onClose={onClose}>
        <div className="space-y-3 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-white dark:text-[#1c1310]"><Check className="size-7" aria-hidden /></span>
          <p className="text-sm text-muted">Nomor resi</p>
          <p className="font-mono text-2xl font-black">{selesai.resi}</p>
          <p className="text-sm">Total <b>{rupiah(selesai.total)}</b> · {selesai.bayar === "lunas" ? "Dibayar tunai (lunas)" : "Menunggu pembayaran Midtrans"}</p>
        </div>
        {selesai.bayar !== "lunas" && <TombolBayar resi={selesai.resi} className="flex flex-wrap justify-center gap-2" />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" href={`/api/orders/${selesai.resi}/label`} target="_blank" rel="noopener" prefetch={false}>Cetak Label</Button>
          <Button onClick={onClose}>Selesai</Button>
        </div>
      </Modal>
    );

  return (
    <Modal judul="Tambah Order" onClose={() => !busy && onClose()} lebar="max-w-3xl">
      <form onSubmit={simpan} noValidate className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-base font-black">Jenis pelanggan</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Jenis pelanggan">
            <label className={pilihan(adalahMember)}>
              <input type="radio" name="tipe" checked={adalahMember} onChange={() => pilihTipe("member")} className="mt-1 size-5 accent-[var(--accent)]" />
              <span><span className="flex items-center gap-2 font-extrabold"><UserRound className="size-4" aria-hidden />Pelanggan Membership</span><span className="block text-xs text-muted">Sudah terdaftar. Cari nama atau nomor HP, data terisi otomatis.</span></span>
            </label>
            <label className={pilihan(!adalahMember)}>
              <input type="radio" name="tipe" checked={!adalahMember} onChange={() => pilihTipe("umum")} className="mt-1 size-5 accent-[var(--accent)]" />
              <span><span className="flex items-center gap-2 font-extrabold"><Users className="size-4" aria-hidden />Pelanggan Umum / Baru</span><span className="block text-xs text-muted">Isi data manual. Tanpa harga khusus member.</span></span>
            </label>
          </div>
        </fieldset>

        <section className="space-y-4">
          <h3 className="text-base font-black">Data pengirim</h3>
          {adalahMember && !f.member && (
            <div>
              <Field label="Cari pelanggan membership" required error={err.member}>
                {(p) => <Input {...p} icon={Search} value={q} invalid={!!err.member} onChange={(e) => setQ(e.target.value)} placeholder="Ketik nama, nomor HP, atau email (min. 2 huruf)" autoComplete="off" />}
              </Field>
              {q.trim().length >= 2 && (
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line" aria-label="Hasil pencarian">
                  {cari.memuat && <li className="px-4 py-3 text-sm text-muted">Mencari...</li>}
                  {!cari.memuat && cari.hasil.length === 0 && <li className="px-4 py-3 text-sm text-muted">Tidak ada member yang cocok.</li>}
                  {cari.hasil.map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => pilihMember(m)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-surface2">
                        <span><b>{m.nama}</b><span className="block text-xs text-muted">{m.email} · {m.hp || "HP belum diisi"}</span></span>
                        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-deep">{m.tier}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {adalahMember && f.member && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface2 px-4 py-3 text-sm">
              <span><b>{f.member.nama}</b> <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-deep">{f.member.tier}</span><span className="block text-xs text-muted">{f.member.email}</span></span>
              <Button size="sm" variant="secondary" onClick={() => setF((x) => ({ ...x, member: null, pNama: "", pHp: "", pin: null, metode: "antar_sendiri" }))}>Ganti</Button>
            </div>
          )}
          {(!adalahMember || f.member) && (
            <>
              {!adalahMember && <Field label="Nama pengirim" required error={err.pNama}>{(p) => <Input {...p} value={f.pNama} invalid={!!err.pNama} onChange={set("pNama")} />}</Field>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nomor HP" required error={err.pHp}>{(p) => <Input {...p} type="tel" inputMode="tel" value={f.pHp} invalid={!!err.pHp} onChange={set("pHp")} />}</Field>
                <Field label="Kota asal" required>{(p) => <Select {...p} value={f.pKota} onChange={(e) => setF((x) => ({ ...x, pKota: e.target.value, pin: null }))}>{kotaOpsi}</Select>}</Field>
              </div>
              <Field label="Alamat lengkap pengirim" required error={err.pAlamat}>{(p) => <Textarea {...p} value={f.pAlamat} invalid={!!err.pAlamat} onChange={set("pAlamat")} placeholder="Jalan, nomor, kelurahan, kecamatan" />}</Field>
            </>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-base font-black">Data penerima</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama penerima" required error={err.rNama}>{(p) => <Input {...p} value={f.rNama} invalid={!!err.rNama} onChange={set("rNama")} />}</Field>
            <Field label="Nomor HP" required error={err.rHp}>{(p) => <Input {...p} type="tel" inputMode="tel" value={f.rHp} invalid={!!err.rHp} onChange={set("rHp")} />}</Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Kota tujuan" required error={err.rKota}>{(p) => <Select {...p} value={f.rKota} invalid={!!err.rKota} onChange={set("rKota")}>{kotaOpsi}</Select>}</Field>
            <Field label="Alamat lengkap tujuan" required error={err.rAlamat}>{(p) => <Textarea {...p} value={f.rAlamat} invalid={!!err.rAlamat} onChange={set("rAlamat")} />}</Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-base font-black">Detail paket dan layanan</h3>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Isi paket" required error={err.isi}>{(p) => <Input {...p} value={f.isi} invalid={!!err.isi} onChange={set("isi")} />}</Field>
            <Field label="Berat (kg)" required error={err.berat}>{(p) => <Input {...p} type="number" min="0.1" step="0.1" inputMode="decimal" value={f.berat} invalid={!!err.berat} onChange={set("berat")} />}</Field>
          </div>
          <Field label="Catatan untuk kurir">{(p) => <Input {...p} value={f.catatan} onChange={set("catatan")} placeholder="Opsional" />}</Field>
          <Field label="Layanan" required>
            {(p) => (
              <Select {...p} value={f.layanan} onChange={set("layanan")}>
                {Object.values(LAYANAN).map((l) => {
                  const h = semua?.[l.id];
                  return <option key={l.id} value={l.id} disabled={h && !h.ok}>{l.nama}{h?.ok ? ` · ${rupiah(h.ongkir)}` : h ? ` · ${h.error}` : ""}</option>;
                })}
              </Select>
            )}
          </Field>
          <div>
            <p className="mb-2 text-sm font-bold">Packing tambahan</p>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Packing tambahan">
              {packingList.map((pk) => (
                <label key={pk.id} className={pilihan(f.packing === pk.id)}>
                  <input type="radio" name="packing" value={pk.id} checked={f.packing === pk.id} onChange={set("packing")} className="mt-1 size-5 accent-[var(--accent)]" />
                  <span className="flex-1"><span className="block font-extrabold">{pk.nama}</span><span className="block text-xs text-muted">{pk.deskripsi}</span></span>
                  <span className="text-sm font-black">{pk.harga ? `+ ${rupiah(pk.harga)}` : "Gratis"}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Cara paket sampai ke Phelya</p>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Cara serah paket">
              <label className={pilihan(!jemput)}>
                <input type="radio" name="metode" checked={!jemput} onChange={() => setF((x) => ({ ...x, metode: "antar_sendiri" }))} className="mt-1 size-5 accent-[var(--accent)]" />
                <span><span className="flex items-center gap-2 font-extrabold"><Store className="size-4" aria-hidden />Diantar ke kantor</span><span className="block text-xs text-muted">Paket diterima langsung di kantor. Gratis.</span></span>
              </label>
              <label className={cn(pilihan(jemput), !jemputTersedia && "cursor-not-allowed opacity-60 hover:border-line")}>
                <input type="radio" name="metode" checked={jemput} disabled={!jemputTersedia} onChange={() => setF((x) => ({ ...x, metode: "jemput" }))} className="mt-1 size-5 accent-[var(--accent)]" />
                <span>
                  <span className="flex items-center gap-2 font-extrabold"><Truck className="size-4" aria-hidden />Dijemput kurir</span>
                  <span className="block text-xs text-muted">
                    {!adalahMember ? "Khusus pelanggan membership." : !jemputBolehBerat ? `Minimal ${aturan?.jemputMinBerat} kg.` : aturan ? `Maks. ${aturan.jemputMaksKm} km dari kantor. ${rupiah(aturan.jemputBiayaDasar)} + ${rupiah(aturan.jemputBiayaPerKm)}/km.` : "Memuat..."}
                  </span>
                </span>
              </label>
            </div>
            {jemput && (
              <div className="mt-4 space-y-4 rounded-2xl border border-line bg-surface2 p-4">
                <Field label="Alamat jemput" required error={err.jAlamat}>{(p) => <Textarea {...p} value={f.jAlamat} invalid={!!err.jAlamat} onChange={set("jAlamat")} />}</Field>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold"><MapPin className="size-4 text-accent" aria-hidden />Tandai titik jemput di peta <span className="text-danger">*</span></p>
                  <MapPickerLoader kotaId={f.pKota} value={f.pin} onChange={(v) => setF((x) => ({ ...x, pin: v }))} />
                  <p className={cn("mt-2 text-xs", err.pin ? "font-semibold text-danger" : "text-muted")} role={err.pin ? "alert" : undefined}>{err.pin ?? (f.pin ? `Titik dipilih: ${f.pin[0].toFixed(4)}, ${f.pin[1].toFixed(4)}` : "Klik peta untuk menaruh pin.")}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-black">Pembayaran</h3>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Metode pembayaran">
            <label className={pilihan(f.bayar === "tunai")}>
              <input type="radio" name="bayar" checked={f.bayar === "tunai"} onChange={() => setF((x) => ({ ...x, bayar: "tunai" }))} className="mt-1 size-5 accent-[var(--accent)]" />
              <span><span className="block font-extrabold">Tunai (lunas)</span><span className="block text-xs text-muted">Pelanggan membayar di kantor sekarang.</span></span>
            </label>
            <label className={pilihan(f.bayar === "midtrans")}>
              <input type="radio" name="bayar" checked={f.bayar === "midtrans"} onChange={() => setF((x) => ({ ...x, bayar: "midtrans" }))} className="mt-1 size-5 accent-[var(--accent)]" />
              <span><span className="block font-extrabold">Midtrans</span><span className="block text-xs text-muted">Bayar non-tunai (QRIS, VA, e-wallet) lewat Midtrans.</span></span>
            </label>
          </div>
        </section>

        <div className="rounded-2xl border border-line bg-surface2 p-4" aria-live="polite">
          <p className="mb-3 text-sm font-extrabold">Rincian biaya {adalahMember ? "(harga member)" : ""}</p>
          {rincian.ok ? (
            <RincianBiaya ongkir={rincian.ongkir} packing={rincian.packing} packingNama={packingList.find((x) => x.id === f.packing)?.nama} tampilJemput={jemput} jemput={rincian.jemput.biaya} jemputKm={rincian.jemput.jarakKm} diskon={rincian.diskon} total={rincian.total} />
          ) : (
            <p className="text-sm text-muted">{rincian.loading ? "Menghitung..." : rincian.error}</p>
          )}
          <p className="mt-3 text-xs text-muted">Total resmi dihitung ulang oleh server saat disimpan.</p>
          {err.biaya && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{err.biaya}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Batal</Button>
          <Button type="submit" loading={busy}>Simpan Order</Button>
        </div>
      </form>
    </Modal>
  );
}
