import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

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

export function pinIcon(L: L, variant: "default" | "active" | "you" = "default"): Leaflet.DivIcon {
  const className = variant === "default" ? "pin" : `pin pin--${variant}`;
  const size = variant === "you" ? 16 : 22;
  return L.divIcon({
    className,
    html: "",
    iconSize: [size, size],
    iconAnchor: variant === "you" ? [size / 2, size / 2] : [size / 2, size],
  });
}

export function clusterIcon(L: L, count: number): Leaflet.DivIcon {
  const size = count < 10 ? 36 : 44;
  return L.divIcon({
    className: "marker-cluster-brand",
    html: String(count),
    iconSize: [size, size],
  });
}
