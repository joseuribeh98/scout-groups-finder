import Icon from "@/components/Icon";
import { ramaLabel } from "@/data/ramas";
import type { Grupo } from "@/data/schema";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import type { Translate } from "@/i18n/ui";
import { directionsUrl, whatsappUrl } from "@/lib/contact";
import { formatDistance } from "@/lib/geo";
import { formatReunion } from "@/lib/schedule";

interface Props {
  grupo: Grupo;
  distanciaKm: number | null;
  lang: Lang;
  t: Translate;
}

const action =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold";

/** Contenido del popup de un pin. Se monta con `render()` de Preact: nunca innerHTML. */
export default function MapPopup({ grupo, distanciaKm, lang, t }: Props) {
  const lugar = grupo.localidad ? `${grupo.localidad}, ${grupo.municipio}` : grupo.municipio;
  const { whatsapp } = grupo.contacto;
  return (
    <div class="map-popup grid gap-2 pr-4">
      <p class="text-xs font-semibold tracking-wide text-ink-soft uppercase">
        {t("grupo.number", { id: grupo.id })} · {lugar}
      </p>
      <p class="map-popup__name text-base leading-snug font-bold">{grupo.nombre}</p>
      <p class="flex items-start gap-1.5 text-ink-soft tabular-nums">
        <Icon name="clock" class="mt-0.5 size-4" />
        <span>{formatReunion(grupo.reunion, lang)}</span>
      </p>
      <ul class="flex flex-wrap gap-1">
        {grupo.ramas.map((id) => (
          <li key={id} class="rama-chip px-2 text-xs" data-rama={id}>
            {ramaLabel(id, lang)}
          </li>
        ))}
      </ul>
      {distanciaKm !== null && (
        <p class="text-ink-soft tabular-nums">
          {t("card.distance", { d: formatDistance(distanciaKm, lang) })}
        </p>
      )}
      <div class="mt-1 flex items-center gap-2">
        {whatsapp && (
          <a
            href={whatsappUrl(
              whatsapp,
              t("grupo.whatsappMsg", { id: grupo.id, nombre: grupo.nombre }),
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("card.whatsapp", { nombre: grupo.nombre })}
            class={`${action} map-popup__whatsapp w-9 shrink-0`}
          >
            <Icon name="whatsapp" class="size-4" />
          </a>
        )}
        <a
          href={directionsUrl(grupo.ubicacion)}
          target="_blank"
          rel="noopener noreferrer"
          class={`${action} flex-1 border border-line px-2 hover:bg-brand-soft`}
        >
          <Icon name="navigation" class="size-4" />
          {t("grupo.directions")}
        </a>
        <a href={grupoPath(lang, grupo)} class={`${action} map-popup__primary flex-1 px-2`}>
          {t("card.details")}
          <Icon name="chevron-right" class="size-4" />
        </a>
      </div>
    </div>
  );
}
