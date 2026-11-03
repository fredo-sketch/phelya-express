import Link from "next/link";
import Mascot from "@/components/ui/mascot";
import Button from "@/components/ui/button";
import Logo from "@/components/ui/logo";

export const metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <Logo />
      <div className="relative mt-10">
        <span className="absolute -left-6 top-2 text-4xl font-black text-accent animate-float" aria-hidden>?</span>
        <span className="absolute -right-4 top-10 text-3xl font-black text-primary animate-float [animation-delay:.8s]" aria-hidden>?</span>
        <Mascot pose="santai" height={220} priority />
      </div>
      <p className="mt-6 rounded-full bg-danger-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-danger">Error 404 · Halaman tersesat</p>
      <h1 className="mt-4 text-4xl font-black">Ups, paketnya nyasar!</h1>
      <p className="mt-3 max-w-md text-muted">Halaman yang kamu cari tidak ditemukan atau sudah dipindahkan ke rute lain.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button href="/" size="lg">Kembali ke Beranda</Button>
        <Button href="/bantuan" size="lg" variant="secondary">Bantuan CS</Button>
      </div>
      <Link href="/lacak" className="mt-6 text-sm font-bold text-primary underline">Atau lacak paketmu</Link>
    </main>
  );
}
