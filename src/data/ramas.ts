import type { Lang } from "@/i18n/lang";

/** Orden oficial de las ramas (fuente: scout.org.co). */
export const RAMA_IDS = ["cachorros", "lobatos", "scouts", "nomadas", "rovers"] as const;
export type RamaId = (typeof RAMA_IDS)[number];

export interface Rama {
  id: RamaId;
  nombre: string;
  nombreEn: string;
  edadMin: number;
  edadMax: number;
}

export const RAMAS: Record<RamaId, Rama> = {
  cachorros: { id: "cachorros", nombre: "Cachorros", nombreEn: "Beavers", edadMin: 5, edadMax: 6 },
  lobatos: { id: "lobatos", nombre: "Lobatos", nombreEn: "Cub Scouts", edadMin: 7, edadMax: 10 },
  scouts: { id: "scouts", nombre: "Scouts", nombreEn: "Scouts", edadMin: 11, edadMax: 14 },
  nomadas: {
    id: "nomadas",
    nombre: "Nómadas Scout",
    nombreEn: "Venturers",
    edadMin: 15,
    edadMax: 17,
  },
  rovers: { id: "rovers", nombre: "Rovers", nombreEn: "Rovers", edadMin: 18, edadMax: 20 },
};

export function isRamaId(value: string): value is RamaId {
  return (RAMA_IDS as readonly string[]).includes(value);
}

export function sortRamas(ids: readonly RamaId[]): RamaId[] {
  return [...ids].sort((a, b) => RAMA_IDS.indexOf(a) - RAMA_IDS.indexOf(b));
}

/** En inglés se muestra el nombre oficial con la traducción como apoyo. */
export function ramaLabel(id: RamaId, lang: Lang): string {
  const rama = RAMAS[id];
  if (lang === "es" || rama.nombre === rama.nombreEn) return rama.nombre;
  return `${rama.nombre} · ${rama.nombreEn}`;
}
