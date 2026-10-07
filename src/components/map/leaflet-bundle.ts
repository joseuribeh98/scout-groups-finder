// Un solo chunk: Leaflet + markercluster. Solo se importa dinámicamente (nunca en SSR).
import L from "@/components/map/leaflet-global";
import "leaflet.markercluster";
export default L;
