export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function grupoSlug(grupo: { id: number; nombre: string }): string {
  return `${grupo.id}-${slugify(grupo.nombre)}`;
}
