// Un solo chunk: Leaflet + markercluster. Solo se importa dinámicamente (nunca en SSR).
import type * as Leaflet from "leaflet";
import L from "@/components/map/leaflet-global";
import "leaflet.markercluster";
import valle from "@/data/valle-boundary.json";

/**
 * Máscara inversa: todo el mundo con un hueco con la forma del Valle. Con `mix-blend-mode: saturation`
 * (map.css) desatura las teselas de fuera del departamento sin teñir nada. Un segundo polígono
 * igual, en su propio pane y con blend normal, aclara además el exterior en tema claro
 * (`.valle-dim`); en oscuro ese segundo polígono es transparente.
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
  const inverse = (className: string, pane: string) =>
    L.polygon([world, ring], {
      stroke: false,
      fill: true,
      fillOpacity: 1,
      interactive: false,
      className,
      pane,
    }).addTo(map);
  inverse("valle-mask", "overlayPane");
  if (!map.getPane("valleDim")) {
    const pane = map.createPane("valleDim");
    pane.style.zIndex = "401"; // justo encima del overlayPane (400); CSSOM, no atributo style
  }
  inverse("valle-dim", "valleDim");
  L.polyline(ring, {
    fill: false,
    weight: 1.5,
    interactive: false,
    className: "valle-outline",
  }).addTo(map);
}

export default L;
