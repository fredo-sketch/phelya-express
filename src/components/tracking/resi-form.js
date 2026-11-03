"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const RESI_REGEX = /^PEX\d{10}$/;

export default function ResiForm({ defaultValue = "", compact = false }) {
  const router = useRouter();
  const [val, setVal] = useState(defaultValue);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(e) {
    e.preventDefault();
    const list = val
      .split(/[\s,]+/)
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);
    if (!list.length) return setErr("Nomor resi wajib diisi.");
    if (list.length > 5) return setErr("Maksimal 5 nomor resi sekaligus.");
    const salah = list.find((r) => !RESI_REGEX.test(r));
    if (salah) return setErr(`Format "${salah}" tidak valid. Contoh: PEX2610310001.`);
    setErr("");
    setLoading(true);
    router.push(list.length === 1 ? `/lacak/${list[0]}` : `/lacak?resi=${list.join(",")}`);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Field className="flex-1" error={err} hint={compact ? undefined : "Pisahkan dengan koma untuk melacak hingga 5 resi sekaligus."}>
        {(p) => (
          <Input
            {...p}
            icon={Search}
            value={val}
            invalid={!!err}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Masukkan nomor resi, contoh: PEX2610310001"
            autoComplete="off"
            aria-label="Nomor resi"
          />
        )}
      </Field>
      <Button type="submit" size="lg" loading={loading} className="h-12">
        Lacak
      </Button>
    </form>
  );
}
