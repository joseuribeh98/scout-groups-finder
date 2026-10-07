import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  addTiles,
  clusterIcon,
  loadLeaflet,
  pinIcon,
  watchTileFailures,
} from "@/components/map/leaflet";
import { VALLE_CENTER, VALLE_ZOOM } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import type { Translate } from "@/i18n/ui";
import type { LatLng } from "@/lib/geo";
import type { Resultado } from "@/lib/search";

interface Props {
  results: Resultado[];
  activeId: number | null;
  origin: LatLng | null;
  lang: Lang;
  t: Translate;
  visible: boolean;
  onSelect: (id: number) => void;
}

type L = typeof Leaflet;

export default function GroupMap({ results, activeId, origin, lang, t, visible, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<L | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const cluster = useRef<Leaflet.MarkerClusterGroup | null>(null);
  const markers = useRef(new Map<number, Leaflet.Marker>());
  const youMarker = useRef<Leaflet.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
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
        });
        watchTileFailures(addTiles(L, m), () => setTilesFailed(true));
        cluster.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 40,
          iconCreateFunction: (c) => clusterIcon(L, c.getChildCount()),
        }).addTo(m);
        map.current = m;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const fitToResults = () => {
    const L = leaflet.current;
    const m = map.current;
    if (!L || !m || results.length === 0) return;
    const bounds = L.latLngBounds(
      results.map(({ grupo }) => [grupo.ubicacion.lat, grupo.ubicacion.lng]),
    );
    if (origin) bounds.extend([origin.lat, origin.lng]);
    m.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    needsFit.current = false;
  };

  // Redibujar marcadores cuando cambian los resultados.
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    const group = cluster.current;
    if (!ready || !L || !m || !group) return;

    group.clearLayers();
    markers.current.clear();
    for (const { grupo } of results) {
      const marker = L.marker([grupo.ubicacion.lat, grupo.ubicacion.lng], {
        icon: pinIcon(L),
        title: grupo.nombre,
      });
      const popup = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = grupo.nombre;
      const link = document.createElement("a");
      link.href = grupoPath(lang, grupo);
      link.textContent = t("grupo.number", { id: grupo.id });
      popup.append(strong, document.createElement("br"), link);
      marker.bindPopup(popup);
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
