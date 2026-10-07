import type { ComponentChildren } from "preact";
import { useSheet } from "@/components/finder/useSheet";
import type { Translate } from "@/i18n/ui";

export type Snap = "peek" | "half" | "full";

interface Props {
  t: Translate;
  snap: Snap;
  onSnap: (next: Snap) => void;
  onPeekHeight?: (px: number) => void;
  header: ComponentChildren;
  /** Siempre montado (región en vivo), también con una ficha abierta. */
  status?: ComponentChildren;
  body: ComponentChildren;
}

/** Hoja inferior móvil. Sin JS es una columna estática; con JS, `.sheet[data-snap]` fija el alto. */
export default function Sheet({ t, snap, onSnap, onPeekHeight, header, status, body }: Props) {
  const expanded = snap === "full";
  const { ref, gripProps, onGripKeyDown } = useSheet({ snap, onSnap, onPeekHeight });
  return (
    <section
      ref={ref}
      data-finder-ui
      data-snap={snap}
      role="region"
      aria-label={t("sheet.results")}
      class="sheet bg-surface lg:hidden js:z-10 js:rounded-t-2xl js:shadow-[0_-6px_24px_rgb(20_10_30/0.18)]"
    >
      <div data-sheet-grip {...gripProps} class="shrink-0 touch-none px-4 pt-2 pb-1 select-none">
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
      <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{body}</div>
    </section>
  );
}
