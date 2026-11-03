"use client";

import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useEffect } from "react";
import { kotaById } from "@/lib/tariff";

const ikon = L.divIcon({
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  html: `<div style="width:34px;height:34px;border-radius:9999px 9999px 9999px 0;transform:rotate(-45deg);background:#E57734;border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.35)"></div>`,
});

function Klik({ onPick }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Terbang({ pusat }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(pusat, 12, { duration: 0.8 });
  }, [pusat, map]);
  return null;
}

/** Peta pilih lokasi: klik untuk menaruh pin. Kota yang dipilih menjadi pusat peta. */
export default function MapPicker({ kotaId, value, onChange, height = 260 }) {
  const k = kotaById(kotaId) ?? kotaById("semarang");
  const pusat = [k.lat, k.lng];
  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl ring-1 ring-line">
      <MapContainer center={pusat} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Terbang pusat={pusat} />
        <Klik onPick={onChange} />
        {value && <Marker position={value} icon={ikon} />}
      </MapContainer>
    </div>
  );
}
