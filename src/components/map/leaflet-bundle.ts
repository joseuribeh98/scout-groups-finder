// Un solo chunk: Leaflet + markercluster. Solo se importa dinámicamente (nunca en SSR).
import type * as Leaflet from "leaflet";
import L from "@/components/map/leaflet-global";
import "leaflet.markercluster";
import valle from "@/data/valle-boundary.json";

/**
 * Máscara inversa: todo el mundo con un hueco con la forma del Valle. Con `mix-blend-mode: saturation`
 * (map.css) desatura las teselas de fuera del departamento sin teñir nada.
 */
export function addValleHighlight(map: Leaflet.Map): void {
  const ring = (valle.features[0]!.geometry.coordinates[0] as [number, number][]).map(
    ([lng, lat]) => [lat, lng] as [number, number],
  );
  const world: [number, number][] = [
    [-89, -180],
    [89, -180],
    [89, 180],
    [-89, 180],
  ];
  L.polygon([world, ring], {
    stroke: false,
    fill: true,
    fillOpacity: 1,
    interactive: false,
    className: "valle-mask",
    pane: "overlayPane",
  }).addTo(map);
  L.polyline(ring, {
    fill: false,
    weight: 1.5,
    interactive: false,
    className: "valle-outline",
  }).addTo(map);
}

export default L;
