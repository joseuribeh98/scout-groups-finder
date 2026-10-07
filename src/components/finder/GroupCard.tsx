import Icon from "@/components/Icon";
import { ramaLabel } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import type { Translate } from "@/i18n/ui";
import { whatsappUrl } from "@/lib/contact";
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

export default function GroupCard({ resultado, lang, t, active, onActivate, onFocusGroup }: Props) {
  const { grupo, distanciaKm } = resultado;
  const lugar = grupo.localidad ? `${grupo.localidad}, ${grupo.municipio}` : grupo.municipio;
  const { whatsapp } = grupo.contacto;
  const nameId = `grupo-${grupo.id}-nombre`;

  return (
    <li
      data-grupo-id={grupo.id}
      data-active={active ? "true" : undefined}
      class="relative rounded-2xl border border-line bg-surface p-4 transition-[border-color,background-color,box-shadow] hover:border-brand/50 hover:shadow-md data-[active=true]:border-brand data-[active=true]:bg-brand-soft data-[active=true]:shadow-md"
      onMouseEnter={() => onActivate(grupo.id)}
      onMouseLeave={() => onActivate(null)}
      onFocusCapture={() => onActivate(grupo.id)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onActivate(null);
      }}
    >
      <p class="text-xs font-semibold tracking-wide text-ink-soft uppercase">
        {t("grupo.number", { id: grupo.id })} · {lugar}
      </p>
      <h3 id={nameId} class="mt-1 text-lg leading-snug font-bold">
        {grupo.nombre}
      </h3>
      {/* Toda la tarjeta es un botón que muestra el grupo en el mapa; los enlaces van encima. */}
      <button
        type="button"
        class="absolute inset-0 cursor-pointer rounded-2xl"
        aria-label={t("card.showOnMap", { nombre: grupo.nombre })}
        onClick={() => onFocusGroup(grupo.id)}
      />
      <p class="mt-1 flex items-center gap-1.5 text-sm text-ink-soft tabular-nums">
        <Icon name="clock" class="size-4" />
        {formatReunion(grupo.reunion, lang)}
      </p>
      <ul class="mt-3 flex flex-wrap gap-1.5">
        {grupo.ramas.map((id) => (
          <li key={id} class="rama-chip" data-rama={id}>
            {ramaLabel(id, lang)}
          </li>
        ))}
      </ul>
      <div class="mt-3 flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-ink-soft tabular-nums">
          {distanciaKm !== null && t("card.distance", { d: formatDistance(distanciaKm, lang) })}
        </p>
        <div class="relative z-10 flex items-center gap-2">
          <a
            href={grupoPath(lang, grupo)}
            aria-describedby={nameId}
            class="inline-flex h-10 items-center gap-1 rounded-full pr-2.5 pl-3.5 text-sm font-semibold text-brand hover:bg-brand-soft hover:underline"
          >
            {t("card.details")}
            <Icon name="chevron-right" class="size-4" />
          </a>
          {whatsapp && (
            <a
              href={whatsappUrl(
                whatsapp,
                t("grupo.whatsappMsg", { id: grupo.id, nombre: grupo.nombre }),
              )}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex size-10 items-center justify-center rounded-full bg-whatsapp text-white dark:text-canvas"
              aria-label={t("card.whatsapp", { nombre: grupo.nombre })}
            >
              <Icon name="whatsapp" class="size-5" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
