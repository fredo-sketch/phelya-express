import Link from "next/link";
import Mascot from "@/components/ui/mascot";

/** Tombol bantuan melayang di pojok kanan bawah, maskot Phely. */
export default function HelpFab() {
  return (
    <Link
      href="/bantuan#kontak"
      className="group fixed bottom-4 right-4 z-40 flex items-center gap-2"
      aria-label="Butuh bantuan? Tanya Phely"
    >
      <span className="hidden rounded-full bg-surface px-4 py-2 text-sm font-bold shadow-card ring-1 ring-line transition group-hover:-translate-x-1 sm:block">
        Butuh bantuan? Tanya Phely!
      </span>
      <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-accent shadow-[0_10px_24px_-8px_var(--accent)] ring-4 ring-bg">
        <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" aria-hidden />
        <Mascot pose="sapa" height={52} className="relative mt-2 drop-shadow-none" />
      </span>
    </Link>
  );
}
