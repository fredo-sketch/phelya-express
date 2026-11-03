import Mascot from "@/components/ui/mascot";
import { cn } from "@/lib/format";

/** State kosong dengan maskot. `action` berupa node (mis. <Button/>). */
export default function EmptyState({ pose = "santai", title, description, action, className, compact = false }) {
  return (
    <div className={cn("flex flex-col items-center px-4 text-center", compact ? "py-8" : "py-14", className)}>
      <Mascot pose={pose} height={compact ? 110 : 150} />
      <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Terjadi kesalahan", description = "Coba muat ulang beberapa saat lagi.", onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-danger/30 bg-danger-soft px-4 py-10 text-center">
      <p className="text-lg font-extrabold text-danger">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full bg-danger px-5 py-2 text-sm font-bold text-white">
          Coba lagi
        </button>
      )}
    </div>
  );
}
