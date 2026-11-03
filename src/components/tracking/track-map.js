"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, Marker, Tooltip } from "react-leaflet";
import { jalurPeta, posisiPaket } from "@/lib/route";

function pin(color, inner = "") {
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:15px">${inner}</div>`,
  });
}

/** Peta rute dummy (OpenStreetMap + Leaflet). Posisi paket dihitung dari status. */
export default function TrackMap({ asal, tujuan, status, height = 320 }) {
  const jalur = useMemo(() => jalurPeta(asal, tujuan), [asal, tujuan]);
  const posisi = useMemo(() => posisiPaket(jalur, status), [jalur, status]);

  const bounds = useMemo(() => L.latLngBounds(jalur), [jalur]);
  const idx = jalur.findIndex((p) => p === posisi);
  const sudah = useMemo(() => {
    if (!posisi) return [];
    // bagian jalur yang sudah dilalui: titik waypoint sebelum posisi + posisi
    const out = [];
    for (const p of jalur) {
      out.push(p);
      if (idx >= 0 && p === posisi) break;
    }
    if (idx < 0) {
      // posisi hasil interpolasi: potong jalur sampai segmen terdekat
      let best = 0;
      let d = Infinity;
      jalur.forEach((p, i) => {
        const dd = (p[0] - posisi[0]) ** 2 + (p[1] - posisi[1]) ** 2;
        if (dd < d) {
          d = dd;
          best = i;
        }
      });
      const awal = jalur.slice(0, best + 1);
      return [...awal, posisi];
    }
    return out;
  }, [jalur, posisi, idx]);

  if (!jalur.length) return null;
  const A = jalur[0];
  const B = jalur[jalur.length - 1];

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl ring-1 ring-line">
      <MapContainer bounds={bounds} boundsOptions={{ padding: [36, 36] }} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={jalur} pathOptions={{ color: "#B6ACAD", weight: 5, dashArray: "2 10", lineCap: "round" }} />
        <Polyline positions={sudah} pathOptions={{ color: "#01757A", weight: 6, lineCap: "round" }} />
        <Marker position={A} icon={pin("#01757A", "📦")}>
          <Tooltip direction="top">Asal</Tooltip>
        </Marker>
        <Marker position={B} icon={pin("#E57734", "📍")}>
          <Tooltip direction="top">Tujuan</Tooltip>
        </Marker>
        {posisi && status !== "sampai" && status !== "dibatalkan" && status !== "menunggu_kurir" && (
          <Marker position={posisi} icon={pin("#3E2922", "🚚")} zIndexOffset={800}>
            <Tooltip direction="top" permanent>
              Posisi paket
            </Tooltip>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
