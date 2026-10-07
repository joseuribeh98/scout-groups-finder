import { isRamaId, sortRamas } from "@/data/ramas";
import type { Filters } from "@/lib/search";

const MAX_Q = 100;

export function parseFilters(params: URLSearchParams, municipioSlugs: readonly string[]): Filters {
  const municipio = params.get("municipio");
  const ramas = [...new Set(params.getAll("rama"))].filter(isRamaId);
  return {
    q: (params.get("q") ?? "").slice(0, MAX_Q),
    municipio: municipio !== null && municipioSlugs.includes(municipio) ? municipio : null,
    ramas: sortRamas(ramas),
  };
}

export function serializeFilters(f: Filters): string {
  const params = new URLSearchParams();
  const q = f.q.trim();
  if (q) params.set("q", q);
  if (f.municipio) params.set("municipio", f.municipio);
  for (const rama of f.ramas) params.append("rama", rama);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
