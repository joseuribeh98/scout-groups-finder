import type { Lang } from "@/i18n/lang";
import type { Dia, Reunion } from "@/data/schema";

const DIAS_PLURAL: Record<Lang, Record<Dia, string>> = {
  es: {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábados",
    domingo: "Domingos",
  },
  en: {
    lunes: "Mondays",
    martes: "Tuesdays",
    miercoles: "Wednesdays",
    jueves: "Thursdays",
    viernes: "Fridays",
    sabado: "Saturdays",
    domingo: "Sundays",
  },
};

export function formatHora(hhmm: string, lang: Lang): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const h12 = ((h + 11) % 12) + 1;
  const pm = h >= 12;
  const sufijo = lang === "es" ? (pm ? "p. m." : "a. m.") : pm ? "PM" : "AM";
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

export function formatReunion(reunion: Reunion, lang: Lang): string {
  const dia = DIAS_PLURAL[lang][reunion.dia];
  const inicio = formatHora(reunion.inicio, lang);
  if (reunion.fin === null)
    return lang === "es" ? `${dia}, desde las ${inicio}` : `${dia}, from ${inicio}`;
  return `${dia}, ${inicio} – ${formatHora(reunion.fin, lang)}`;
}
