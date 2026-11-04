import { cn } from "@/lib/format";

export function Skeleton({ className }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-5", className)} role="status" aria-label="Memuat">
      <Skeleton className="h-5 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}
