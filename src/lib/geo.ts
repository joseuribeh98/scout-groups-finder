import { LOCALE, type Lang } from "@/i18n/lang";

export interface LatLng {
  lat: number;
  lng: number;
}

const RADIO_TIERRA_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia en línea recta (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number, lang: Lang): string {
  const meters = Math.round((km * 1000) / 10) * 10;
  if (meters < 1000) return `${meters} m`;
  const digits = Math.round(km * 10) / 10 < 10 ? 1 : 0;
  const n = new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(km);
  return `${n} km`;
}
