import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import Filters, { type GeoStatus } from "@/components/finder/Filters";
import GroupList from "@/components/finder/GroupList";
import GroupMap, { type FocusRequest } from "@/components/finder/GroupMap";
import Icon from "@/components/Icon";
import { useMediaQuery } from "@/components/finder/useMediaQuery";
import { VALLE_BOUNDS } from "@/data/region";
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

const FAR_MARGIN_DEG = 0.5;

function isFarFromValle({ lat, lng }: LatLng): boolean {
  return (
    lat < VALLE_BOUNDS.latMin - FAR_MARGIN_DEG ||
    lat > VALLE_BOUNDS.latMax + FAR_MARGIN_DEG ||
    lng < VALLE_BOUNDS.lngMin - FAR_MARGIN_DEG ||
    lng > VALLE_BOUNDS.lngMax + FAR_MARGIN_DEG
  );
}

export default function Finder({ grupos, lang, municipios }: Props) {
  const t = useMemo(() => translator(lang), [lang]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [activeId, setActiveId] = useState<number | null>(null);
  const skipSync = useRef(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [view, setView] = useState<"list" | "map">("list");
  const [mapRequested, setMapRequested] = useState(false);
  const [scrollToId, setScrollToId] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const showMap = isDesktop || view === "map";
  useEffect(() => {
    if (showMap) setMapRequested(true);
  }, [showMap]);

  // Grupo cuyo popup está abierto: el resaltado no se apaga por hover/blur de su tarjeta.
  const focusedId = useRef<number | null>(null);
  const activate = (id: number | null) => {
    if (id === null && focusedId.current !== null) return;
    setActiveId(id);
  };
  const onPopupClose = () => {
    focusedId.current = null;
  };

  const selectFromMap = (id: number) => {
    focusedId.current = id;
    setActiveId(id);
    setScrollToId(id);
  };

  // Clic en una tarjeta: mostrar el grupo en el mapa (en móvil, cambiando a la vista de mapa).
  const focusGroup = (id: number) => {
    focusedId.current = id;
    setActiveId(id);
    if (!isDesktop) setView("map");
    setFocusRequest((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  // Lee los filtros de la URL una vez, después de hidratar.
  useEffect(() => {
    setFilters(
      parseFilters(
        new URLSearchParams(location.search),
        municipios.map((m) => m.slug),
      ),
    );
  }, [municipios]);

  // Refleja los filtros en la URL sin crear entradas de historial. Es un layout effect
  // para que la URL cambie en el mismo commit que la lista (una recarga inmediata no pierde estado).
  useLayoutEffect(() => {
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${serializeFilters(filters)}${location.hash}`,
    );
  }, [filters]);

  const results = useMemo(() => buscar(grupos, filters, origin), [grupos, filters, origin]);
  useEffect(() => {
    focusedId.current = null;
  }, [results]);

  const nearMe = () => {
    if (geoStatus === "locating") return;
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
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (isFarFromValle(here)) {
          setGeoStatus("far");
          return;
        }
        setOrigin(here);
        setGeoStatus("ok");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const clear = () => setFilters(EMPTY_FILTERS);

  return (
    <div class="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
      <div class={view === "map" ? "hidden lg:grid lg:gap-6" : "grid gap-6"}>
        <Filters
          lang={lang}
          t={t}
          filters={filters}
          municipios={municipios}
          geoStatus={geoStatus}
          canClear={hasActiveFilters(filters)}
          onChange={setFilters}
          onNearMe={nearMe}
          onClear={clear}
        />
        <GroupList
          lang={lang}
          t={t}
          results={results}
          activeId={activeId}
          scrollToId={scrollToId}
          onActivate={activate}
          onFocusGroup={focusGroup}
          onClear={clear}
        />
      </div>
      <div class={showMap ? "h-[70dvh] lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)]" : "hidden"}>
        {mapRequested && (
          <GroupMap
            results={results}
            activeId={activeId}
            origin={origin}
            lang={lang}
            t={t}
            visible={showMap}
            focusRequest={focusRequest}
            onSelect={selectFromMap}
            onPopupClose={onPopupClose}
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setView(view === "list" ? "map" : "list")}
        class="fixed bottom-5 left-1/2 z-[1000] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand shadow-lg hover:bg-brand-strong lg:hidden"
      >
        <Icon name={view === "list" ? "map" : "list"} />
        {view === "list" ? t("finder.showMap") : t("finder.showList")}
      </button>
    </div>
  );
}
