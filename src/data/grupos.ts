import raw from "@/data/grupos.json";
import { parseGrupos, type Grupo } from "@/data/schema";

/** Todos los grupos, validados. Si los datos son inválidos, el build falla aquí. */
export const grupos: readonly Grupo[] = parseGrupos(raw);
