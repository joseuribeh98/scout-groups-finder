import Icon from "@/components/Icon";
import { RAMA_IDS, RAMAS, ramaLabel, type RamaId } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { GeoStatus } from "@/components/finder/SearchBar";
import type { Filters as FilterState } from "@/lib/search";

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

  const geoMessage =
    geoStatus === "error"
      ? t("finder.geoError")
      : geoStatus === "far"
        ? t("finder.geoFar")
        : geoStatus === "ok"
          ? t("finder.nearMeActive")
          : geoStatus === "locating"
            ? t("finder.locating")
            : "";

  return (
    <div class="grid gap-3" role="search">
      <label class="grid gap-1">
        <span class="text-sm font-semibold">{t("finder.searchLabel")}</span>
        <span class="relative">
          <Icon
            name="search"
            class="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-soft"
          />
          <input
            type="search"
            value={filters.q}
            maxLength={100}
            placeholder={t("finder.searchPlaceholder")}
            onInput={(e) => onChange({ ...filters, q: e.currentTarget.value })}
            class="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-base placeholder:text-ink-soft"
          />
        </span>
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
          class="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 font-semibold hover:bg-brand-soft aria-disabled:opacity-60 aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-on-brand"
        >
          <Icon name="locate-fixed" />
          {geoStatus === "locating" ? t("finder.locating") : t("finder.nearMe")}
        </button>
      </div>
      <fieldset class="grid gap-2">
        <legend class="text-sm font-semibold">{t("finder.ramas")}</legend>
        <div class="flex flex-wrap gap-2">
          {RAMA_IDS.map((id) => {
            const pressed = filters.ramas.includes(id);
            return (
              <button
                key={id}
                type="button"
                data-rama={id}
                aria-pressed={pressed}
                onClick={() => toggleRama(id)}
                class="rama-chip min-h-9 py-1 hover:border-brand/60 aria-pressed:border-brand aria-pressed:bg-brand-soft"
              >
                {pressed && <Icon name="check" class="-mx-0.5 size-4 text-brand" />}
                {ramaLabel(id, lang)}
                <span class="font-normal text-ink-soft">
                  {t("finder.ramaAge", { min: RAMAS[id].edadMin, max: RAMAS[id].edadMax })}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <p role="status" class="rounded-xl bg-brand-soft px-3 py-2 text-sm empty:hidden">
        {geoMessage || null}
      </p>
      {canClear && (
        <button
          type="button"
          onClick={onClear}
          class="justify-self-start text-sm font-semibold text-brand underline underline-offset-4"
        >
          {t("finder.clear")}
        </button>
      )}
    </div>
  );
}
