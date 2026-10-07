import type * as Leaflet from "leaflet";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import MapPopup from "@/components/finder/MapPopup";
import {
  addTiles,
  clusterIcon,
  loadLeaflet,
  motionOptions,
  prefersReducedMotion,
  pinIcon,
  watchTileFailures,
} from "@/components/map/leaflet";
import { VALLE_CENTER, VALLE_ZOOM } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { LatLng } from "@/lib/geo";
import type { Resultado } from "@/lib/search";

export interface FocusRequest {
  id: number;
  /** Cambia en cada clic para que repetir la misma tarjeta vuelva a enfocar el pin. */
  nonce: number;
}

interface Props {
  results: Resultado[];
  activeId: number | null;
  origin: LatLng | null;
  lang: Lang;
  t: Translate;
  visible: boolean;
  focusRequest: FocusRequest | null;
  onSelect: (id: number) => void;
  onPopupClose: () => void;
}

type L = typeof Leaflet;

export default function GroupMap({
  results,
  activeId,
  origin,
  lang,
  t,
  visible,
  focusRequest,
  onSelect,
  onPopupClose,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<L | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const cluster = useRef<Leaflet.MarkerClusterGroup | null>(null);
  const markers = useRef(new Map<number, Leaflet.Marker>());
  const popups = useRef<HTMLDivElement[]>([]);
  const youMarker = useRef<Leaflet.Marker | null>(null);
  const handledFocus = useRef<number | null>(null);
  const tRef = useRef(t);
  tRef.current = t;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onPopupCloseRef = useRef(onPopupClose);
  onPopupCloseRef.current = onPopupClose;
  const needsFit = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  // Crear el mapa una sola vez.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !container.current) return;
        leaflet.current = L;
        const m = L.map(container.current, {
          center: [VALLE_CENTER.lat, VALLE_CENTER.lng],
          zoom: VALLE_ZOOM,
          ...motionOptions(),
        });
        watchTileFailures(addTiles(L, m), () => setTilesFailed(true));
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
        m.on("popupopen", () => {
          popupOpen = true;
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
    return () => {
      cancelled = true;
      unmountPopups();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  function unmountPopups() {
    for (const div of popups.current) render(null, div);
    popups.current = [];
  }

  const focusPending = () => focusRequest !== null && handledFocus.current !== focusRequest.nonce;

  const fitToResults = () => {
    const L = leaflet.current;
    const m = map.current;
    if (!L || !m || results.length === 0) return;
    const bounds = L.latLngBounds(
      results.map(({ grupo }) => [grupo.ubicacion.lat, grupo.ubicacion.lng]),
    );
    if (origin) bounds.extend([origin.lat, origin.lng]);
    needsFit.current = false;
    // Un clic en una tarjeta pendiente decide la vista; encuadrar ahora competiría con él.
    if (focusPending()) return;
    m.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: !prefersReducedMotion() });
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
        icon: pinIcon(L),
        title: grupo.nombre,
      });
      const popup = document.createElement("div");
      render(<MapPopup grupo={grupo} distanciaKm={distanciaKm} lang={lang} t={t} />, popup);
      popups.current.push(popup);
      marker.bindPopup(popup, { maxWidth: 300, minWidth: 240 });
      marker.on("click", () => onSelectRef.current(grupo.id));
      markers.current.set(grupo.id, marker);
      group.addLayer(marker);
    }

    if (visible) fitToResults();
    else needsFit.current = true;
  }, [ready, results, origin, lang, t]);

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
      marker.setIcon(pinIcon(L, id === activeId ? "active" : "default"));
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    }
  }, [ready, activeId, results]);

  // Leaflet necesita recalcular tamaño cuando el contenedor deja de estar oculto.
  useEffect(() => {
    if (!visible || !ready) return;
    map.current?.invalidateSize();
    if (needsFit.current) fitToResults();
  }, [visible, ready]);

  // Clic en una tarjeta: acercar al pin y abrir su popup. Si el mapa aún está oculto
  // (móvil recién cambiado a la vista de mapa), se aplica cuando `visible` pasa a true.
  useEffect(() => {
    const m = map.current;
    const group = cluster.current;
    if (!ready || !visible || !m || !group || !focusRequest || !focusPending()) return;
    // Se da por atendida antes de buscar el pin: si el grupo ya no está, no debe reaplicarse.
    handledFocus.current = focusRequest.nonce;
    const marker = markers.current.get(focusRequest.id);
    if (!marker) return;
    m.invalidateSize();
    const animate = !prefersReducedMotion();
    group.zoomToShowLayer(marker, () => {
      m.setView(marker.getLatLng(), Math.max(m.getZoom(), 15), { animate });
      marker.openPopup();
    });
  }, [ready, visible, focusRequest, results]);

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
    <div class="relative h-full min-h-[60dvh] w-full">
      <div
        ref={container}
        role="region"
        aria-label={t("map.label")}
        class="h-full min-h-[60dvh] w-full overflow-hidden rounded-2xl border border-line"
      />
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
