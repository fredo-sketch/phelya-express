import { Skeleton } from "@/components/ui/skeleton";

export default function TugasSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Memuat tugas">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      {[0, 1].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
    </div>
  );
}
