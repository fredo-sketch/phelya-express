"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapPicker = dynamic(() => import("@/components/tracking/map-picker"), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full rounded-2xl" />,
});

export default function MapPickerLoader(props) {
  return <MapPicker {...props} />;
}
