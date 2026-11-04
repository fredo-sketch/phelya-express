"use client";

import { useMemo, useState } from "react";
import { Calculator, MapPin, Route, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import Button from "@/components/ui/button";
import Mascot from "@/components/ui/mascot";
import { KOTA, LAYANAN, hitungOngkir } from "@/lib/tariff";
import { rupiah } from "@/lib/format";

export default function TariffCalculator({ initial }) {
  const [f, setF] = useState({
    asal: initial.asal ?? "semarang",
    tujuan: initial.tujuan ?? "jakarta",
    berat: initial.berat ?? "1",
    layanan: initial.layanan ?? "reguler",
  });
  const hasil = useMemo(() => hitungOngkir(f), [f]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5 sm:p-7">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <Calculator className="size-5 text-primary" aria-hidden /> Hitung Ongkos Kirim
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Kota asal">{(p) => <Select {...p} value={f.asal} onChange={set("asal")}>{KOTA.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</Select>}</Field>
          <Field label="Kota tujuan">{(p) => <Select {...p} value={f.tujuan} onChange={set("tujuan")}>{KOTA.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</Select>}</Field>
          <Field label="Berat (kg)" hint="Dibulatkan ke atas per kilogram.">{(p) => <Input {...p} type="number" min="0.1" step="0.1" inputMode="decimal" value={f.berat} onChange={set("berat")} />}</Field>
          <Field label="Layanan">{(p) => <Select {...p} value={f.layanan} onChange={set("layanan")}>{Object.values(LAYANAN).map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}</Select>}</Field>
        </div>
      </Card>

      <Card className="flex flex-col justify-between p-5 sm:p-7" aria-live="polite">
        {f.asal === f.tujuan ? (
          <div className="py-6 text-center">
            <Mascot pose="santai" height={120} className="mx-auto" />
            <p className="mt-3 font-extrabold">Kota asal dan tujuan sama</p>
            <p className="text-sm text-muted">Pilih kota tujuan yang berbeda untuk melihat tarif.</p>
          </div>
        ) : !hasil.ok ? (
          <div role="alert" className="py-6 text-center">
            <Mascot pose="hormat" height={120} className="mx-auto" />
            <p className="mt-3 font-extrabold text-danger">{hasil.error}</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm font-bold text-muted">Estimasi ongkos kirim</p>
              <p className="mt-1 text-4xl font-black text-primary">{rupiah(hasil.ongkir)}</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted"><Route className="size-4" /> Jarak</dt><dd className="font-bold">± {hasil.jarak} km</dd></div>
                <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted"><MapPin className="size-4" /> Zona</dt><dd className="font-bold">{hasil.zona.nama}</dd></div>
                <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-muted"><Timer className="size-4" /> Estimasi tiba</dt><dd className="font-bold">{hasil.estimasi}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted">Berat tertagih</dt><dd className="font-bold">{hasil.tertagih} kg</dd></div>
              </dl>
            </div>
            <Button href="/daftar" size="lg" className="mt-7 w-full">Kirim Sekarang</Button>
          </>
        )}
      </Card>
    </div>
  );
}
