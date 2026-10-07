import type { LatLng } from "@/lib/geo";

export function whatsappUrl(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function mailtoUrl(email: string, asunto: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}`;
}

export function directionsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function wazeUrl({ lat, lng }: LatLng): string {
  return `https://waze.com/ul?ll=${encodeURIComponent(`${lat},${lng}`)}&navigate=yes`;
}

/** "573001234567" → "+57 300 123 4567" */
export function formatWhatsapp(numero: string): string {
  const local = numero.slice(2);
  return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
