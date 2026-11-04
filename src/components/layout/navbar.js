"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/logo";
import Button from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { cn } from "@/lib/format";

export const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/layanan", label: "Layanan" },
  { href: "/cek-tarif", label: "Cek Tarif" },
  { href: "/lacak", label: "Lacak Paket" },
  { href: "/karier", label: "Karier" },
  { href: "/bantuan", label: "Bantuan" },
];

function aktif(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={aktif(pathname, l.href) ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-[15px] font-bold transition",
                aktif(pathname, l.href) ? "text-primary" : "text-fg/80 hover:bg-soft hover:text-fg",
              )}
            >
              {l.label}
              {aktif(pathname, l.href) && (
                <span className="absolute inset-x-4 -bottom-0.5 h-[3px] rounded-full bg-accent" aria-hidden />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Button href="/masuk" variant="secondary" size="sm">
            Masuk
          </Button>
          <Button href="/daftar" size="sm">
            Daftar
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="inline-flex size-10 items-center justify-center rounded-full bg-soft"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-mobile" className="border-t border-line bg-bg px-4 pb-5 pt-3 lg:hidden">
          <nav aria-label="Navigasi seluler" className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={aktif(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-bold",
                  aktif(pathname, l.href) ? "bg-primary-soft text-primary-strong" : "hover:bg-soft",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button href="/masuk" variant="secondary">
              Masuk
            </Button>
            <Button href="/daftar">Daftar</Button>
          </div>
        </div>
      )}
    </header>
  );
}
