"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, EyeOff, Lock, LogIn, Mail, Phone, User, UserPlus } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import Mascot from "@/components/ui/mascot";
import Logo from "@/components/ui/logo";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { AKUN_UJI } from "@/data/akun-uji";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/format";

const HOME = { pelanggan: "/dashboard", kurir: "/kurir", admin: "/admin" };

/** Terjemahan pesan galat Supabase Auth ke bahasa Indonesia. */
function pesanAuth(error) {
  const m = (error?.message ?? "").toLowerCase();
  if (m.includes("invalid login")) return "Email atau kata sandi salah. Periksa kembali lalu coba lagi.";
  if (m.includes("not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk emailmu.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (m.includes("rate limit") || error?.status === 429) return "Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.";
  if (m.includes("password") && (m.includes("weak") || m.includes("pwned") || m.includes("compromised"))) return "Kata sandi terlalu lemah atau pernah bocor. Gunakan kata sandi lain.";
  if (m.includes("fetch") || m.includes("network")) return "Tidak dapat terhubung ke server. Periksa koneksi internetmu.";
  return "Terjadi kesalahan. Coba lagi beberapa saat lagi.";
}

/** Tujuan setelah login: halaman `next` bila aman (path internal), selain itu beranda sesuai peran. */
function tujuanSetelahLogin(role) {
  const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
  const aman = next && next.startsWith("/") && !next.startsWith("//");
  return aman ? next : (HOME[role] ?? "/dashboard");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MANFAAT = [
  "Lacak real-time akurat tanpa jeda status",
  "Jemput paket gratis tanpa minimal order",
  "Notifikasi otomatis saat status paket berubah",
];

function PasswordInput({ value, onChange, invalid, ...p }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...p}
      icon={Lock}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      invalid={invalid}
      right={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:text-fg"
        >
          {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
    />
  );
}

function LoginForm({ onSwitch }) {
  const { toast } = useToast();
  const [f, setF] = useState({ email: "", password: "", ingat: true });
  const [err, setErr] = useState({});
  const [banner, setBanner] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    const next = {};
    if (!f.email.trim()) next.email = "Email wajib diisi.";
    else if (!EMAIL_RE.test(f.email.trim())) next.email = "Format email tidak valid.";
    if (!f.password) next.password = "Kata sandi wajib diisi.";
    setErr(next);
    setBanner("");
    if (Object.keys(next).length) return;

    setLoading(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim().toLowerCase(), password: f.password });
    if (error) {
      setLoading(false);
      setBanner(pesanAuth(error));
      return;
    }
    try {
      // "Ingat saya": bila tidak dicentang, sesi berakhir saat tab/browser ditutup (lihat SessionGuard)
      localStorage.setItem("phelya-ingat", f.ingat ? "1" : "0");
      sessionStorage.setItem("phelya-aktif", "1");
    } catch {}
    const me = await fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (!me?.ok) {
      await supabase.auth.signOut();
      setLoading(false);
      setBanner("Akun ini belum memiliki profil. Hubungi admin.");
      return;
    }
    toast({ type: "success", title: `Selamat datang, ${me.me.nama.split(" ")[0]}!`, description: `Masuk sebagai ${me.me.role}.` });
    // navigasi penuh agar data sesi sebelumnya di memori tidak terbawa
    window.location.assign(tujuanSetelahLogin(me.me.role));
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {banner && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {banner}
        </div>
      )}
      <Field label="Email" required error={err.email}>
        {(p) => <Input {...p} icon={Mail} type="email" autoComplete="email" value={f.email} invalid={!!err.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="nama@email.com" />}
      </Field>
      <Field
        label="Kata sandi"
        required
        error={err.password}
        action={
          <Link href="/bantuan#kontak" className="text-xs font-bold text-accent-deep hover:underline">
            Lupa kata sandi?
          </Link>
        }
      >
        {(p) => <PasswordInput {...p} autoComplete="current-password" value={f.password} invalid={!!err.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Masukkan kata sandi" />}
      </Field>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input type="checkbox" checked={f.ingat} onChange={(e) => setF({ ...f, ingat: e.target.checked })} className="size-[18px] accent-[var(--accent)]" />
        Ingat saya di perangkat ini
      </label>
      <Button type="submit" size="lg" loading={loading} className="w-full" iconRight={LogIn}>
        {loading ? "Memproses..." : "Masuk"}
      </Button>

      <div className="rounded-xl bg-surface2 p-4 text-xs text-muted">
        <p className="mb-2 font-extrabold uppercase tracking-wider text-fg">Akun uji (data simulasi)</p>
        <ul className="space-y-1.5">
          {AKUN_UJI.map((a) => (
            <li key={a.role} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <b className="capitalize text-fg">{a.role}</b> · {a.email}
              </span>
              <button type="button" onClick={() => setF({ ...f, email: a.email, password: a.password })} className="rounded-full bg-accent-soft px-2.5 py-1 font-bold text-accent-deep hover:bg-accent hover:text-white">
                Isi otomatis
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="border-t border-line pt-5 text-center text-sm">
        Belum punya akun pelanggan?{" "}
        <button type="button" onClick={onSwitch} className="font-extrabold text-accent-deep hover:underline">
          Daftar sekarang
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch }) {
  const { toast } = useToast();
  const [f, setF] = useState({ nama: "", email: "", hp: "", password: "", konfirmasi: "", setuju: false });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    const n = {};
    if (f.nama.trim().length < 3) n.nama = "Nama lengkap minimal 3 karakter.";
    if (!EMAIL_RE.test(f.email.trim())) n.email = "Email tidak valid.";
    if (!/^(08|\+628)\d{8,11}$/.test(f.hp.replace(/[\s-]/g, ""))) n.hp = "Nomor HP tidak valid. Contoh: 081234567890.";
    if (f.password.length < 8) n.password = "Kata sandi minimal 8 karakter.";
    else if (!/\d/.test(f.password) || !/[A-Za-z]/.test(f.password)) n.password = "Gunakan kombinasi huruf dan angka.";
    if (f.konfirmasi !== f.password) n.konfirmasi = "Konfirmasi kata sandi tidak sama.";
    if (!f.setuju) n.setuju = "Kamu harus menyetujui syarat dan ketentuan.";
    setErr(n);
    if (Object.keys(n).length) return;

    setLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim().toLowerCase(),
      password: f.password,
      options: { data: { nama: f.nama.trim(), hp: f.hp.replace(/[\s-]/g, "") } },
    });
    setLoading(false);
    if (error) {
      setErr({ email: pesanAuth(error) });
      return;
    }
    // Supabase tidak membocorkan apakah email sudah terdaftar bila konfirmasi email aktif: identities kosong
    if (data.user && data.user.identities?.length === 0) {
      setErr({ email: "Email ini sudah terdaftar. Silakan masuk." });
      return;
    }
    if (!data.session) {
      toast({ type: "success", title: "Cek emailmu", description: "Kami mengirim tautan konfirmasi. Setelah dikonfirmasi, silakan masuk." });
      onSwitch();
      return;
    }
    try {
      localStorage.setItem("phelya-ingat", "1");
      sessionStorage.setItem("phelya-aktif", "1");
    } catch {}
    toast({ type: "success", title: "Akun berhasil dibuat", description: "Selamat datang di Phelya Express!" });
    // Muat ulang penuh (bukan router.push) agar cookie sesi & state klien bersih
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/dashboard");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nama lengkap" required error={err.nama}>
        {(p) => <Input {...p} icon={User} autoComplete="name" value={f.nama} invalid={!!err.nama} onChange={set("nama")} placeholder="Nama sesuai identitas" />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" required error={err.email}>
          {(p) => <Input {...p} icon={Mail} type="email" autoComplete="email" value={f.email} invalid={!!err.email} onChange={set("email")} placeholder="nama@email.com" />}
        </Field>
        <Field label="Nomor HP" required error={err.hp}>
          {(p) => <Input {...p} icon={Phone} type="tel" inputMode="tel" autoComplete="tel" value={f.hp} invalid={!!err.hp} onChange={set("hp")} placeholder="0812xxxxxxx" />}
        </Field>
      </div>
      <Field label="Kata sandi" required error={err.password} hint="Minimal 8 karakter, kombinasi huruf dan angka.">
        {(p) => <PasswordInput {...p} autoComplete="new-password" value={f.password} invalid={!!err.password} onChange={set("password")} placeholder="Buat kata sandi" />}
      </Field>
      <Field label="Konfirmasi kata sandi" required error={err.konfirmasi}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" value={f.konfirmasi} invalid={!!err.konfirmasi} onChange={set("konfirmasi")} placeholder="Ulangi kata sandi" />}
      </Field>
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input type="checkbox" checked={f.setuju} onChange={set("setuju")} className="mt-0.5 size-[18px] accent-[var(--accent)]" />
          <span>
            Saya menyetujui{" "}
            <Link href="/bantuan#syarat" className="font-bold text-accent-deep underline">
              syarat dan ketentuan
            </Link>{" "}
            Phelya Express.
          </span>
        </label>
        {err.setuju && (
          <p role="alert" className="mt-1.5 text-xs font-semibold text-danger">
            {err.setuju}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" loading={loading} className="w-full" iconRight={UserPlus}>
        {loading ? "Membuat akun..." : "Daftar"}
      </Button>
      <p className="border-t border-line pt-5 text-center text-sm">
        Sudah punya akun?{" "}
        <button type="button" onClick={onSwitch} className="font-extrabold text-accent-deep hover:underline">
          Masuk di sini
        </button>
      </p>
    </form>
  );
}

export default function AuthCard({ initial = "masuk" }) {
  const [mode, setMode] = useState(initial);
  const masuk = mode === "masuk";

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface2 px-4 py-3 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden /> Kembali ke Beranda
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto grid max-w-6xl gap-0 px-4 py-8 sm:px-6 md:py-14 lg:grid-cols-[1fr_1.05fr]">
        {/* panel kiri */}
        <aside className="route-pattern relative hidden flex-col justify-between overflow-hidden rounded-l-[2rem] bg-linear-to-br from-[#01565a] via-primary to-[#2f8d87] p-10 text-white lg:flex dark:from-[#0a3a3d] dark:to-[#136a6a]">
          <Logo onDark />
          <div className="relative flex flex-1 items-center justify-center py-6">
            <div className="absolute size-72 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <Mascot pose={masuk ? "sapa" : "semangat"} height={260} float priority className="relative" />
          </div>
          <div>
            <h1 className="text-3xl font-black leading-tight text-balance">Pantau semua kirimanmu di satu tempat</h1>
            <p className="mt-3 text-white/80">Nikmati kemudahan lacak resi otomatis, jemput paket gratis dari rumah, dan promo ongkir hemat setiap hari.</p>
            <ul className="mt-6 space-y-2.5 border-t border-white/20 pt-5 text-sm">
              {MANFAAT.map((m) => (
                <li key={m} className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* form */}
        <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-10 lg:rounded-l-none">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Mascot pose="sapa" height={72} />
            <p className="text-lg font-black leading-tight">Pantau semua kirimanmu di satu tempat</p>
          </div>

          <div role="tablist" aria-label="Masuk atau daftar" className="mb-7 grid grid-cols-2 gap-1 rounded-2xl bg-surface2 p-1">
            {[
              ["masuk", "Masuk ke Akun", LogIn],
              ["daftar", "Daftar Akun Baru", UserPlus],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition", mode === id ? "bg-surface text-primary shadow" : "text-muted hover:text-fg")}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>

          {masuk ? <LoginForm onSwitch={() => setMode("daftar")} /> : <RegisterForm onSwitch={() => setMode("masuk")} />}
        </section>
      </main>
    </div>
  );
}
