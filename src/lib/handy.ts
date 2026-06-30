import {
  Wrench, Zap, Hammer, DoorOpen, Sofa, Refrigerator, Flame, Sprout,
  HardHat, Tractor, Wifi, type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  plumbing: Wrench,
  electric: Zap,
  handyman: Hammer,
  doors_windows: DoorOpen,
  furniture: Sofa,
  appliances: Refrigerator,
  micro_repair: Flame,
  garden: Sprout,
  labor: HardHat,
  heavy: Tractor,
  internet: Wifi,
};

// Kharkiv default center
export const KHARKIV: [number, number] = [49.9935, 36.2304];

export const COMMISSION = 0.10;
export const INSTANT_PAYOUT_FEE = 0.02;
export const DEBT_BAN_THRESHOLD = -400;

export function isCurfewNow(d = new Date()): boolean {
  const h = d.getHours();
  // Kharkiv curfew 23:00–05:00
  return h >= 23 || h < 5;
}

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Free geocoder via Nominatim (OpenStreetMap)
export async function geocodeAddress(q: string): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ", Харків, Україна")}`,
      { headers: { "Accept-Language": "uk" } },
    );
    const j = await r.json();
    if (!Array.isArray(j) || j.length === 0) return null;
    return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon), display: j[0].display_name };
  } catch {
    return null;
  }
}
