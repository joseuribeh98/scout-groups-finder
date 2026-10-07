import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import Filters, { type GeoStatus } from "@/components/finder/Filters";
import GroupList from "@/components/finder/GroupList";
import type { Grupo } from "@/data/schema";
import type { Lang } from "@/i18n/lang";
import { translator } from "@/i18n/ui";
import type { LatLng } from "@/lib/geo";
import { EMPTY_FILTERS, buscar, hasActiveFilters, type Filters as FilterState } from "@/lib/search";
import { parseFilters, serializeFilters } from "@/lib/url-state";

interface Props {
  grupos: Grupo[];
  lang: Lang;
  municipios: { slug: string; nombre: string }[];
}

export default function Finder({ grupos, lang, municipios }: Props) {
  const t = useMemo(() => translator(lang), [lang]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  // Lee los filtros de la URL una vez, después de hidratar.
  useEffect(() => {
    setFilters(
      parseFilters(
        new URLSearchParams(location.search),
        municipios.map((m) => m.slug),
      ),
    );
    hydrated.current = true;
    setReady(true);
  }, [municipios]);

  // Refleja los filtros en la URL sin crear entradas de historial.
  useEffect(() => {
    if (!hydrated.current) return;
    history.replaceState(history.state, "", `${location.pathname}${serializeFilters(filters)}`);
  }, [filters]);

  const results = useMemo(() => buscar(grupos, filters, origin), [grupos, filters, origin]);

  const nearMe = () => {
    if (geoStatus === "ok") {
      setOrigin(null);
      setGeoStatus("idle");
      return;
    }
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const clear = () => setFilters(EMPTY_FILTERS);

  return (
    <div class="grid gap-6">
      <Filters
        lang={lang}
        t={t}
        filters={filters}
        municipios={municipios}
        geoStatus={geoStatus}
        canClear={hasActiveFilters(filters)}
        ready={ready}
        onChange={setFilters}
        onNearMe={nearMe}
        onClear={clear}
      />
      <GroupList
        lang={lang}
        t={t}
        results={results}
        activeId={activeId}
        onActivate={setActiveId}
        onClear={clear}
      />
    </div>
  );
}
