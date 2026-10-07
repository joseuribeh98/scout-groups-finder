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
}

export default function GroupCard({ resultado, lang, t, active, onActivate }: Props) {
  const { grupo, distanciaKm } = resultado;
  const lugar = grupo.localidad ? `${grupo.localidad}, ${grupo.municipio}` : grupo.municipio;
  const { whatsapp } = grupo.contacto;

  return (
    <li
      data-grupo-id={grupo.id}
      data-active={active ? "true" : undefined}
      class="group relative rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md data-[active=true]:border-brand data-[active=true]:shadow-md"
      onMouseEnter={() => onActivate(grupo.id)}
      onMouseLeave={() => onActivate(null)}
      onFocusCapture={() => onActivate(grupo.id)}
    >
      <p class="text-xs font-semibold tracking-wide text-ink-soft uppercase">
        {t("grupo.number", { id: grupo.id })} · {lugar}
        {distanciaKm !== null && (
          <span class="ml-1 normal-case tabular-nums">
            · {t("card.distance", { d: formatDistance(distanciaKm, lang) })}
          </span>
        )}
      </p>
      <h3 class="mt-1 text-lg font-bold">
        <a
          href={grupoPath(lang, grupo)}
          class="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-focus-within:underline"
        >
          {grupo.nombre}
        </a>
      </h3>
      <p class="mt-1 text-sm text-ink-soft tabular-nums">{formatReunion(grupo.reunion, lang)}</p>
      <ul class="mt-3 flex flex-wrap gap-1.5">
        {grupo.ramas.map((id) => (
          <li key={id} class="rama-chip" data-rama={id}>
            {ramaLabel(id, lang)}
          </li>
        ))}
      </ul>
      {whatsapp && (
        <a
          href={whatsappUrl(
            whatsapp,
            t("grupo.whatsappMsg", { id: grupo.id, nombre: grupo.nombre }),
          )}
          target="_blank"
          rel="noopener noreferrer"
          class="relative z-10 mt-3 inline-flex rounded-full bg-whatsapp px-3 py-1.5 text-sm font-semibold text-white dark:text-canvas"
          aria-label={t("card.whatsapp", { nombre: grupo.nombre })}
        >
          WhatsApp
        </a>
      )}
    </li>
  );
}
