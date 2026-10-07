import Icon from "@/components/Icon";
import type { Translate } from "@/i18n/ui";

export type GeoStatus = "idle" | "locating" | "ok" | "error" | "far";

interface Props {
  t: Translate;
  q: string;
  geoStatus: GeoStatus;
  /** Móvil: el botón "Cerca de mí" es solo icono. */
  compact?: boolean;
  onChange: (q: string) => void;
  onNearMe: () => void;
  onFocus?: () => void;
  onBlur?: (e: FocusEvent) => void;
}

export default function SearchBar({
  t,
  q,
  geoStatus,
  compact = false,
  onChange,
  onNearMe,
  onFocus,
  onBlur,
}: Props) {
  const locating = geoStatus === "locating";
  return (
    <div
      role="search"
      class="flex h-12 items-center gap-1 rounded-full border border-line bg-surface pr-1.5 pl-4 shadow-sm focus-within:border-brand"
    >
      <Icon name="search" class="size-5 shrink-0 text-ink-soft" />
      <input
        type="search"
        value={q}
        maxLength={100}
        aria-label={t("finder.searchLabel")}
        placeholder={t("finder.searchPlaceholder")}
        onInput={(e) => onChange(e.currentTarget.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        class="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-soft"
      />
      <button
        type="button"
        onClick={onNearMe}
        aria-pressed={geoStatus === "ok"}
        aria-disabled={locating}
        aria-busy={locating}
        aria-label={compact ? t("finder.nearMe") : undefined}
        title={compact ? t("finder.nearMe") : undefined}
        class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand hover:bg-brand-soft aria-disabled:opacity-60 aria-pressed:bg-brand aria-pressed:text-on-brand"
      >
        <Icon name="locate-fixed" class="size-5" />
        {!compact && (locating ? t("finder.locating") : t("finder.nearMe"))}
      </button>
    </div>
  );
}
