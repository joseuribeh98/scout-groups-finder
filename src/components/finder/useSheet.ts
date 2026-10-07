import { useEffect, useRef } from "preact/hooks";
import type { Snap } from "@/components/finder/Sheet";

const ORDER: Snap[] = ["peek", "half", "full"];
export const PEEK = 0.3;
export const HALF = 0.55;
/** Offset de los controles del mapa para cada posición (única fuente de verdad). */
export const SNAP_OFFSET: Record<Snap, string> = {
  peek: "30%",
  half: "55%",
  // Con la hoja completa los controles quedan fuera de pantalla (bajo la búsqueda flotante no serían tocables).
  full: "100%",
};
/** 4.5rem: espacio para la búsqueda flotante; sincronizado con `.sheet[data-snap="full"]` en global.css. */
const FULL_GAP = 72;
const TAP_PX = 8;
const FLICK_PX = 60;

interface Options {
  snap: Snap;
  onSnap: (next: Snap) => void;
  /** Avisa el alto en píxeles de la posición "asomada" (para el padding del mapa). */
  onPeekHeight?: ((px: number) => void) | undefined;
}

/** Posiciones y arrastre de la hoja. Fija `--sheet-h` por CSSOM durante el arrastre. */
export function useSheet({ snap, onSnap, onPeekHeight }: Options) {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ startY: number; startH: number; active: boolean } | null>(null);

  const bounds = () => {
    const parent = ref.current?.parentElement;
    const total = parent?.clientHeight ?? 0;
    return {
      peek: Math.round(total * PEEK),
      half: Math.round(total * HALF),
      full: total - FULL_GAP,
    };
  };

  useEffect(() => {
    if (!onPeekHeight) return;
    const report = () => onPeekHeight(bounds().peek);
    report();
    const ro = new ResizeObserver(report);
    if (ref.current?.parentElement) ro.observe(ref.current.parentElement);
    return () => ro.disconnect();
  }, [onPeekHeight]);

  const step = (dir: 1 | -1) => {
    const i = ORDER.indexOf(snap) + dir;
    if (i >= 0 && i < ORDER.length) onSnap(ORDER[i]!);
  };

  /** Termina el arrastre y deja los controles del mapa en el offset de la posición final. */
  const endDrag = (settled: Snap = snap) => {
    const el = ref.current;
    drag.current = null;
    el?.classList.remove("is-dragging");
    el?.style.removeProperty("--sheet-h");
    el?.parentElement?.style.setProperty("--sheet-offset", SNAP_OFFSET[settled]);
  };

  const gripProps = {
    onPointerDown: (e: PointerEvent) => {
      const el = ref.current;
      if (!el || e.button !== 0) return;
      // El arrastre arranca al superar TAP_PX: capturar antes desviaría el clic de botones y chips.
      drag.current = {
        startY: e.clientY,
        startH: el.getBoundingClientRect().height,
        active: false,
      };
    },
    onPointerMove: (e: PointerEvent) => {
      const el = ref.current;
      if (!el || !drag.current) return;
      if (e.buttons === 0) {
        // Pulsación obsoleta: se soltó fuera del asa antes de iniciar el arrastre.
        drag.current = null;
        return;
      }
      if (!drag.current.active) {
        if (Math.abs(drag.current.startY - e.clientY) < TAP_PX) return;
        drag.current.active = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        el.classList.add("is-dragging");
      }
      const { peek, full } = bounds();
      const h = Math.min(
        full,
        Math.max(peek, drag.current.startH + (drag.current.startY - e.clientY)),
      );
      el.style.setProperty("--sheet-h", `${h}px`);
      // Los controles del mapa siguen el borde superior de la hoja mientras se arrastra.
      el.parentElement?.style.setProperty("--sheet-offset", `${h}px`);
    },
    onPointerUp: (e: PointerEvent) => {
      if (!drag.current) return;
      const { active, startY, startH } = drag.current;
      const dy = startY - e.clientY;
      const h = startH + dy;
      if (!active) return endDrag(); // un toque lo gestiona el botón del asa
      const b = bounds();
      const nearest = ORDER.reduce((best, s) =>
        Math.abs(b[s] - h) < Math.abs(b[best] - h) ? s : best,
      );
      // Un gesto corto que cae en la misma posición avanza un paso en su dirección.
      let settled = nearest;
      if (nearest === snap && Math.abs(dy) > FLICK_PX) {
        settled = ORDER[ORDER.indexOf(snap) + (dy > 0 ? 1 : -1)] ?? snap;
      }
      endDrag(settled);
      if (settled !== snap) onSnap(settled);
    },
    onPointerCancel: () => endDrag(),
    onLostPointerCapture: (e: PointerEvent) => {
      // Si el asa pierde la captura sin pointerup, abandona el arrastre en curso. En táctil, al capturar en el
      // asa se suelta la captura implícita del botón hijo: ese evento (que burbujea hasta aquí) se ignora.
      if (drag.current && e.target === e.currentTarget) endDrag();
    },
  };

  const onGripKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      step(1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      step(-1);
    }
  };

  return { ref, gripProps, onGripKeyDown };
}
