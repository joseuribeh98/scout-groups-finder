import type { RamaId } from "@/data/ramas";
import type { Grupo } from "@/data/schema";
import { distanceKm, type LatLng } from "@/lib/geo";
import { slugify } from "@/lib/slug";
import { stripDiacritics } from "@/lib/text";

export interface Filters {
  q: string;
  /** slug del municipio, p. ej. "cali" */
  municipio: string | null;
  ramas: RamaId[];
}

export const EMPTY_FILTERS: Filters = { q: "", municipio: null, ramas: [] };

export function hasActiveFilters(f: Filters): boolean {
  return f.q.trim() !== "" || f.municipio !== null || f.ramas.length > 0;
}

export function normalize(text: string): string {
  return stripDiacritics(text).toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchesFilters(grupo: Grupo, f: Filters): boolean {
  if (f.municipio !== null && slugify(grupo.municipio) !== f.municipio) return false;
  if (!f.ramas.every((r) => grupo.ramas.includes(r))) return false;

  const q = normalize(f.q);
  if (q === "") return true;
  const texto = normalize(
    [grupo.nombre, String(grupo.id), grupo.municipio, grupo.localidad ?? "", grupo.direccion].join(
      " ",
    ),
  );
  return q.split(" ").every((palabra) => texto.includes(palabra));
}

export interface Resultado {
  grupo: Grupo;
  distanciaKm: number | null;
}

export function buscar(grupos: readonly Grupo[], f: Filters, origen: LatLng | null): Resultado[] {
  const resultados = grupos
    .filter((g) => matchesFilters(g, f))
    .map((grupo) => ({ grupo, distanciaKm: origen ? distanceKm(origen, grupo.ubicacion) : null }));

  return resultados.sort((a, b) =>
    origen
      ? (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0)
      : a.grupo.municipio.localeCompare(b.grupo.municipio, "es") ||
        a.grupo.nombre.localeCompare(b.grupo.nombre, "es"),
  );
}
