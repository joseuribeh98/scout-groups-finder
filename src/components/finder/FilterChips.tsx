import Icon from "@/components/Icon";
import { RAMA_IDS, RAMAS, ramaLabel, type RamaId } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Filters as FilterState } from "@/lib/search";

export interface Municipio {
  slug: string;
  nombre: string;
  count: number;
}

interface Props {
  lang: Lang;
  t: Translate;
  filters: FilterState;
  municipios: Municipio[];
  onChange: (next: FilterState) => void;
}

const chip =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold whitespace-nowrap hover:border-brand/60 aria-pressed:border-brand aria-pressed:bg-brand-soft";

export default function FilterChips({ lang, t, filters, municipios, onChange }: Props) {
  const toggleRama = (id: RamaId) =>
    onChange({
      ...filters,
      ramas: filters.ramas.includes(id)
        ? filters.ramas.filter((r) => r !== id)
        : RAMA_IDS.filter((r) => r === id || filters.ramas.includes(r)),
    });

  return (
    <div class="grid gap-2" aria-label={t("finder.filters")} role="group">
      {/* Municipio: selección única; la fila hace scroll horizontal si no cabe. */}
      <div
        class="-mx-4 flex gap-2 overflow-x-auto px-4 py-1.5 -my-1.5 [scrollbar-width:none]"
        role="group"
        aria-label={t("finder.municipio")}
      >
        <button
          type="button"
          class={chip}
          aria-pressed={filters.municipio === null}
          onClick={() => onChange({ ...filters, municipio: null })}
        >
          {t("finder.allValle")}
        </button>
        {municipios.map((m) => (
          <button
            key={m.slug}
            type="button"
            class={chip}
            aria-pressed={filters.municipio === m.slug}
            onClick={() =>
              onChange({ ...filters, municipio: filters.municipio === m.slug ? null : m.slug })
            }
          >
            {t("finder.municipioCount", { nombre: m.nombre, n: m.count })}
          </button>
        ))}
      </div>
      {/* Ramas: multiselección; el color oficial va solo en el punto. */}
      <div
        class="-mx-4 flex gap-2 overflow-x-auto px-4 py-1.5 -my-1.5 [scrollbar-width:none]"
        role="group"
        aria-label={t("finder.ramas")}
      >
        {RAMA_IDS.map((id) => {
          const pressed = filters.ramas.includes(id);
          const r = RAMAS[id];
          return (
            <button
              key={id}
              type="button"
              data-rama={id}
              aria-pressed={pressed}
              onClick={() => toggleRama(id)}
              class="rama-chip h-8 shrink-0 whitespace-nowrap hover:border-brand/60 aria-pressed:border-brand aria-pressed:bg-brand-soft"
            >
              {pressed && <Icon name="check" class="-mx-0.5 size-4 text-brand" />}
              {ramaLabel(id, lang)}
              <span class="font-normal text-ink-soft">
                · {r.edadMin}–{r.edadMax}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
