import type { ComponentChildren } from "preact";
import { useSheet } from "@/components/finder/useSheet";
import type { Translate } from "@/i18n/ui";

export type Snap = "peek" | "half" | "full";

interface Props {
  t: Translate;
  snap: Snap;
  onSnap: (next: Snap) => void;
  onPeekHeight?: (px: number) => void;
  /** El cuerpo hace scroll propio (y un gesto sobre él no mueve la hoja). Si no, deslizar la mueve. */
  bodyScrolls: boolean;
  header: ComponentChildren;
  /** Siempre montado (región en vivo), también con una ficha abierta. */
  status?: ComponentChildren;
  body: ComponentChildren;
}

/**
 * Hoja inferior móvil. Sin JS es una columna estática; con JS, `.sheet[data-snap]` fija el alto.
 * Deslizar sobre cualquier parte de la hoja la mueve; la lista solo hace scroll con la hoja completa
 * o con una tarjeta abierta (`bodyScrolls`), como en las apps de mapas de iOS.
 */
export default function Sheet({
  t,
  snap,
  onSnap,
  onPeekHeight,
  bodyScrolls,
  header,
  status,
  body,
}: Props) {
  const expanded = snap === "full";
  const { ref, dragProps, onGripKeyDown } = useSheet({ snap, onSnap, onPeekHeight, bodyScrolls });
  return (
    <section
      ref={ref}
      {...dragProps}
      data-finder-ui
      data-snap={snap}
      role="region"
      aria-label={t("sheet.results")}
      class="sheet bg-surface lg:hidden js:z-10 js:rounded-t-2xl js:shadow-[0_-6px_24px_rgb(20_10_30/0.18)]"
    >
      <div data-sheet-grip class="shrink-0 touch-none px-4 pt-2 pb-1 select-none">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? t("sheet.collapse") : t("sheet.expand")}
          onClick={() => onSnap(expanded ? "peek" : "full")}
          onKeyDown={onGripKeyDown}
          class="mx-auto block h-6 w-16 rounded-full before:mx-auto before:mt-2 before:block before:h-1.5 before:w-10 before:rounded-full before:bg-line"
        />
        {header}
        {status}
      </div>
      {/* overscroll-contain: en iOS el scroll de la lista no arrastra la página entera. Sin JS el
          cuerpo es flujo normal; con JS, scroll propio solo cuando bodyScrolls, y si no, el gesto
          (touch-action: none) mueve la hoja. */}
      <div
        data-sheet-body
        class={`min-h-0 flex-1 px-4 pb-4 ${
          bodyScrolls
            ? "js:overflow-y-auto js:overscroll-contain"
            : "js:touch-none js:overflow-hidden"
        }`}
      >
        {body}
      </div>
    </section>
  );
}
