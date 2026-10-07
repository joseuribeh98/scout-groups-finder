import Icon from "@/components/Icon";
import MapPopup from "@/components/finder/MapPopup";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Resultado } from "@/lib/search";

interface Props {
  resultado: Resultado;
  lang: Lang;
  t: Translate;
  onClose: () => void;
}

/** Ficha resumida del grupo seleccionado, dentro de la hoja (móvil). Reutiliza el contenido del popup. */
export default function SelectedCard({ resultado, lang, t, onClose }: Props) {
  return (
    <div data-selected-card class="relative rounded-2xl border border-line bg-surface p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label={t("sheet.backToList")}
        class="absolute top-2 right-2 grid size-9 place-items-center rounded-full text-ink-soft hover:bg-brand-soft hover:text-ink"
      >
        <Icon name="x" class="size-5" />
      </button>
      <MapPopup grupo={resultado.grupo} distanciaKm={resultado.distanciaKm} lang={lang} t={t} />
    </div>
  );
}
