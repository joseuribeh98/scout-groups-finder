import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import FilterChips, { type Municipio } from "@/components/finder/FilterChips";
import Panel, { PANEL_INSET, PANEL_WIDTH } from "@/components/finder/Panel";
import ResultList from "@/components/finder/ResultList";
import SelectedCard from "@/components/finder/SelectedCard";
import Sheet, { type Snap } from "@/components/finder/Sheet";
import GroupMap, { type FitPadding, type FocusRequest } from "@/components/finder/GroupMap";
import SearchBar, { type GeoStatus } from "@/components/finder/SearchBar";
import { SNAP_OFFSET } from "@/components/finder/useSheet";
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
  municipios: Municipio[];
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
  const root = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<Snap>("peek");
  const [peekPx, setPeekPx] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scrollToId, setScrollToId] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  // Grupo cuyo popup está abierto: el resaltado no se apaga por hover/blur de su tarjeta.
  const focusedId = useRef<number | null>(null);
  const activate = (id: number | null) => {
    // Sin hover, vuelve al grupo cuyo popup está abierto (si lo hay).
    setActiveId(id ?? focusedId.current);
  };
  const onPopupOpen = (id: number) => {
    focusedId.current = id;
  };
  const onPopupClose = () => {
    focusedId.current = null;
  };

  const selectFromMap = (id: number) => {
    setActiveId(id);
    setScrollToId(id);
    if (!isDesktop) {
      focusedId.current = id;
      setSelectedId(id);
      setSnap("peek");
    }
  };

  // Clic en una tarjeta: mostrar el grupo en el mapa (en móvil, con su ficha en la hoja).
  const focusGroup = (id: number) => {
    setActiveId(id);
    if (!isDesktop) {
      // Sin popup que lo retenga, el resaltado se conserva aunque la tarjeta pierda hover/foco.
      focusedId.current = id;
      setSelectedId(id);
      setSnap("peek");
    }
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
    setSelectedId(null);
  }, [results]);
  const selected = useMemo(
    () => results.find((r) => r.grupo.id === selectedId) ?? null,
    [results, selectedId],
  );
  const closeSelected = () => {
    focusedId.current = null;
    setActiveId(null);
    setSelectedId(null);
    setSnap("half");
  };

  // Los controles del mapa suben con la hoja; Task 6 lo actualizará en vivo durante el arrastre.
  useEffect(() => {
    root.current?.style.setProperty("--sheet-offset", SNAP_OFFSET[snap]);
  }, [snap]);

  // La hoja asomada (medida por la propia hoja) deja libre el borde inferior del mapa.
  const fitPadding = useMemo<FitPadding>(() => {
    if (isDesktop) return { topLeft: [PANEL_WIDTH + PANEL_INSET * 2, 16], bottomRight: [16, 16] };
    return { topLeft: [16, 72], bottomRight: [16, peekPx + 16] };
  }, [isDesktop, peekPx]);

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

  const geoMessage =
    geoStatus === "error"
      ? t("finder.geoError")
      : geoStatus === "far"
        ? t("finder.geoFar")
        : geoStatus === "ok"
          ? t("finder.nearMeActive")
          : geoStatus === "locating"
            ? t("finder.locating")
            : "";

  const header = (
    <div>
      <h1 class="text-2xl leading-tight font-extrabold text-ink lg:text-[1.625rem]">
        {t("finder.heading")}
      </h1>
      <p class="mt-0.5 text-sm text-ink-soft">
        {t("finder.lead", { n: grupos.length, m: municipios.length })}
      </p>
    </div>
  );
  const status = (
    <>
      <p role="status" class="rounded-xl bg-brand-soft px-3 py-2 text-sm empty:hidden">
        {geoMessage || null}
      </p>
      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={clear}
          class="justify-self-start text-sm font-semibold text-brand underline underline-offset-4"
        >
          {t("finder.clear")}
        </button>
      )}
    </>
  );
  const list = (
    <ResultList
      lang={lang}
      t={t}
      results={results}
      activeId={activeId}
      scrollToId={scrollToId}
      onActivate={activate}
      onFocusGroup={focusGroup}
      onClear={clear}
    />
  );

  return (
    <div ref={root} class="relative h-full">
      <div class="hidden finder-map js:absolute js:inset-0 js:isolate js:block">
        <GroupMap
          results={results}
          activeId={activeId}
          origin={origin}
          lang={lang}
          t={t}
          fitPadding={fitPadding}
          popups={isDesktop}
          focusRequest={focusRequest}
          onSelect={selectFromMap}
          onPopupOpen={onPopupOpen}
          onPopupClose={onPopupClose}
        />
      </div>
      <Panel
        label={t("sheet.results")}
        header={header}
        search={
          <SearchBar
            t={t}
            q={filters.q}
            geoStatus={geoStatus}
            onChange={(q) => setFilters({ ...filters, q })}
            onNearMe={nearMe}
          />
        }
        filters={
          <FilterChips
            lang={lang}
            t={t}
            filters={filters}
            municipios={municipios}
            onChange={setFilters}
          />
        }
        status={status}
        list={list}
      />
      {/* Móvil: búsqueda flotante sobre el mapa + hoja */}
      <div class="p-4 lg:hidden js:absolute js:inset-x-3 js:top-3 js:z-10 js:p-0">
        <SearchBar
          t={t}
          q={filters.q}
          geoStatus={geoStatus}
          compact
          onFocus={() => setSnap("full")}
          onBlur={(e) => {
            // Sin cambios si el foco pasa a la hoja (asa, chips), hay un grupo elegido o ya no está completa.
            const to = e.relatedTarget;
            if (to instanceof Element && to.closest("[data-finder-ui]")) return;
            if (selectedId !== null || snap !== "full") return;
            if (!filters.q.trim()) setSnap("half");
          }}
          onChange={(q) => setFilters({ ...filters, q })}
          onNearMe={nearMe}
        />
      </div>
      <Sheet
        t={t}
        snap={snap}
        onSnap={setSnap}
        onPeekHeight={setPeekPx}
        header={
          selected ? null : (
            <div class="grid gap-2 pt-1">
              <h1 class="text-lg leading-tight font-extrabold text-ink">{t("finder.heading")}</h1>
              <FilterChips
                lang={lang}
                t={t}
                filters={filters}
                municipios={municipios}
                onChange={setFilters}
              />
              {status}
            </div>
          )
        }
        body={
          selected ? (
            <SelectedCard resultado={selected} lang={lang} t={t} onClose={closeSelected} />
          ) : (
            list
          )
        }
      />
    </div>
  );
}
