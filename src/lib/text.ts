/** Quita tildes y diéresis (NFD + marcas combinantes U+0300–U+036F). */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
