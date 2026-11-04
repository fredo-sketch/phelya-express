"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, PackageSearch, Calculator, Plus, ScanLine, Search, X } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { KOTA } from "@/lib/tariff";
import { cn } from "@/lib/format";

const TABS = [
  { id: "lacak", label: "Lacak Paket", icon: PackageSearch },
  { id: "tarif", label: "Cek Tarif", icon: Calculator },
  { id: "drop", label: "Cari Drop Point", icon: MapPin },
];

const CONTOH = ["PEX2610310001", "PEX2610309887", "PEX2610308333"];
const RESI_REGEX = /^PEX\d{10}$/;

export default function SearchCard() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("lacak");
  const [resi, setResi] = useState([""]);
  const [errLacak, setErrLacak] = useState("");
  const [tarif, setTarif] = useState({ asal: "semarang", tujuan: "jakarta", berat: "1" });
  const [errTarif, setErrTarif] = useState("");
  const [drop, setDrop] = useState("");
  const [loading, setLoading] = useState(false);

  function submitLacak(e) {
    e.preventDefault();
    const list = resi.map((r) => r.trim().toUpperCase()).filter(Boolean);
    if (!list.length) return setErrLacak("Nomor resi wajib diisi.");
    const salah = list.find((r) => !RESI_REGEX.test(r));
    if (salah) return setErrLacak(`Format resi "${salah}" tidak valid. Contoh: PEX2610310001.`);
    setErrLacak("");
    setLoading(true);
    router.push(list.length === 1 ? `/lacak/${list[0]}` : `/lacak?resi=${list.join(",")}`);
  }

  function submitTarif(e) {
    e.preventDefault();
    const kg = Number(tarif.berat);
    if (!kg || kg <= 0) return setErrTarif("Berat harus lebih dari 0 kg.");
    if (tarif.asal === tarif.tujuan) return setErrTarif("Kota asal dan tujuan tidak boleh sama.");
    setErrTarif("");
    setLoading(true);
    router.push(`/cek-tarif?asal=${tarif.asal}&tujuan=${tarif.tujuan}&berat=${kg}`);
  }

  function submitDrop(e) {
    e.preventDefault();
    if (!drop.trim()) return;
    toast({ type: "info", title: "Pencarian drop point segera hadir", description: "Fitur peta drop point akan dibuka di versi berikutnya." });
  }

  return (
    <div className="relative z-30 mx-auto -mt-28 max-w-5xl px-4 sm:px-6 md:-mt-36">
      <div className="rounded-3xl border border-line bg-surface p-3 shadow-[0_30px_60px_-30px_rgb(62_41_34/0.45)] sm:p-4">
        <div role="tablist" aria-label="Pilih layanan pencarian" className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface2 p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-extrabold transition sm:text-[15px]",
                tab === t.id ? "bg-surface text-primary shadow" : "text-muted hover:text-fg",
              )}
            >
              <t.icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-2 pt-4 sm:p-4">
          {tab === "lacak" && (
            <form id="panel-lacak" role="tabpanel" aria-labelledby="tab-lacak" onSubmit={submitLacak} noValidate>
              <div className="space-y-3">
                {resi.map((val, i) => (
                  <div key={i} className="flex gap-3">
                    <Field className="flex-1" error={i === 0 ? errLacak : ""}>
                      {(p) => (
                        <Input
                          {...p}
                          icon={Search}
                          value={val}
                          invalid={!!errLacak && i === 0}
                          onChange={(e) => setResi((r) => r.map((x, j) => (j === i ? e.target.value : x)))}
                          placeholder="Masukkan nomor resi, contoh: PEX2610310001"
                          autoComplete="off"
                          aria-label={`Nomor resi ${i + 1}`}
                          right={<ScanLine className="mr-2 size-5 text-muted" aria-hidden />}
                        />
                      )}
                    </Field>
                    {i === 0 ? (
                      <Button type="submit" size="lg" loading={loading} className="h-12 shrink-0">
                        Lacak
                      </Button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Hapus resi"
                        onClick={() => setResi((r) => r.filter((_, j) => j !== i))}
                        className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-soft"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  disabled={resi.length >= 5}
                  onClick={() => setResi((r) => [...r, ""])}
                  className="inline-flex items-center gap-1.5 font-bold text-accent-deep disabled:opacity-40"
                >
                  <Plus className="size-4" aria-hidden /> Tambah hingga 5 nomor resi sekaligus
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted">Coba resi contoh:</span>
                  {CONTOH.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setResi([c])}
                      className="rounded-full bg-accent-soft px-2.5 py-1 font-mono text-xs font-bold text-accent-deep hover:bg-accent hover:text-white"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {tab === "tarif" && (
            <form id="panel-tarif" role="tabpanel" aria-labelledby="tab-tarif" onSubmit={submitTarif} noValidate>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
                <Field label="Kota asal">
                  {(p) => (
                    <Select {...p} value={tarif.asal} onChange={(e) => setTarif({ ...tarif, asal: e.target.value })}>
                      {KOTA.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Kota tujuan">
                  {(p) => (
                    <Select {...p} value={tarif.tujuan} onChange={(e) => setTarif({ ...tarif, tujuan: e.target.value })}>
                      {KOTA.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Berat (kg)">
                  {(p) => (
                    <Input {...p} type="number" min="0.1" step="0.1" inputMode="decimal" value={tarif.berat} onChange={(e) => setTarif({ ...tarif, berat: e.target.value })} />
                  )}
                </Field>
                <Button type="submit" size="lg" loading={loading} className="h-12 self-end">
                  Cek Ongkir
                </Button>
              </div>
              {errTarif && (
                <p role="alert" className="mt-3 text-sm font-semibold text-danger">
                  {errTarif}
                </p>
              )}
            </form>
          )}

          {tab === "drop" && (
            <form id="panel-drop" role="tabpanel" aria-labelledby="tab-drop" onSubmit={submitDrop} className="flex gap-3">
              <Field className="flex-1">
                {(p) => <Input {...p} icon={MapPin} value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="Masukkan kota atau kecamatan" aria-label="Kota atau kecamatan" />}
              </Field>
              <Button type="submit" size="lg" className="h-12 shrink-0">
                Cari
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
