"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";
import Logo from "@/components/ui/logo";
import ThemeToggle from "@/components/ui/theme-toggle";
import Mascot from "@/components/ui/mascot";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn, inisial } from "@/lib/format";

function cocok(pathname, href, exact) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavList({ nav, pathname, onNavigate }) {
  return (
    <ul className="space-y-1">
      {nav.map((n) => {
        const on = cocok(pathname, n.href, n.exact);
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              onClick={onNavigate}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold transition",
                on ? "bg-accent text-white shadow-[0_8px_18px_-8px_var(--accent)]" : "text-fg/80 hover:bg-soft",
              )}
            >
              <n.icon className="size-5 shrink-0" aria-hidden />
              <span className="flex-1">{n.label}</span>
              {n.badge != null && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-extrabold", on ? "bg-white/25 text-white" : "bg-primary text-white dark:text-[#1c1310]")}>{n.badge}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Shell dashboard: sidebar di desktop, drawer di mobile.
 * `bottomNav` (opsional) menampilkan tab bar bawah di mobile, dipakai dashboard kurir dan pelanggan.
 */
export default function DashboardShell({ nav, user, roleLabel, children, bottomNav = false, topAction, sidebarNote }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function keluar() {
    await supabaseBrowser().auth.signOut();
    // navigasi penuh agar semua data sesi sebelumnya di memori ikut hilang
    // Muat ulang penuh (bukan router.push) agar cookie sesi & state klien bersih
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/masuk");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5">
        <Logo />
      </div>
      <nav aria-label="Menu dashboard" className="flex-1 overflow-y-auto px-3">
        <NavList nav={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
      </nav>
      {sidebarNote && (
        <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <Mascot pose="sapa" height={54} />
          <p className="text-xs leading-snug">
            <b className="text-accent-deep">Halo dari Phely!</b>
            <br />
            {sidebarNote}
          </p>
        </div>
      )}
      <div className="space-y-1 border-t border-line p-3">
        <div className="flex items-center justify-between px-3 py-2 text-sm font-bold">
          Tema tampilan <ThemeToggle />
        </div>
        <button onClick={keluar} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-danger hover:bg-danger-soft">
          <LogOut className="size-5" aria-hidden /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[256px_1fr]">
      {/* sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface2 lg:block">{sidebar}</aside>

      {/* drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-surface2 shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Tutup menu" : "Buka menu"} className="inline-flex size-10 items-center justify-center rounded-full bg-soft lg:hidden">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="min-w-0 flex-1">{topAction}</div>
          <button aria-label="Notifikasi" className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-soft">
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2.5 rounded-full bg-accent ring-2 ring-bg" aria-hidden />
          </button>
          <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white dark:text-[#1c1310]">{inisial(user.nama || "?")}</span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-extrabold">{user.nama}</span>
              <span className="block text-[11px] font-bold text-accent-deep">{roleLabel}</span>
            </span>
          </div>
        </header>

        <main className={cn("flex-1 px-4 py-6 sm:px-6", bottomNav && "pb-28 lg:pb-8")}>{children}</main>

        {bottomNav && (
          <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-surface/95 backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
            {nav.map((n) => {
              const on = cocok(pathname, n.href, n.exact);
              return (
                <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className="flex flex-col items-center gap-1 py-2.5 text-xs font-bold">
                  <span className={cn("relative flex h-8 w-14 items-center justify-center rounded-full transition", on ? "bg-accent text-white" : "text-muted")}>
                    <n.icon className="size-5" aria-hidden />
                    {n.badge != null && <span className="absolute -right-1 -top-1 rounded-full bg-accent-deep px-1.5 text-[10px] font-extrabold text-white">{n.badge}</span>}
                  </span>
                  <span className={on ? "text-accent-deep" : "text-muted"}>{n.short ?? n.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
