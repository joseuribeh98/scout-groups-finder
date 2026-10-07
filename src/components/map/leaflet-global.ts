// Expone Leaflet como global ANTES de que se evalúe markercluster (su UMD espera `window.L`).
import * as Leaflet from "leaflet";
const L = (
  "default" in Leaflet ? (Leaflet as unknown as { default: typeof Leaflet }).default : Leaflet
) as typeof Leaflet;
(window as unknown as { L: typeof Leaflet }).L = L;
export default L;
