import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status" aria-label="Memuat hasil pelacakan">
      <Skeleton className="mb-8 h-12 max-w-2xl" />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SkeletonCard lines={4} />
          <Skeleton className="h-[380px] rounded-2xl" />
        </div>
        <SkeletonCard lines={9} />
      </div>
    </div>
  );
}
