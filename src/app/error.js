"use client";

import Mascot from "@/components/ui/mascot";
import Button from "@/components/ui/button";

export default function Error({ reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center" role="alert">
      <Mascot pose="hormat" height={170} />
      <h1 className="mt-5 text-2xl font-black">Waduh, ada yang tidak beres</h1>
      <p className="mt-2 max-w-sm text-muted">Terjadi kesalahan saat memuat halaman. Coba muat ulang, ya.</p>
      <Button onClick={() => reset()} className="mt-6">Coba lagi</Button>
    </div>
  );
}
