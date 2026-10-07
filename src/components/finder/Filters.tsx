import { RAMA_IDS, RAMAS, ramaLabel, type RamaId } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Filters as FilterState } from "@/lib/search";

export type GeoStatus = "idle" | "locating" | "ok" | "error";

interface Props {
  lang: Lang;
  t: Translate;
  filters: FilterState;
  municipios: { slug: string; nombre: string }[];
  geoStatus: GeoStatus;
  canClear: boolean;
  onChange: (next: FilterState) => void;
  onNearMe: () => void;
  onClear: () => void;
}

export default function Filters({
  lang,
  t,
  filters,
  municipios,
  geoStatus,
  canClear,
  onChange,
  onNearMe,
  onClear,
}: Props) {
  const toggleRama = (id: RamaId) =>
    onChange({
      ...filters,
      ramas: filters.ramas.includes(id)
        ? filters.ramas.filter((r) => r !== id)
        : RAMA_IDS.filter((r) => r === id || filters.ramas.includes(r)),
    });

  return (
    <div class="grid gap-3" role="search">
      <label class="grid gap-1">
        <span class="text-sm font-semibold">{t("finder.searchLabel")}</span>
        <input
          type="search"
          value={filters.q}
          maxLength={100}
          placeholder={t("finder.searchPlaceholder")}
          onInput={(e) => onChange({ ...filters, q: e.currentTarget.value })}
          class="h-12 rounded-xl border border-line bg-surface px-4 text-base placeholder:text-ink-soft"
        />
      </label>
      <div class="flex flex-wrap items-end gap-2">
        <label class="grid flex-1 gap-1">
          <span class="text-sm font-semibold">{t("finder.municipio")}</span>
          <select
            value={filters.municipio ?? ""}
            onChange={(e) => onChange({ ...filters, municipio: e.currentTarget.value || null })}
            class="h-11 rounded-xl border border-line bg-surface px-3"
          >
            <option value="">{t("finder.allMunicipios")}</option>
            {municipios.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onNearMe}
          aria-pressed={geoStatus === "ok"}
          aria-disabled={geoStatus === "locating"}
          aria-busy={geoStatus === "locating"}
          class="h-11 rounded-xl border border-line bg-surface px-4 font-semibold aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-on-brand aria-disabled:opacity-60"
        >
          {geoStatus === "locating" ? t("finder.locating") : t("finder.nearMe")}
        </button>
      </div>
      <fieldset class="grid gap-2">
        <legend class="text-sm font-semibold">{t("finder.ramas")}</legend>
        <div class="flex flex-wrap gap-2">
          {RAMA_IDS.map((id) => (
            <button
              key={id}
              type="button"
              data-rama={id}
              aria-pressed={filters.ramas.includes(id)}
              onClick={() => toggleRama(id)}
              class="rama-chip border-2 border-transparent py-1 aria-pressed:border-[var(--rama)]"
            >
              {ramaLabel(id, lang)}
              <span class="font-normal">
                {t("finder.ramaAge", { min: RAMAS[id].edadMin, max: RAMAS[id].edadMax })}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {geoStatus === "error" && (
        <p role="status" class="rounded-xl bg-brand-soft px-3 py-2 text-sm">
          {t("finder.geoError")}
        </p>
      )}
      {canClear && (
        <button
          type="button"
          onClick={onClear}
          class="justify-self-start text-sm font-semibold text-brand underline"
        >
          {t("finder.clear")}
        </button>
      )}
    </div>
  );
}
