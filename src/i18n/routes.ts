import type { Lang } from "@/i18n/lang";
import { grupoSlug } from "@/lib/slug";

export type PageKey = "home" | "about";

const PAGES: Record<Lang, Record<PageKey, string>> = {
  es: { home: "/", about: "/que-es-ser-scout/" },
  en: { home: "/en/", about: "/en/what-is-scouting/" },
};
const GRUPOS_BASE: Record<Lang, string> = { es: "/grupos/", en: "/en/groups/" };

export function pagePath(lang: Lang, page: PageKey): string {
  return PAGES[lang][page];
}

export function grupoPath(lang: Lang, grupo: { id: number; nombre: string }): string {
  return `${GRUPOS_BASE[lang]}${grupoSlug(grupo)}/`;
}

export function langFromPath(path: string): Lang {
  return path === "/en" || path.startsWith("/en/") ? "en" : "es";
}

/** Ruta equivalente en el otro idioma; si no se reconoce, la portada de ese idioma. */
export function alternatePath(path: string, target: Lang): string {
  const from = langFromPath(path);
  const base = GRUPOS_BASE[from];
  if (path.startsWith(base)) return `${GRUPOS_BASE[target]}${path.slice(base.length)}`;
  for (const page of Object.keys(PAGES[from]) as PageKey[]) {
    if (PAGES[from][page] === path) return PAGES[target][page];
  }
  return PAGES[target].home;
}
