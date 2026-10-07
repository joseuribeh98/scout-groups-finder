import { useEffect } from "preact/hooks";
import { REGION } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Resultado } from "@/lib/search";
import GroupCard from "@/components/finder/GroupCard";

interface Props {
  lang: Lang;
  t: Translate;
  results: Resultado[];
  activeId: number | null;
  scrollToId: number | null;
  onActivate: (id: number | null) => void;
  onClear: () => void;
}

export default function GroupList({
  lang,
  t,
  results,
  activeId,
  scrollToId,
  onActivate,
  onClear,
}: Props) {
  useEffect(() => {
    if (scrollToId === null) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .querySelector(`li[data-grupo-id="${scrollToId}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [scrollToId]);

  const count =
    results.length === 1 ? t("finder.count.one") : t("finder.count.other", { n: results.length });
  return (
    <section class="grid gap-3">
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
              class="rounded-xl bg-brand px-4 py-2 font-semibold text-on-brand"
            >
              {t("finder.clear")}
            </button>
            <a href={REGION.web} class="rounded-xl border border-line px-4 py-2 font-semibold">
              {t("finder.empty.contact")}
            </a>
          </div>
        </div>
      ) : (
        <ul class="grid gap-3">
          {results.map((r) => (
            <GroupCard
              key={r.grupo.id}
              resultado={r}
              lang={lang}
              t={t}
              active={r.grupo.id === activeId}
              onActivate={onActivate}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
