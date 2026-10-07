import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "@/styles/map.css";

type L = typeof Leaflet;
let cargando: Promise<L> | null = null;

/** Carga Leaflet + markercluster bajo demanda. markercluster espera `window.L`. */
export function loadLeaflet(): Promise<L> {
  cargando ??= (async () => {
    const mod = await import("leaflet");
    const L = ("default" in mod ? mod.default : mod) as L;
    (window as unknown as { L: L }).L = L;
    await import("leaflet.markercluster");
    return L;
  })().catch((error: unknown) => {
    cargando = null;
    throw error;
  });
  return cargando;
}

export function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Opciones de Leaflet que apagan las animaciones con `prefers-reduced-motion`. */
export function motionOptions(): Leaflet.MapOptions {
  return prefersReducedMotion()
    ? { zoomAnimation: false, markerZoomAnimation: false, fadeAnimation: false }
    : {};
}

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function addTiles(L: L, map: Leaflet.Map): Leaflet.TileLayer {
  return L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
}

const TILE_ERRORS_BEFORE_NOTICE = 3;

/** Avisa una vez cuando fallan varias teselas seguidas sin que cargue ninguna. */
export function watchTileFailures(layer: Leaflet.TileLayer, onFail: () => void): void {
  let errors = 0;
  let loaded = false;
  let notified = false;
  layer.on("tileload", () => {
    loaded = true;
  });
  layer.on("tileerror", () => {
    errors += 1;
    if (!loaded && !notified && errors >= TILE_ERRORS_BEFORE_NOTICE) {
      notified = true;
      onFail();
    }
  });
}

/** Gota de mapa constante (sin datos): el relleno sale de `.pin__body` en map.css. */
const PIN_SVG =
  '<svg viewBox="0 0 28 36" aria-hidden="true" focusable="false">' +
  '<path class="pin__body" d="M14 1.5C7.4 1.5 2 6.8 2 13.4c0 8.6 10.1 19.4 11 20.4a1.4 1.4 0 0 0 2 0c.9-1 11-11.8 11-20.4C26 6.8 20.6 1.5 14 1.5z"/>' +
  '<circle class="pin__dot" cx="14" cy="13.5" r="4.5"/>' +
  "</svg>";

type PinVariant = "default" | "active" | "you";

const PIN_SIZES: Record<Exclude<PinVariant, "you">, [number, number]> = {
  default: [28, 36],
  active: [36, 46],
};

export function pinIcon(L: L, variant: PinVariant = "default", label?: number): Leaflet.DivIcon {
  if (variant === "you") {
    return L.divIcon({ className: "pin pin--you", html: "", iconSize: [16, 16] });
  }
  const [w, h] = PIN_SIZES[variant];
  // `label` es un número (id del grupo): no hay datos de usuario en este HTML.
  const html = label === undefined ? PIN_SVG : `${PIN_SVG}<span class="pin__label">${label}</span>`;
  return L.divIcon({
    className: `pin pin--${variant}`,
    html,
    iconSize: [w, h],
    // La punta de la gota toca la coordenada; el popup se abre justo encima del pin.
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 2],
  });
}

export function clusterIcon(L: L, count: number): Leaflet.DivIcon {
  const size = count < 10 ? 36 : 44;
  return L.divIcon({
    className: "marker-cluster-brand",
    // `count` es un número: no hay datos de usuario en este HTML.
    html: `<span>${count}</span>`,
    iconSize: [size, size],
  });
}

/** Alterna la clase que muestra las etiquetas de los pines a partir de `minZoom`. */
export function watchZoomLabels(map: Leaflet.Map, minZoom = 12): void {
  const update = () => map.getContainer().classList.toggle("zoom-labels", map.getZoom() >= minZoom);
  map.on("zoomend", update);
  update();
}
