"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { api } from "@/components/order-store";
import { kotaById } from "@/lib/tariff";
import { tanggal } from "@/lib/format";

export default function PelangganAdmin() {
  const [st, setSt] = useState({ memuat: true, data: [], error: "" });

  useEffect(() => {
    let batal = false;
    api("/api/pelanggan").then((j) => {
      if (!batal) setSt(j.ok ? { memuat: false, data: j.pelanggan, error: "" } : { memuat: false, data: [], error: j.error });
    });
    return () => {
      batal = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <h1 className="text-3xl font-black">Pelanggan</h1>
      {st.error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">{st.error}</p>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted"><tr>{["Nama", "Email", "Kota", "Tier", "Total Order", "Bergabung"].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr></thead>
          <tbody>
            {st.memuat && <tr><td colSpan={6} className="px-5 py-6 text-center text-muted">Memuat pelanggan...</td></tr>}
            {st.data.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-5 py-4 font-bold">{p.nama}</td>
                <td className="px-5 py-4 text-muted">{p.email}</td>
                <td className="px-5 py-4">{kotaById(p.kota)?.nama ?? "-"}</td>
                <td className="px-5 py-4"><Pill tone={p.tier === "Gold" ? "amber" : "neutral"}>{p.tier}</Pill></td>
                <td className="px-5 py-4 font-bold">{p.totalOrder}</td>
                <td className="px-5 py-4 text-muted">{tanggal(p.bergabung)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
