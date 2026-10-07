export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const LOCALE: Record<Lang, string> = { es: "es-CO", en: "en-US" };

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}
