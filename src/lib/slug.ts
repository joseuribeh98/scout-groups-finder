import { stripDiacritics } from "@/lib/text";

export function slugify(text: string): string {
  return stripDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function grupoSlug(grupo: { id: number; nombre: string }): string {
  return `${grupo.id}-${slugify(grupo.nombre)}`;
}
