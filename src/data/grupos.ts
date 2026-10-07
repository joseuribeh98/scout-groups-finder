import raw from "@/data/grupos.json";
import { parseGrupos, type Grupo } from "@/data/schema";
import { slugify } from "@/lib/slug";

/** Todos los grupos, validados. Si los datos son inválidos, el build falla aquí. */
export const grupos: readonly Grupo[] = parseGrupos(raw);

/** Municipios que tienen al menos un grupo, ordenados alfabéticamente. */
export const municipiosConGrupos: { slug: string; nombre: string }[] = [
  ...new Set(grupos.map((g) => g.municipio)),
]
  .sort((a, b) => a.localeCompare(b, "es"))
  .map((nombre) => ({ slug: slugify(nombre), nombre }));
