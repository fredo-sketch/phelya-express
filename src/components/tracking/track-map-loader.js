"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet butuh `window`, jadi hanya dirender di browser.
const TrackMap = dynamic(() => import("@/components/tracking/track-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-2xl" />,
});

export default function TrackMapLoader(props) {
  return <TrackMap {...props} />;
}
