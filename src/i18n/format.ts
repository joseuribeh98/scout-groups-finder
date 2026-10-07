import { LOCALE, type Lang } from "@/i18n/lang";

/** "2025-05" → "mayo de 2025" / "May 2025" */
export function formatMonth(ym: string, lang: Lang): string {
  const [year = 1970, month = 1] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
