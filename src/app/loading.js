import Mascot from "@/components/ui/mascot";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center" role="status" aria-live="polite">
      <Mascot pose="terbang" height={150} float />
      <svg viewBox="0 0 200 12" className="mt-4 h-3 w-56" aria-hidden>
        <path d="M2 6 H198" stroke="var(--accent)" strokeWidth="3" strokeDasharray="8 10" strokeLinecap="round" className="animate-dash" />
      </svg>
      <p className="mt-4 text-lg font-extrabold">Sebentar ya, paketmu lagi dicari...</p>
      <p className="text-sm text-muted">Sedang menghubungkan ke server logistik Nusantara.</p>
    </div>
  );
}
