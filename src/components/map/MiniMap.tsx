import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "preact/hooks";
import { addThemedTiles, loadLeaflet, pinIcon } from "@/components/map/leaflet";

interface Props {
  lat: number;
  lng: number;
  label: string;
  errorText: string;
  fallbackHref: string;
  fallbackText: string;
}

export default function MiniMap({ lat, lng, label, errorText, fallbackHref, fallbackText }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: Leaflet.Map | undefined;
    let stopTiles: (() => void) | undefined;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current) return;
        map = L.map(ref.current, {
          center: [lat, lng],
          zoom: 16,
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
        });
        stopTiles = addThemedTiles(L, map);
        L.marker([lat, lng], {
          icon: pinIcon(L, "active"),
          interactive: false,
          keyboard: false,
        }).addTo(map);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      stopTiles?.();
      map?.remove();
    };
  }, [lat, lng]);

  if (failed) {
    return (
      <p class="rounded-xl border border-line bg-brand-soft p-4 text-sm" data-map-error>
        {errorText}{" "}
        <a class="font-semibold underline" href={fallbackHref}>
          {fallbackText}
        </a>
      </p>
    );
  }
  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      class="h-56 w-full overflow-hidden rounded-xl border border-line"
    />
  );
}
