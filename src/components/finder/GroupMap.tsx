import type * as Leaflet from "leaflet";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import MapPopup from "@/components/finder/MapPopup";
import {
  addTiles,
  addValleHighlight,
  clusterIcon,
  loadLeaflet,
  motionOptions,
  prefersReducedMotion,
  pinIcon,
  watchTileFailures,
  watchZoomLabels,
} from "@/components/map/leaflet";
import { VALLE_CENTER, VALLE_ZOOM } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { LatLng } from "@/lib/geo";
import type { Resultado } from "@/lib/search";

// Arranca la descarga de Leaflet en cuanto el navegador evalúa la isla, en paralelo con la
// hidratación. Si falla, el componente lo reintenta y muestra el aviso; aquí solo se ignora.
if (typeof window !== "undefined") {
  void loadLeaflet().catch(() => undefined);
}

/** "Cerca de mí": se encuadra al usuario y a los grupos a ≤ NEAR_KM (máx. NEAR_MAX); si no hay, al más cercano. */
export const NEAR_KM = 15;
export const NEAR_MAX = 8;

export interface FocusRequest {
  id: number;
  /** Cambia en cada clic para que repetir la misma tarjeta vuelva a enfocar el pin. */
  nonce: number;
}

export interface FitPadding {
  topLeft: [number, number];
  bottomRight: [number, number];
}

interface Props {
  results: Resultado[];
  activeId: number | null;
  origin: LatLng | null;
  lang: Lang;
  t: Translate;
  fitPadding: FitPadding;
  /** Móvil: alto de relleno inferior con la tarjeta abierta (hoja a media altura); sustituye al de fitPadding al enfocar. */
  focusBottomPad?: number;
  /** Escritorio: popups de Leaflet. Móvil: la ficha se muestra en la hoja (sin popups). */
  popups: boolean;
  focusRequest: FocusRequest | null;
  onSelect: (id: number) => void;
  onPopupOpen: (id: number) => void;
  onPopupClose: () => void;
}

type L = typeof Leaflet;

export default function GroupMap({
  results,
  activeId,
  origin,
  lang,
  t,
  fitPadding,
  focusBottomPad,
  popups,
  focusRequest,
  onSelect,
  onPopupOpen,
  onPopupClose,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<L | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const cluster = useRef<Leaflet.MarkerClusterGroup | null>(null);
  const markers = useRef(new Map<number, Leaflet.Marker>());
  const popupNodes = useRef<HTMLDivElement[]>([]);
  const youMarker = useRef<Leaflet.Marker | null>(null);
  const handledFocus = useRef<number | null>(null);
  const tRef = useRef(t);
  tRef.current = t;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onPopupOpenRef = useRef(onPopupOpen);
  onPopupOpenRef.current = onPopupOpen;
  const onPopupCloseRef = useRef(onPopupClose);
  onPopupCloseRef.current = onPopupClose;
  const paddingSeen = useRef(false);
  const fitted = useRef(false);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const fitPaddingRef = useRef(fitPadding);
  fitPaddingRef.current = fitPadding;
  const focusBottomPadRef = useRef(focusBottomPad);
  focusBottomPadRef.current = focusBottomPad;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  // Crear el mapa una sola vez. La descarga de Leaflet ya arrancó al evaluar este módulo.
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      loadLeaflet()
        .then((L) => {
          if (cancelled || !container.current) return;
          leaflet.current = L;
          const m = L.map(container.current, {
            center: [VALLE_CENTER.lat, VALLE_CENTER.lng],
            zoom: VALLE_ZOOM,
            zoomControl: false,
            ...motionOptions(),
          });
          L.control
            .zoom({
              position: "bottomright",
              zoomInTitle: tRef.current("map.zoomIn"),
              zoomOutTitle: tRef.current("map.zoomOut"),
            })
            .addTo(m);
          watchZoomLabels(m);
          watchTileFailures(addTiles(L, m), () => setTilesFailed(true));
          // El chunk ya está cargado: resuelve de inmediato. Si fallara, el mapa sigue sin resaltado.
          void addValleHighlight(m).catch(() => undefined);
          cluster.current = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            iconCreateFunction: (c) => clusterIcon(L, c.getChildCount()),
          }).addTo(m);
          // Leaflet etiqueta el botón de cerrar en inglés; se traduce al abrir cada popup.
          m.on("popupopen", (e) => {
            const close = e.popup.getElement()?.querySelector(".leaflet-popup-close-button");
            close?.setAttribute("aria-label", tRef.current("popup.close"));
            close?.setAttribute("title", tRef.current("popup.close"));
          });
          // Abrir otro popup cierra el anterior en la misma tarea: solo se avisa si no queda ninguno.
          let popupOpen = false;
          m.on("popupopen", (e) => {
            popupOpen = true;
            const source = (e.popup as unknown as { _source?: Leaflet.Layer })._source;
            for (const [id, marker] of markers.current) {
              if (marker === source) onPopupOpenRef.current(id);
            }
          });
          m.on("popupclose", () => {
            popupOpen = false;
            queueMicrotask(() => {
              if (!popupOpen) onPopupCloseRef.current();
            });
          });
          map.current = m;
          setReady(true);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };
    // Sin espera a tiempo ocioso: el mapa es el contenido principal (LCP) y cada salto de la
    // cadena Finder → Leaflet → teselas cuesta un viaje de red en móvil.
    start();
    return () => {
      cancelled = true;
      unmountPopups();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  function unmountPopups() {
    for (const div of popupNodes.current) render(null, div);
    popupNodes.current = [];
  }

  const focusPending = () => focusRequest !== null && handledFocus.current !== focusRequest.nonce;

  const fitToResults = ({ allowAnimation = true } = {}) => {
    const L = leaflet.current;
    const m = map.current;
    if (!L || !m || results.length === 0) return;
    let bounds: Leaflet.LatLngBounds;
    if (origin) {
      // Con origen los resultados llegan ordenados por distancia.
      const nearby = results
        .filter((r) => r.distanciaKm !== null && r.distanciaKm <= NEAR_KM)
        .slice(0, NEAR_MAX);
      const focus = nearby.length > 0 ? nearby : results.slice(0, 1);
      bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        ...focus.map(({ grupo }): [number, number] => [grupo.ubicacion.lat, grupo.ubicacion.lng]),
      ]);
    } else {
      bounds = L.latLngBounds(
        results.map(({ grupo }) => [grupo.ubicacion.lat, grupo.ubicacion.lng]),
      );
    }
    // Un clic en una tarjeta pendiente decide la vista; encuadrar ahora competiría con él.
    if (focusPending()) return;
    const p = fitPaddingRef.current;
    // El primer encuadre no se anima: una animación en curso descartaría el siguiente (p. ej. "Cerca de mí").
    // Los reencuadres por cambio de relleno tampoco: Leaflet oculta las teselas nuevas mientras anima
    // el zoom, y eso retrasaba el primer pintado (LCP) justo después de cargar.
    const animate = allowAnimation && fitted.current && !prefersReducedMotion();
    fitted.current = true;
    m.fitBounds(bounds, {
      paddingTopLeft: p.topLeft,
      paddingBottomRight: p.bottomRight,
      maxZoom: 15,
      animate,
    });
  };

  // Redibujar marcadores cuando cambian los resultados.
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    const group = cluster.current;
    if (!ready || !L || !m || !group) return;

    group.clearLayers();
    markers.current.clear();
    unmountPopups();
    for (const { grupo, distanciaKm } of results) {
      const marker = L.marker([grupo.ubicacion.lat, grupo.ubicacion.lng], {
        icon: pinIcon(L, "default", grupo.id),
        title: grupo.nombre,
      });
      if (popups) {
        const popup = document.createElement("div");
        render(<MapPopup grupo={grupo} distanciaKm={distanciaKm} lang={lang} t={t} />, popup);
        popupNodes.current.push(popup);
        marker.bindPopup(popup, { maxWidth: 300, minWidth: 240 });
      }
      marker.on("click", () => onSelectRef.current(grupo.id));
      markers.current.set(grupo.id, marker);
      group.addLayer(marker);
    }

    fitToResults();
  }, [ready, results, origin, lang, t, popups]);

  // Reencuadrar cuando cambia el relleno (p. ej. al medir la altura asomada de la hoja).
  useEffect(() => {
    // La primera ejecución ya la cubre el efecto de resultados; con una selección en pantalla no se mueve la vista.
    if (!ready) return;
    if (!paddingSeen.current) {
      paddingSeen.current = true;
      return;
    }
    if (activeIdRef.current === null) fitToResults({ allowAnimation: false });
  }, [
    ready,
    fitPadding.topLeft[0],
    fitPadding.topLeft[1],
    fitPadding.bottomRight[0],
    fitPadding.bottomRight[1],
  ]);

  // Marcador "tu ubicación".
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    if (!ready || !L || !m) return;
    youMarker.current?.remove();
    youMarker.current = origin
      ? L.marker([origin.lat, origin.lng], {
          icon: pinIcon(L, "you"),
          title: t("map.you"),
          keyboard: false,
        }).addTo(m)
      : null;
  }, [ready, origin, t]);

  // Resaltar el pin activo.
  useEffect(() => {
    const L = leaflet.current;
    if (!ready || !L) return;
    for (const [id, marker] of markers.current) {
      marker.setIcon(pinIcon(L, id === activeId ? "active" : "default", id));
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    }
  }, [ready, activeId, results]);

  // Clic en una tarjeta: acercar al pin y abrir su popup (escritorio).
  useEffect(() => {
    const m = map.current;
    const group = cluster.current;
    if (!ready || !m || !group || !focusRequest || !focusPending()) return;
    // Se da por atendida antes de buscar el pin: si el grupo ya no está, no debe reaplicarse.
    handledFocus.current = focusRequest.nonce;
    const marker = markers.current.get(focusRequest.id);
    if (!marker) return;
    m.invalidateSize();
    const animate = !prefersReducedMotion();
    group.zoomToShowLayer(marker, () => {
      const zoom = Math.max(m.getZoom(), 15);
      // Sin popup, el centro baja medio padding inferior para que el pin quede sobre la hoja.
      const off = Math.round(
        (focusBottomPadRef.current ?? fitPaddingRef.current.bottomRight[1]) / 2,
      );
      const target = popups
        ? marker.getLatLng()
        : m.unproject(m.project(marker.getLatLng(), zoom).add([0, off]), zoom);
      m.setView(target, zoom, { animate });
      if (popups) marker.openPopup();
    });
  }, [ready, focusRequest, results]);

  if (failed) {
    return (
      <div
        class="grid h-full place-items-center rounded-2xl border border-line bg-brand-soft p-6 text-center"
        data-map-error
      >
        <p>
          {t("map.error")}{" "}
          <a
            class="font-semibold underline"
            href={`https://www.google.com/maps/@${VALLE_CENTER.lat},${VALLE_CENTER.lng},${VALLE_ZOOM}z`}
          >
            {t("map.openGoogle")}
          </a>
        </p>
      </div>
    );
  }
  return (
    <div class="relative h-full w-full">
      <div ref={container} role="region" aria-label={t("map.label")} class="h-full w-full" />
      {tilesFailed && (
        <p
          role="status"
          class="absolute inset-x-3 top-3 z-[500] rounded-xl border border-line bg-brand-soft p-3 text-sm"
          data-tiles-error
        >
          {t("map.error")}
        </p>
      )}
    </div>
  );
}
