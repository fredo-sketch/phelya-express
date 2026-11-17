"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/ui/button";
import TambahOrderModal from "@/components/admin/tambah-order-modal";

/** Tombol "Tambah Order": membuka pop-up form pesanan manual tanpa pindah halaman. */
export default function TambahOrderButton({ size }) {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <Button icon={Plus} size={size} onClick={() => setBuka(true)}>Tambah Order</Button>
      {buka && <TambahOrderModal onClose={() => setBuka(false)} />}
    </>
  );
}
