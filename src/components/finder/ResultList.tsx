import { useEffect, useRef } from "preact/hooks";
import { REGION } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Resultado } from "@/lib/search";
import ResultItem from "@/components/finder/ResultItem";

interface Props {
  lang: Lang;
  t: Translate;
  results: Resultado[];
  activeId: number | null;
  scrollToId: number | null;
  onActivate: (id: number | null) => void;
  onFocusGroup: (id: number) => void;
  onClear: () => void;
}

export default function ResultList({
  lang,
  t,
  results,
  activeId,
  scrollToId,
  onActivate,
  onFocusGroup,
  onClear,
}: Props) {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (scrollToId === null) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Cada instancia (panel y hoja) desplaza solo su propio ítem; la oculta no hace nada visible.
    section.current
      ?.querySelector(`li[data-grupo-id="${scrollToId}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [scrollToId]);

  const count =
    results.length === 1 ? t("finder.count.one") : t("finder.count.other", { n: results.length });
  return (
    <section ref={section} class="grid gap-2" data-results>
      <h2 class="sr-only">{t("finder.results")}</h2>
      <p data-count aria-live="polite" class="text-sm font-semibold text-ink-soft">
        {count}
      </p>
      {results.length === 0 ? (
        <div class="rounded-2xl border border-dashed border-line p-6 text-center">
          <p class="font-bold">{t("finder.empty.title")}</p>
          <p class="mt-1 text-sm text-ink-soft">{t("finder.empty.body")}</p>
          <div class="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onClear}
              class="rounded-xl bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-strong"
            >
              {t("finder.clear")}
            </button>
            <a
              href={REGION.web}
              class="rounded-xl border border-line bg-surface px-4 py-2 font-semibold hover:bg-brand-soft"
            >
              {t("finder.empty.contact")}
            </a>
          </div>
        </div>
      ) : (
        <ul class="divide-y divide-line">
          {results.map((r) => (
            <ResultItem
              key={r.grupo.id}
              resultado={r}
              lang={lang}
              t={t}
              active={r.grupo.id === activeId}
              onActivate={onActivate}
              onFocusGroup={onFocusGroup}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
