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

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
} as const;

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function currentTheme(): keyof typeof TILES {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function addThemedTiles(L: L, map: Leaflet.Map): () => void {
  const layer = L.tileLayer(TILES[currentTheme()], { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(
    map,
  );
  const observer = new MutationObserver(() => layer.setUrl(TILES[currentTheme()]));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
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
