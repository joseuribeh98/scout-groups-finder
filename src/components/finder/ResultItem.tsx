import Icon from "@/components/Icon";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import type { Translate } from "@/i18n/ui";
import { formatDistance } from "@/lib/geo";
import { formatReunion } from "@/lib/schedule";
import type { Resultado } from "@/lib/search";

interface Props {
  resultado: Resultado;
  lang: Lang;
  t: Translate;
  active: boolean;
  onActivate: (id: number | null) => void;
  onFocusGroup: (id: number) => void;
}

const RAMA_DOT: Record<string, string> = {
  cachorros: "bg-rama-cachorros",
  lobatos: "bg-rama-lobatos",
  scouts: "bg-rama-scouts",
  nomadas: "bg-rama-nomadas",
  rovers: "bg-rama-rovers",
};

export default function ResultItem({
  resultado,
  lang,
  t,
  active,
  onActivate,
  onFocusGroup,
}: Props) {
  const { grupo, distanciaKm } = resultado;
  const lugar = grupo.localidad ? `${grupo.localidad}, ${grupo.municipio}` : grupo.municipio;
  return (
    <li
      data-grupo-id={grupo.id}
      data-active={active ? "true" : undefined}
      class="relative -mx-2 flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-brand-soft/60 data-[active=true]:bg-brand-soft"
      onMouseEnter={() => onActivate(grupo.id)}
      onMouseLeave={() => onActivate(null)}
      onFocusCapture={() => onActivate(grupo.id)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onActivate(null);
      }}
    >
      <div class="min-w-0 flex-1">
        {/* El nombre es el botón que muestra el grupo en el mapa; su área de clic cubre el ítem. */}
        <button
          type="button"
          class="text-left text-base leading-snug font-bold after:absolute after:inset-0 after:rounded-xl"
          aria-label={t("card.showOnMap", { nombre: grupo.nombre })}
          onClick={() => onFocusGroup(grupo.id)}
        >
          {grupo.nombre}
        </button>
        <p class="mt-0.5 text-sm text-ink-soft tabular-nums">
          {t("grupo.number", { id: grupo.id })} · {lugar} · {formatReunion(grupo.reunion, lang)}
        </p>
        <ul class="mt-1.5 flex gap-1" aria-hidden="true">
          {grupo.ramas.map((id) => (
            <li key={id} class={`size-2 rounded-full ${RAMA_DOT[id]}`} />
          ))}
        </ul>
      </div>
      <div class="relative z-10 flex shrink-0 flex-col items-end gap-1.5">
        {distanciaKm !== null && (
          <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand tabular-nums">
            {formatDistance(distanciaKm, lang)}
          </span>
        )}
        <a
          href={grupoPath(lang, grupo)}
          aria-label={t("card.detailsOf", { nombre: grupo.nombre })}
          class="inline-flex h-9 items-center gap-0.5 rounded-full pr-1.5 pl-2.5 text-sm font-semibold text-brand hover:bg-brand-soft hover:underline"
        >
          {t("card.details")}
          <Icon name="chevron-right" class="size-4" />
        </a>
      </div>
    </li>
  );
}
