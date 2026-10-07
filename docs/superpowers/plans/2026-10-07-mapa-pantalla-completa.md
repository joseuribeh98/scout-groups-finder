# Buscador con mapa a pantalla completa — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestructurar la portada del buscador alrededor de un mapa a pantalla completa, con un panel flotante en escritorio y una hoja inferior deslizable en móvil, conservando filtros en la URL, "Cerca de mí", bilingüe, CSP estricta y accesibilidad.

**Architecture:** La isla `Finder` sigue siendo dueña del estado (filtros, URL, geolocalización, selección) y renderiza **dos interfaces en el DOM** gobernadas por CSS: `Panel` (`hidden lg:flex`) y `Sheet` (`lg:hidden`); así no hay parpadeo al hidratar ni depende de `matchMedia` para la estructura. El mapa (`GroupMap`) ocupa todo el `<main>` detrás de ambas, se carga en tiempo ocioso tras la hidratación y recibe el _padding_ de encuadre que corresponda (panel o hoja). Sin JavaScript, la variante `js:` de Tailwind no se activa y el panel/hoja se renderizan como una columna estática con la lista completa.

**Tech Stack:** Astro 7 · Preact 10 · Tailwind 4 (variante `js:` personalizada) · Leaflet 1.9 + markercluster · Playwright + axe · Vitest.

**Spec:** `docs/superpowers/specs/2026-10-07-mapa-pantalla-completa-design.md` (y, en lo no modificado, `docs/superpowers/specs/2026-10-07-buscador-refactor-design.md`).

## Global Constraints

- Rama de trabajo: `feat/mapa-completo` a partir de `main` (crear al inicio). Nada se fusiona a `main` sin aprobación del mantenedor.
- Versiones: `preact@^10` (nunca 11), `typescript@^6`, Astro 7. No agregar dependencias de runtime.
- **CSP:** prohibidos los atributos `style="…"` en `.astro`/`.tsx` (también la prop `style` de Preact, porque el SSR la emite como atributo), `innerHTML` con datos y `eval`. Los tamaños dinámicos de la hoja se fijan con `element.style.setProperty("--sheet-h", …)` en tiempo de ejecución (CSSOM), nunca en el marcado.
- **Textos:** todo texto visible o accesible sale de `src/i18n/ui.ts`; ES y EN tienen las mismas claves (lo verifica `tests/unit/i18n.test.ts`).
- **Accesibilidad:** WCAG 2.2 AA; axe sin violaciones _serious/critical_ en claro y oscuro; foco visible; iconos `aria-hidden`; controles solo-icono con `aria-label`; sin `id` duplicados (el panel y la hoja duplican la lista, así que **ningún** ítem lleva `id`).
- Estilo A: tokens actuales de `global.css`; títulos en `text-ink`; chips neutros con el color de rama solo en el punto; mapa OSM con los filtros actuales.
- Paleta/ramas/privacidad/i18n de rutas: como en el plan anterior (sin cambios).
- Commits convencionales; el trailer nombra al modelo que escribe el commit.
- Verificación por tarea: `npm run lint && npm run format:check && npm run check && npm test && npm run build && npm run test:e2e` (detener antes cualquier `astro preview` en el puerto 4321).

## Review Focus

1. **Sin JavaScript** (`javaScriptEnabled: false`): la portada lista los 22 grupos con enlaces "Ver ficha" funcionales y la página hace scroll. Lo cubre Task 6 (`nojs.spec.ts`).
2. **Pin tapado por el panel o la hoja:** tras cargar, ningún pin queda bajo el panel (escritorio) ni bajo la hoja asomada (móvil). Lo cubren Task 5 y Task 6 (`map.spec.ts`, prueba de rectángulos).
3. **Teclado en la hoja:** el asa recibe foco, Enter alterna y las flechas cambian de posición; la lista sigue siendo alcanzable con Tab en todas las posiciones. Lo cubre Task 6 (`sheet.spec.ts`).
4. **Hidratación con filtros en la URL:** `/?municipio=buga` muestra un solo grupo en el panel/hoja y un solo pin, sin que el mapa encuadre primero todo el Valle. Lo cubre Task 5 (`map.spec.ts`, "filtrar por municipio deja solo sus pines").
5. **Duplicado panel/hoja:** solo una interfaz es visible en cada ancho, no hay `id` duplicados y axe no reporta `duplicate-id`. Lo cubren Task 5 (`a11y.spec.ts`) y el helper `ui()` de los tests.

---

## Mapa de archivos

```
src/components/finder/
  Finder.tsx          (modificar) estado + render de mapa, Panel y Sheet
  SearchBar.tsx       (crear) píldora de búsqueda + "Cerca de mí"
  FilterChips.tsx     (crear) chips de municipio (con conteo) y de rama
  ResultList.tsx      (crear) conteo, lista, vacío
  ResultItem.tsx      (crear) ítem compacto
  Panel.tsx           (crear) contenedor flotante de escritorio
  Sheet.tsx           (crear) hoja inferior móvil
  useSheet.ts         (crear) posiciones, arrastre, teclado
  SelectedCard.tsx    (crear) tarjeta del grupo seleccionado (móvil)
  MapPopup.tsx        (sin cambios)
  GroupMap.tsx        (modificar) padding de encuadre, popups opcionales, etiquetas por zoom, controles, carga ociosa
  Filters.tsx, GroupList.tsx, GroupCard.tsx   (eliminar en Task 7)
src/components/map/leaflet.ts   (modificar) pinIcon con etiqueta
src/components/ContactActions.astro (modificar) variante "bar"
src/components/GroupDetail.astro    (modificar) barra fija en móvil
src/layouts/Base.astro          (modificar) prop viewport, clase js
src/views/HomePage.astro        (modificar) portada a pantalla completa
src/styles/global.css           (modificar) variante js:, estilos de hoja
src/styles/map.css              (modificar) etiquetas de pin, controles
src/data/grupos.ts              (modificar) conteo por municipio
src/i18n/ui.ts                  (modificar) claves nuevas y obsoletas
tests/e2e/helpers.ts            (modificar) ui(), cards()
tests/e2e/{finder,map,a11y,csp}.spec.ts (modificar)
tests/e2e/{sheet,nojs}.spec.ts  (crear)
tests/unit/grupos-data.test.ts  (modificar)
```

---

### Task 1: Rama, textos, variante `js:` y layout de pantalla completa

**Files:**

- Modify: `src/i18n/ui.ts`, `src/layouts/Base.astro`, `src/styles/global.css`, `src/views/HomePage.astro`
- Test: `tests/unit/i18n.test.ts` (existente; debe seguir en verde)

**Interfaces:**

- Produces: `Base` prop `viewport?: boolean`; clase `js` en `<html>` cuando hay JS; variante Tailwind `js:`; claves nuevas en `ui.ts`.

- [ ] **Step 1: Crear la rama**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/mapa-completo
```

- [ ] **Step 2: Claves de texto**

En `src/i18n/ui.ts`, en el diccionario `es`, **reemplaza** `finder.lead` y **agrega** las claves nuevas (el bloque `en` recibe las equivalentes; el tipo `Record<UiKey,string>` obliga a ambas):

```ts
// es
"finder.lead": "{n} grupos en {m} municipios del Valle del Cauca",
"finder.allValle": "Todo el Valle",
"finder.municipioCount": "{nombre} {n}",
"finder.filters": "Filtros",
"sheet.expand": "Expandir lista",
"sheet.collapse": "Contraer lista",
"sheet.results": "Resultados",
"sheet.backToList": "Volver a la lista",
"card.detailsOf": "Ver ficha de {nombre}",
"map.zoomIn": "Acercar",
"map.zoomOut": "Alejar",
// en
"finder.lead": "{n} groups across {m} towns in Valle del Cauca",
"finder.allValle": "All of Valle",
"finder.municipioCount": "{nombre} {n}",
"finder.filters": "Filters",
"sheet.expand": "Expand list",
"sheet.collapse": "Collapse list",
"sheet.results": "Results",
"sheet.backToList": "Back to the list",
"card.detailsOf": "View details of {nombre}",
"map.zoomIn": "Zoom in",
"map.zoomOut": "Zoom out",
```

Las claves `finder.showMap`, `finder.showList`, `finder.municipio` y `finder.allMunicipios` se eliminan en Task 7, cuando ya no tengan usos.

- [ ] **Step 3: `Base.astro`: clase `js`, prop `viewport`, sin pie en modo viewport**

En el script inline del tema, añade como primera línea del IIFE:

```js
document.documentElement.classList.add("js");
```

Props y marcado:

```astro
---
// ...props existentes
  /** Portada: <main> ocupa el alto de la ventana y la página no hace scroll (solo con JS). */
  viewport?: boolean;
// ...
const { /* … */, viewport = false } = Astro.props;
---
<body class:list={["flex min-h-dvh flex-col", viewport && "js:h-dvh js:overflow-hidden"]}>
  …
  <main
    id="main"
    class:list={[
      "flex-1",
      viewport && "js:relative js:min-h-0",
      !fullBleed && !viewport && "mx-auto w-full max-w-5xl px-4 py-8",
    ]}
  >
    <slot />
  </main>
  {!viewport && <Footer lang={lang} />}
</body>
```

- [ ] **Step 4: Variante `js:` y estilos de la hoja en `global.css`**

Debajo de `@custom-variant dark …` agrega:

```css
/* Solo con JavaScript (la clase la pone el script inline del tema). Sin JS, el buscador
   se renderiza como una columna estática y la página hace scroll normal. */
@custom-variant js (&:where(.js, .js *));
```

Y al final de `@layer components`:

```css
/* Hoja inferior del buscador (móvil). Las alturas van por posición; durante el arrastre
     manda --sheet-h, que Sheet.tsx fija por CSSOM (nunca como atributo style). */
.js .sheet {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 30%;
  transition: height 0.25s ease;
}
.js .sheet[data-snap="half"] {
  height: 55%;
}
.js .sheet[data-snap="full"] {
  height: calc(100% - 0.5rem);
}
.js .sheet.is-dragging {
  height: var(--sheet-h);
  transition: none;
}
```

- [ ] **Step 5: `HomePage.astro` en modo viewport**

```astro
<Base
  lang={lang}
  path={pagePath(lang, "home")}
  title={t("site.title")}
  description={t("site.description")}
  fullBleed
  viewport
>
  <Finder client:load grupos={[...grupos]} lang={lang} municipios={municipiosConGrupos} />
</Base>
```

(El título y el subtítulo pasan a vivir dentro de `Panel`/`Sheet` en Task 5.)

- [ ] **Step 6: Verificar y commit**

```bash
npm run check && npm run lint && npm test && npm run build
grep -c 'classList.add("js")' dist/index.html   # 1
grep -c '<footer' dist/index.html                # 0
grep -c '<footer' dist/que-es-ser-scout/index.html   # 1
```

El build regenera el hash CSP del script inline (lo calcula `astro.config.mjs`); confirma que `dist/index.html` sigue teniendo **una** meta CSP. Los e2e de la portada fallarán hasta Task 5 (el título ya no está en la página); no los ejecutes todavía.

```bash
git add -A && git commit -m "feat(ui): viewport layout for the finder, js: variant and sheet styles"
```

---

### Task 2: Barra de búsqueda y chips de filtro

**Files:**

- Create: `src/components/finder/SearchBar.tsx`, `src/components/finder/FilterChips.tsx`
- Modify: `src/data/grupos.ts`, `src/components/finder/Finder.tsx` (usar los nuevos componentes en lugar de `Filters`), `tests/e2e/helpers.ts`, `tests/e2e/finder.spec.ts`
- Test: `tests/unit/grupos-data.test.ts`

**Interfaces:**

- Produces:
  - `municipiosConGrupos: { slug: string; nombre: string; count: number }[]`
  - `<SearchBar t q geoStatus compact? onChange onNearMe />`
  - `<FilterChips lang t filters municipios onChange />`
  - `type Municipio = { slug: string; nombre: string; count: number }` exportado desde `FilterChips.tsx`
  - helpers e2e: `ui(page)` (interfaz visible del buscador) y `cards(page)`.

- [ ] **Step 1: Test unitario del conteo (falla)**

En `tests/unit/grupos-data.test.ts` sustituye la aserción de `municipiosConGrupos` por:

```ts
it("lista los municipios con grupos, ordenados y con conteo", () => {
  expect(municipiosConGrupos).toEqual([
    { slug: "buga", nombre: "Buga", count: 1 },
    { slug: "cali", nombre: "Cali", count: 14 },
    { slug: "candelaria", nombre: "Candelaria", count: 1 },
    { slug: "cartago", nombre: "Cartago", count: 1 },
    { slug: "palmira", nombre: "Palmira", count: 4 },
    { slug: "tulua", nombre: "Tuluá", count: 1 },
  ]);
});
```

Run: `npx vitest run tests/unit/grupos-data.test.ts` → FAIL (falta `count`).

- [ ] **Step 2: Conteo en `src/data/grupos.ts`**

```ts
/** Municipios con al menos un grupo, ordenados alfabéticamente, con su conteo. */
export const municipiosConGrupos: { slug: string; nombre: string; count: number }[] = [
  ...new Set(grupos.map((g) => g.municipio)),
]
  .sort((a, b) => a.localeCompare(b, "es"))
  .map((nombre) => ({
    slug: slugify(nombre),
    nombre,
    count: grupos.filter((g) => g.municipio === nombre).length,
  }));
```

Run: `npx vitest run tests/unit/grupos-data.test.ts` → PASS.

- [ ] **Step 3: `SearchBar.tsx`**

```tsx
import Icon from "@/components/Icon";
import type { GeoStatus } from "@/components/finder/Filters";
import type { Translate } from "@/i18n/ui";

interface Props {
  t: Translate;
  q: string;
  geoStatus: GeoStatus;
  /** Móvil: el botón "Cerca de mí" es solo icono. */
  compact?: boolean;
  onChange: (q: string) => void;
  onNearMe: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SearchBar({
  t,
  q,
  geoStatus,
  compact = false,
  onChange,
  onNearMe,
  onFocus,
  onBlur,
}: Props) {
  const locating = geoStatus === "locating";
  return (
    <div
      role="search"
      class="flex h-12 items-center gap-1 rounded-full border border-line bg-surface pr-1.5 pl-4 shadow-sm focus-within:border-brand"
    >
      <Icon name="search" class="size-5 shrink-0 text-ink-soft" />
      <input
        type="search"
        value={q}
        maxLength={100}
        aria-label={t("finder.searchLabel")}
        placeholder={t("finder.searchPlaceholder")}
        onInput={(e) => onChange(e.currentTarget.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        class="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-soft"
      />
      <button
        type="button"
        onClick={onNearMe}
        aria-pressed={geoStatus === "ok"}
        aria-disabled={locating}
        aria-busy={locating}
        aria-label={compact ? t("finder.nearMe") : undefined}
        title={compact ? t("finder.nearMe") : undefined}
        class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand hover:bg-brand-soft aria-disabled:opacity-60 aria-pressed:bg-brand aria-pressed:text-on-brand"
      >
        <Icon name="locate-fixed" class="size-5" />
        {!compact && (locating ? t("finder.locating") : t("finder.nearMe"))}
      </button>
    </div>
  );
}
```

El `input` dentro del `role="search"` ya no usa `<label>` visible; el `aria-label` conserva el nombre "Buscar grupo" que usan los tests.

- [ ] **Step 4: `FilterChips.tsx`**

```tsx
import Icon from "@/components/Icon";
import { RAMA_IDS, RAMAS, ramaLabel, type RamaId } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Filters as FilterState } from "@/lib/search";

export interface Municipio {
  slug: string;
  nombre: string;
  count: number;
}

interface Props {
  lang: Lang;
  t: Translate;
  filters: FilterState;
  municipios: Municipio[];
  onChange: (next: FilterState) => void;
}

const chip =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold whitespace-nowrap hover:border-brand/60 aria-pressed:border-brand aria-pressed:bg-brand-soft";

export default function FilterChips({ lang, t, filters, municipios, onChange }: Props) {
  const toggleRama = (id: RamaId) =>
    onChange({
      ...filters,
      ramas: filters.ramas.includes(id)
        ? filters.ramas.filter((r) => r !== id)
        : RAMA_IDS.filter((r) => r === id || filters.ramas.includes(r)),
    });

  return (
    <div class="grid gap-2" aria-label={t("finder.filters")} role="group">
      {/* Municipio: selección única; la fila hace scroll horizontal si no cabe. */}
      <div
        class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]"
        role="group"
        aria-label={t("finder.municipio")}
      >
        <button
          type="button"
          class={chip}
          aria-pressed={filters.municipio === null}
          onClick={() => onChange({ ...filters, municipio: null })}
        >
          {t("finder.allValle")}
        </button>
        {municipios.map((m) => (
          <button
            key={m.slug}
            type="button"
            class={chip}
            aria-pressed={filters.municipio === m.slug}
            onClick={() =>
              onChange({ ...filters, municipio: filters.municipio === m.slug ? null : m.slug })
            }
          >
            {t("finder.municipioCount", { nombre: m.nombre, n: m.count })}
          </button>
        ))}
      </div>
      {/* Ramas: multiselección; el color oficial va solo en el punto. */}
      <div
        class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]"
        role="group"
        aria-label={t("finder.ramas")}
      >
        {RAMA_IDS.map((id) => {
          const pressed = filters.ramas.includes(id);
          const r = RAMAS[id];
          return (
            <button
              key={id}
              type="button"
              data-rama={id}
              aria-pressed={pressed}
              onClick={() => toggleRama(id)}
              class={`rama-chip h-8 shrink-0 whitespace-nowrap hover:border-brand/60 aria-pressed:border-brand aria-pressed:bg-brand-soft`}
            >
              {pressed && <Icon name="check" class="-mx-0.5 size-4 text-brand" />}
              {ramaLabel(id, lang)}
              <span class="font-normal text-ink-soft">
                · {r.edadMin}–{r.edadMax}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

Mantén por ahora `finder.municipio` y `finder.ramas` (ya existen) como etiquetas de los grupos.

- [ ] **Step 5: Usar los componentes en `Finder.tsx` (layout provisional)**

Sustituye el uso de `<Filters …/>` por:

```tsx
<div class="grid gap-3">
  <SearchBar
    t={t}
    q={filters.q}
    geoStatus={geoStatus}
    onChange={(q) => setFilters({ ...filters, q })}
    onNearMe={nearMe}
  />
  <FilterChips lang={lang} t={t} filters={filters} municipios={municipios} onChange={setFilters} />
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
</div>
```

donde `geoMessage` es el mismo cálculo que hoy hace `Filters.tsx` (muévelo a `Finder.tsx` como `const geoMessage = …`). El tipo `Municipio` de la prop `municipios` pasa a ser el de `FilterChips`. Deja `Filters.tsx` en el repo hasta Task 7 (ya sin usos salvo el tipo `GeoStatus`; mueve `GeoStatus` a `SearchBar.tsx` y haz que `Filters.tsx` lo importe de ahí para no romper nada).

- [ ] **Step 6: Helpers e2e y tests de filtros**

`tests/e2e/helpers.ts`, añade:

```ts
/** Interfaz visible del buscador: el panel (escritorio) o la hoja (móvil). Hasta Task 5 es la única. */
export const ui = (page: Page) => page.locator("[data-finder-ui]:visible");
export const cards = (page: Page) => ui(page).locator("li[data-grupo-id]");
```

En `Finder.tsx`, envuelve el bloque de búsqueda+lista en `<div data-finder-ui>` (en Task 5 el atributo pasa a `Panel` y `Sheet`).

`tests/e2e/finder.spec.ts`: importa `ui, cards` de `./helpers` (borra la constante local `cards`) y cambia:

```ts
// "filtra por municipio y ramas; el estado sobrevive a recargar"
await ui(page)
  .getByRole("button", { name: /^Palmira/ })
  .click();
await ui(page)
  .getByRole("button", { name: /^Rovers/ })
  .click();
// … tras reloadHydrated:
await expect(ui(page).getByRole("button", { name: /^Palmira/ })).toHaveAttribute(
  "aria-pressed",
  "true",
);
await expect(ui(page).getByRole("button", { name: /^Rovers/ })).toHaveAttribute(
  "aria-pressed",
  "true",
);

// "ignora parámetros inválidos y no inyecta HTML"
await expect(ui(page).getByLabel("Buscar grupo")).toHaveValue("<img src=x onerror=alert(1)>");
await expect(ui(page).getByRole("button", { name: "Todo el Valle" })).toHaveAttribute(
  "aria-pressed",
  "true",
);
```

y antepón `ui(page).` a todos los `getByLabel("Buscar grupo")`, `getByRole("button", { name: "Cerca de mí" })`, `getByRole("button", { name: "Limpiar filtros" })` y `locator("[data-count]")`. En `map.spec.ts`, la prueba "en móvil, filtrar con el mapa oculto…" usa `getByLabel("Municipio").selectOption("buga")`: cámbiala por `ui(page).getByRole("button", { name: /^Buga/ }).click()`.

- [ ] **Step 7: Verificar y commit**

```bash
npm run check && npm run lint && npm test && npm run build && npm run test:e2e -- tests/e2e/finder.spec.ts tests/e2e/map.spec.ts
git add -A && git commit -m "feat(finder): search pill and municipality/branch chips with counts"
```

---

### Task 3: Lista compacta de resultados

**Files:**

- Create: `src/components/finder/ResultList.tsx`, `src/components/finder/ResultItem.tsx`
- Modify: `src/components/finder/Finder.tsx`, `tests/e2e/finder.spec.ts`, `tests/e2e/map.spec.ts`

**Interfaces:**

- Produces: `<ResultList lang t results activeId scrollToId onActivate onFocusGroup onClear />` (misma firma que `GroupList`); `<ResultItem resultado lang t active onActivate onFocusGroup />`.
- DOM: `li[data-grupo-id][data-active]`; botón "Ver {nombre} en el mapa"; enlace con `aria-label` "Ver ficha de {nombre}".

- [ ] **Step 1: Actualizar los tests (fallan)**

`tests/e2e/finder.spec.ts`:

```ts
test("el enlace de la tarjeta lleva a la ficha del grupo", async ({ page }) => {
  await gotoHydrated(page, "/?q=815");
  await cards(page).getByRole("link", { name: "Ver ficha de Fénix Escarlata" }).click();
  await expect(page).toHaveURL(/\/grupos\/815-fenix-escarlata\/$/);
});

test("portada en inglés", async ({ page }) => {
  await gotoHydrated(page, "/en/");
  await expect(ui(page).locator("[data-count]")).toHaveText("22 groups");
  await expect(
    cards(page).getByRole("link", { name: "View details of Fénix Escarlata" }),
  ).toHaveAttribute("href", "/en/groups/815-fenix-escarlata/");
});
```

En `map.spec.ts`, todos los `page.locator('li[data-grupo-id="…"]')` pasan a `cards(page).filter({ has: page.locator('[data-grupo-id="315"]') })`… más simple: `ui(page).locator('li[data-grupo-id="315"]')`. Haz ese reemplazo (315 y 901).

Run: `npm run test:e2e -- tests/e2e/finder.spec.ts` → FAIL ("Ver ficha de …" no existe).

- [ ] **Step 2: `ResultItem.tsx`**

```tsx
import Icon from "@/components/Icon";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import type { Translate } from "@/i18n/ui";
import { formatDistance } from "@/lib/geo";
import { formatReunion } from "@/lib/schedule";
import type { Resultado } from "@/lib/search";

interface Props {
  resultado: Resultado;
  lang: Lang;
  t: Translate;
  active: boolean;
  onActivate: (id: number | null) => void;
  onFocusGroup: (id: number) => void;
}

const RAMA_DOT: Record<string, string> = {
  cachorros: "bg-rama-cachorros",
  lobatos: "bg-rama-lobatos",
  scouts: "bg-rama-scouts",
  nomadas: "bg-rama-nomadas",
  rovers: "bg-rama-rovers",
};

export default function ResultItem({
  resultado,
  lang,
  t,
  active,
  onActivate,
  onFocusGroup,
}: Props) {
  const { grupo, distanciaKm } = resultado;
  const lugar = grupo.localidad ? `${grupo.localidad}, ${grupo.municipio}` : grupo.municipio;
  return (
    <li
      data-grupo-id={grupo.id}
      data-active={active ? "true" : undefined}
      class="relative -mx-2 flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-brand-soft/60 data-[active=true]:bg-brand-soft"
      onMouseEnter={() => onActivate(grupo.id)}
      onMouseLeave={() => onActivate(null)}
      onFocusCapture={() => onActivate(grupo.id)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onActivate(null);
      }}
    >
      <div class="min-w-0 flex-1">
        {/* El nombre es el botón que muestra el grupo en el mapa; su área de clic cubre el ítem. */}
        <button
          type="button"
          class="text-left text-base leading-snug font-bold after:absolute after:inset-0 after:rounded-xl"
          aria-label={t("card.showOnMap", { nombre: grupo.nombre })}
          onClick={() => onFocusGroup(grupo.id)}
        >
          {grupo.nombre}
        </button>
        <p class="mt-0.5 text-sm text-ink-soft tabular-nums">
          {t("grupo.number", { id: grupo.id })} · {lugar} · {formatReunion(grupo.reunion, lang)}
        </p>
        <ul class="mt-1.5 flex gap-1" aria-hidden="true">
          {grupo.ramas.map((id) => (
            <li key={id} class={`size-2 rounded-full ${RAMA_DOT[id]}`} />
          ))}
        </ul>
      </div>
      <div class="relative z-10 flex shrink-0 flex-col items-end gap-1.5">
        {distanciaKm !== null && (
          <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand tabular-nums">
            {formatDistance(distanciaKm, lang)}
          </span>
        )}
        <a
          href={grupoPath(lang, grupo)}
          aria-label={t("card.detailsOf", { nombre: grupo.nombre })}
          class="inline-flex h-9 items-center gap-0.5 rounded-full pr-1.5 pl-2.5 text-sm font-semibold text-brand hover:bg-brand-soft hover:underline"
        >
          {t("card.details")}
          <Icon name="chevron-right" class="size-4" />
        </a>
      </div>
    </li>
  );
}
```

Los puntos de rama son decorativos (`aria-hidden`); el nombre de las ramas queda en la ficha y en el popup. `bg-rama-*` existen porque `--color-rama-*` están en `@theme`.

- [ ] **Step 3: `ResultList.tsx`**

Copia `GroupList.tsx` a `ResultList.tsx` cambiando `GroupCard` por `ResultItem`, el `<ul class="grid gap-3">` por `<ul class="divide-y divide-line">`, y el contenedor por `<section class="grid gap-2" data-results>`. Mantén `h2.sr-only` con `finder.results`, `[data-count]` con `aria-live` y el estado vacío tal cual.

- [ ] **Step 4: Usar `ResultList` en `Finder.tsx`** (reemplaza `GroupList`). Deja `GroupList.tsx`/`GroupCard.tsx` sin usos (se borran en Task 7).

- [ ] **Step 5: Verificar y commit**

```bash
npm run check && npm run lint && npm run build && npm run test:e2e -- tests/e2e/finder.spec.ts tests/e2e/map.spec.ts
git add -A && git commit -m "feat(finder): compact result list with show-on-map button and details link"
```

---

### Task 4: Mapa a pantalla completa: padding de encuadre, etiquetas, controles y carga ociosa

**Files:**

- Modify: `src/components/finder/GroupMap.tsx`, `src/components/map/leaflet.ts`, `src/styles/map.css`, `src/components/finder/Finder.tsx` (pasar las props nuevas), `tests/e2e/map.spec.ts`

**Interfaces:**

- Produces:
  - `GroupMap` props nuevas: `fitPadding: FitPadding` con `type FitPadding = { topLeft: [number, number]; bottomRight: [number, number] }`; `popups: boolean`. Se mantiene `visible` hasta Task 5.
  - `pinIcon(L, variant, label?: number)`.
  - Clase `zoom-labels` en el contenedor del mapa cuando `zoom >= 12`.

- [ ] **Step 1: Test de etiquetas (falla)**

`tests/e2e/map.spec.ts`:

```ts
test("al acercar, los pines muestran el número del grupo", async ({ page, isMobile }) => {
  test.skip(isMobile, "solo escritorio");
  await gotoHydrated(page, "/?municipio=buga"); // un solo grupo: fitBounds llega a zoom 15
  const label = page.locator(".leaflet-marker-pane .pin .pin__label");
  await expect(label).toHaveText("315");
  await expect(label).toBeVisible();
});

test("los controles de zoom están abajo a la derecha y traducidos", async ({ page, isMobile }) => {
  test.skip(isMobile, "solo escritorio");
  await gotoHydrated(page, "/");
  const zoomIn = page.locator(".leaflet-bottom.leaflet-right .leaflet-control-zoom-in");
  await expect(zoomIn).toHaveAttribute("aria-label", "Acercar");
});
```

Run: `npm run test:e2e -- tests/e2e/map.spec.ts -g "número del grupo|controles"` → FAIL.

- [ ] **Step 2: `leaflet.ts`: etiqueta en el pin**

```ts
export function pinIcon(L: L, variant: PinVariant = "default", label?: number): Leaflet.DivIcon {
  if (variant === "you") {
    /* igual que hoy */
  }
  const [w, h] = PIN_SIZES[variant];
  // `label` es un número (id del grupo): no hay datos de usuario en este HTML.
  const html = label === undefined ? PIN_SVG : `${PIN_SVG}<span class="pin__label">${label}</span>`;
  return L.divIcon({
    className: `pin pin--${variant}`,
    html,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 2],
  });
}

/** Alterna la clase que muestra las etiquetas de los pines a partir de `minZoom`. */
export function watchZoomLabels(map: Leaflet.Map, minZoom = 12): void {
  const update = () => map.getContainer().classList.toggle("zoom-labels", map.getZoom() >= minZoom);
  map.on("zoomend", update);
  update();
}
```

- [ ] **Step 3: `map.css`: etiquetas y controles**

```css
/* Etiqueta con el número del grupo; visible solo con zoom suficiente (clase zoom-labels). */
.leaflet-marker-icon.pin {
  overflow: visible;
}
.pin__label {
  position: absolute;
  top: 0.125rem;
  left: calc(100% + 0.125rem);
  display: none;
  padding: 0.0625rem 0.375rem;
  border-radius: 0.375rem;
  background: var(--color-surface);
  color: var(--color-ink);
  font: 700 0.6875rem/1.3 var(--font-sans);
  white-space: nowrap;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
  pointer-events: none;
}
.zoom-labels .pin__label {
  display: block;
}
/* Los controles no deben quedar bajo el panel/hoja: margen extra abajo a la derecha. */
.leaflet-bottom.leaflet-right .leaflet-control-zoom {
  margin: 0 1rem 1rem 0;
}
```

- [ ] **Step 4: `GroupMap.tsx`**

Cambios concretos:

```tsx
export interface FitPadding {
  topLeft: [number, number];
  bottomRight: [number, number];
}
interface Props {
  // …existentes…
  fitPadding: FitPadding;
  /** Escritorio: popups de Leaflet. Móvil: la ficha se muestra en la hoja (sin popups). */
  popups: boolean;
}
```

- Guarda `fitPadding` en un ref (`fitPaddingRef.current = fitPadding`) y úsalo en `fitToResults`:
  `m.fitBounds(bounds, { paddingTopLeft: p.topLeft, paddingBottomRight: p.bottomRight, maxZoom: 15, animate })`.
- Creación del mapa en tiempo ocioso:

```ts
const start = () => {
  loadLeaflet().then(/* igual que hoy */).catch(/* igual */);
};
const idle =
  "requestIdleCallback" in window
    ? window.requestIdleCallback(start, { timeout: 1500 })
    : window.setTimeout(start, 1);
// en el cleanup:
if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle as number);
else clearTimeout(idle as number);
```

- Opciones del mapa: `zoomControl: false`; tras crear: `L.control.zoom({ position: "bottomright", zoomInTitle: tRef.current("map.zoomIn"), zoomOutTitle: tRef.current("map.zoomOut") }).addTo(m);` y `watchZoomLabels(m)`. (Leaflet pone `title` y `aria-label` con esos textos.)
- Marcadores: `icon: pinIcon(L, "default", grupo.id)`; `if (popups) { … bindPopup … }` (el `render(<MapPopup/>)` solo cuando `popups`); el `click` sigue llamando `onSelectRef.current(grupo.id)`.
- Resaltado: `marker.setIcon(pinIcon(L, id === activeId ? "active" : "default", id))`.
- `focusRequest`: tras `setView`, `if (popups) marker.openPopup();` y, cuando `!popups`, desplaza el mapa para dejar el pin por encima de la hoja: `m.panBy([0, Math.round(fitPaddingRef.current.bottomRight[1] / 2)], { animate: false })`.
- El contenedor pierde `rounded-2xl border` (el mapa va a sangre): `class="h-full w-full"`; el wrapper `class="relative h-full w-full"`. El aviso de teselas y el error de carga se mantienen.

- [ ] **Step 5: Pasar las props desde `Finder.tsx` (provisional)**

`fitPadding={{ topLeft: [16, 16], bottomRight: [16, 16] }}` y `popups={isDesktop}`. En móvil (vista "map" actual) el popup deja de abrirse: adapta la prueba "en móvil, clic en la tarjeta cambia al mapa y abre el popup" para que, por ahora, compruebe que el mapa es visible y que `ui(page).locator('li[data-grupo-id="315"]')` queda activa (`data-active="true"`); Task 5 la reescribe con la hoja.

- [ ] **Step 6: Verificar y commit**

```bash
npm run check && npm run lint && npm run build && npm run test:e2e -- tests/e2e/map.spec.ts tests/e2e/finder.spec.ts
git add -A && git commit -m "feat(map): fit padding, zoom-dependent pin labels, bottom-right controls, idle loading"
```

---

### Task 5: Panel flotante (escritorio) y hoja básica (móvil)

**Files:**

- Create: `src/components/finder/Panel.tsx`, `src/components/finder/Sheet.tsx`, `src/components/finder/SelectedCard.tsx`
- Modify: `src/components/finder/Finder.tsx`, `src/components/finder/GroupMap.tsx` (quitar `visible`/`needsFit`), `tests/e2e/map.spec.ts`, `tests/e2e/finder.spec.ts`, `tests/e2e/csp.spec.ts`, `tests/e2e/a11y.spec.ts`

**Interfaces:**

- Produces:
  - `<Panel lang t header search filters status list />` (escritorio, `hidden lg:flex`, `data-finder-ui`).
  - `<Sheet t snap onSnap grip header body />` (móvil, `lg:hidden`, `data-finder-ui`, `data-snap`). En esta tarea el asa solo alterna `peek ↔ full` con clic; el arrastre llega en Task 6.
  - `type Snap = "peek" | "half" | "full"` exportado desde `Sheet.tsx`.
  - `<SelectedCard resultado lang t onClose />`.
  - Constantes: `PANEL_WIDTH = 400`, `PANEL_INSET = 16`, `SHEET_PEEK_RATIO = 0.3`.

- [ ] **Step 1: Tests (fallan)**

`tests/e2e/map.spec.ts`, sustituye las pruebas "en móvil…" y añade:

```ts
test("escritorio: ningún pin queda bajo el panel", async ({ page, isMobile }) => {
  test.skip(isMobile, "solo escritorio");
  await gotoHydrated(page, "/");
  await expect(
    page.locator(".leaflet-marker-pane .pin, .leaflet-marker-pane .marker-cluster-brand").first(),
  ).toBeVisible();
  const panel = await ui(page).boundingBox();
  const pins = await page.locator(".leaflet-marker-pane .leaflet-marker-icon").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  expect(panel).not.toBeNull();
  for (const p of pins) {
    const overlaps =
      p.x < panel!.x + panel!.width &&
      p.x + p.w > panel!.x &&
      p.y < panel!.y + panel!.height &&
      p.y + p.h > panel!.y;
    expect(overlaps, `pin en ${p.x},${p.y} bajo el panel`).toBe(false);
  }
});

test("móvil: la hoja arranca asomada y el mapa es visible", async ({ page, isMobile }) => {
  test.skip(!isMobile, "solo móvil");
  await gotoHydrated(page, "/");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(ui(page)).toHaveAttribute("data-snap", "peek");
  await expect(cards(page).first()).toBeVisible();
});

test("móvil: tocar un resultado muestra su tarjeta en la hoja y centra el mapa", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "solo móvil");
  await gotoHydrated(page, "/");
  await ui(page).getByRole("button", { name: "Ver Águilas Doradas en el mapa" }).click();
  const card = ui(page).locator("[data-selected-card]");
  await expect(card).toContainText("Águilas Doradas");
  await expect(card.getByRole("link", { name: "Ver ficha" })).toHaveAttribute(
    "href",
    "/grupos/315-aguilas-doradas/",
  );
  await expect(page).not.toHaveURL(/\/grupos\//);
  await ui(page).getByRole("button", { name: "Volver a la lista" }).click();
  await expect(cards(page)).toHaveCount(22);
});

test("móvil: tocar un pin muestra su tarjeta en la hoja", async ({ page, isMobile }) => {
  test.skip(!isMobile, "solo móvil");
  await gotoHydrated(page, "/?municipio=buga");
  await page.locator(".leaflet-marker-pane .pin").click();
  await expect(ui(page).locator("[data-selected-card]")).toContainText("Águilas Doradas");
  await expect(page.locator(".leaflet-popup")).toHaveCount(0);
});
```

Elimina "en móvil el mapa se abre con el botón y no carga antes" y "en móvil, filtrar con el mapa oculto reajusta la vista al mostrarlo". En "si Leaflet no carga…" quita los clics a "Ver mapa"/"Ver lista". En `csp.spec.ts` quita el clic a "Ver mapa"/"Show map" (el mapa siempre está) y conserva la aserción de `.leaflet-tile-loaded`. En `a11y.spec.ts` añade, solo móvil, una pasada de axe con la hoja en `full` (clic en el asa "Expandir lista") para "/" en ambos temas.

Run: `npm run test:e2e -- tests/e2e/map.spec.ts` → FAIL.

- [ ] **Step 2: `Panel.tsx`**

```tsx
import type { ComponentChildren } from "preact";

export const PANEL_WIDTH = 400;
export const PANEL_INSET = 16;

interface Props {
  label: string;
  header: ComponentChildren;
  search: ComponentChildren;
  filters: ComponentChildren;
  status: ComponentChildren;
  list: ComponentChildren;
}

/** Panel flotante de escritorio. Sin JS es una columna estática (no hay `.js`). */
export default function Panel({ label, header, search, filters, status, list }: Props) {
  return (
    <section
      data-finder-ui
      aria-label={label}
      class="hidden flex-col gap-3 bg-surface p-4 lg:flex js:absolute js:top-4 js:bottom-4 js:left-4 js:z-10 js:w-[25rem] js:overflow-hidden js:rounded-2xl js:shadow-[0_10px_30px_rgb(20_10_30/0.16)]"
    >
      {header}
      {search}
      {filters}
      {status}
      <div class="js:min-h-0 js:flex-1 js:overflow-y-auto">{list}</div>
    </section>
  );
}
```

- [ ] **Step 3: `Sheet.tsx` (versión básica)**

```tsx
import type { ComponentChildren } from "preact";
import type { Translate } from "@/i18n/ui";

export type Snap = "peek" | "half" | "full";
export const SHEET_PEEK_RATIO = 0.3;

interface Props {
  t: Translate;
  snap: Snap;
  onSnap: (next: Snap) => void;
  header: ComponentChildren;
  body: ComponentChildren;
}

/** Hoja inferior móvil. Sin JS es una columna estática; con JS, `.sheet[data-snap]` fija el alto. */
export default function Sheet({ t, snap, onSnap, header, body }: Props) {
  const expanded = snap === "full";
  return (
    <section
      data-finder-ui
      data-snap={snap}
      role="region"
      aria-label={t("sheet.results")}
      class="sheet bg-surface lg:hidden js:z-10 js:rounded-t-2xl js:shadow-[0_-6px_24px_rgb(20_10_30/0.18)]"
    >
      <div data-sheet-grip class="shrink-0 px-4 pt-2 pb-1">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? t("sheet.collapse") : t("sheet.expand")}
          onClick={() => onSnap(expanded ? "peek" : "full")}
          class="mx-auto block h-6 w-16 rounded-full before:mx-auto before:mt-2 before:block before:h-1.5 before:w-10 before:rounded-full before:bg-line"
        />
        {header}
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{body}</div>
    </section>
  );
}
```

- [ ] **Step 4: `SelectedCard.tsx`**

```tsx
import Icon from "@/components/Icon";
import MapPopup from "@/components/finder/MapPopup";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Resultado } from "@/lib/search";

interface Props {
  resultado: Resultado;
  lang: Lang;
  t: Translate;
  onClose: () => void;
}

/** Ficha resumida del grupo seleccionado, dentro de la hoja (móvil). Reutiliza el contenido del popup. */
export default function SelectedCard({ resultado, lang, t, onClose }: Props) {
  return (
    <div data-selected-card class="relative rounded-2xl border border-line bg-surface p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label={t("sheet.backToList")}
        class="absolute top-2 right-2 grid size-9 place-items-center rounded-full text-ink-soft hover:bg-brand-soft hover:text-ink"
      >
        <Icon name="x" class="size-5" />
      </button>
      <MapPopup grupo={resultado.grupo} distanciaKm={resultado.distanciaKm} lang={lang} t={t} />
    </div>
  );
}
```

`MapPopup` usa clases `map-popup*` definidas en `map.css` bajo `.leaflet-container`; para que luzcan igual fuera del mapa, duplica en `map.css` esas reglas con el selector `[data-selected-card] .map-popup …` (primario, WhatsApp, enlaces sin subrayado, `p { margin: 0 }`).

- [ ] **Step 5: `Finder.tsx` final (estado y render)**

Estado: elimina `view`, `mapRequested`, `showMap`. Añade:

```tsx
const [snap, setSnap] = useState<Snap>("peek");
const [selectedId, setSelectedId] = useState<number | null>(null);
const selected = useMemo(
  () => results.find((r) => r.grupo.id === selectedId) ?? null,
  [results, selectedId],
);
const sheetPeekPx = useRef(0); // lo fija Sheet (Task 6); mientras tanto, 0.3 * alto del contenedor
```

Handlers:

```tsx
const selectFromMap = (id: number) => {
  // clic en pin
  setActiveId(id);
  setScrollToId(id);
  if (!isDesktop) {
    setSelectedId(id);
    setSnap("peek");
  }
};
const focusGroup = (id: number) => {
  // clic en un resultado
  setActiveId(id);
  if (!isDesktop) {
    setSelectedId(id);
    setSnap("peek");
  }
  setFocusRequest((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }));
};
const closeSelected = () => {
  setSelectedId(null);
  setSnap("half");
};
useEffect(() => {
  setSelectedId(null);
}, [results]);
```

Padding de encuadre (la hoja asomada ocupa el 30 % del alto del contenedor; se lee del DOM):

```tsx
const root = useRef<HTMLDivElement>(null);
const fitPadding = useMemo<FitPadding>(() => {
  if (isDesktop) return { topLeft: [PANEL_WIDTH + PANEL_INSET * 2, 16], bottomRight: [16, 16] };
  const h = root.current?.clientHeight ?? 0;
  return { topLeft: [16, 72], bottomRight: [16, Math.round(h * SHEET_PEEK_RATIO) + 16] };
}, [isDesktop]);
```

(72 px arriba deja sitio a la búsqueda flotante.)

Render:

```tsx
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
    <div class="hidden js:absolute js:inset-0 js:isolate js:block">
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
    <div class="lg:hidden js:absolute js:inset-x-3 js:top-3 js:z-10 p-4 js:p-0">
      <SearchBar
        t={t}
        q={filters.q}
        geoStatus={geoStatus}
        compact
        onChange={(q) => setFilters({ ...filters, q })}
        onNearMe={nearMe}
      />
    </div>
    <Sheet
      t={t}
      snap={snap}
      onSnap={setSnap}
      header={
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
```

Notas:

- Hay **dos `h1`** en el DOM (panel y hoja), pero solo uno visible por ancho; axe no lo marca (`page-has-heading-one` exige al menos uno). Si axe reportara `heading-order` en la hoja, baja el de la hoja a `h2` y deja el h1 del panel; documenta la decisión.
- `GroupMap`: elimina la prop `visible`, el ref `needsFit` y el efecto de `invalidateSize` por visibilidad; `fitToResults` se llama siempre tras redibujar. Mantén `invalidateSize()` antes de `zoomToShowLayer`.
- `useMediaQuery` sigue decidiendo `popups` y `fitPadding`; la estructura la decide CSS.
- Sin JS: `Panel` (escritorio) y `Sheet` (móvil) quedan en flujo normal; el mapa, oculto; la búsqueda móvil es un bloque con `p-4`.

- [ ] **Step 6: Verificar y commit**

```bash
npm run check && npm run lint && npm test && npm run build && npm run test:e2e
git add -A && git commit -m "feat(finder): full-screen map with floating panel (desktop) and bottom sheet (mobile)"
```

---

### Task 6: Hoja deslizable: arrastre, teclado, búsqueda y sin JS

**Files:**

- Create: `src/components/finder/useSheet.ts`, `tests/e2e/sheet.spec.ts`, `tests/e2e/nojs.spec.ts`
- Modify: `src/components/finder/Sheet.tsx`, `src/components/finder/Finder.tsx`

**Interfaces:**

- Produces: `useSheet({ snap, onSnap }) → { ref, gripProps, onGripKeyDown }`; `Sheet` acepta además `onPeekHeight?: (px: number) => void`; `SearchBar` ya acepta `onFocus`/`onBlur`.

- [ ] **Step 1: Tests (fallan)**

`tests/e2e/sheet.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { cards, gotoHydrated, ui } from "./helpers";

test.describe("hoja inferior (móvil)", () => {
  test.skip(({ isMobile }) => !isMobile, "solo móvil");

  test("el asa alterna con clic y con teclado", async ({ page }) => {
    await gotoHydrated(page, "/");
    const grip = ui(page).getByRole("button", { name: "Expandir lista" });
    await grip.click();
    await expect(ui(page)).toHaveAttribute("data-snap", "full");
    await expect(ui(page).getByRole("button", { name: "Contraer lista" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
    await page.keyboard.press("ArrowDown");
    await expect(ui(page)).toHaveAttribute("data-snap", "peek");
    await page.keyboard.press("ArrowUp");
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
  });

  test("arrastrar el asa hacia arriba expande la hoja", async ({ page }) => {
    await gotoHydrated(page, "/");
    const grip = ui(page).locator("[data-sheet-grip]");
    const box = (await grip.boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, y - i * 40);
    await page.mouse.up();
    await expect(ui(page)).toHaveAttribute("data-snap", "full");
  });

  test("enfocar la búsqueda sube la hoja a completa", async ({ page }) => {
    await gotoHydrated(page, "/");
    await page.getByLabel("Buscar grupo").locator("visible=true").focus();
    await expect(ui(page)).toHaveAttribute("data-snap", "full");
    await page.getByLabel("Buscar grupo").locator("visible=true").fill("fenix");
    await expect(cards(page)).toHaveCount(1);
  });

  test("con la hoja completa, la lista hace scroll y el mapa sigue", async ({ page }) => {
    await gotoHydrated(page, "/");
    await ui(page).getByRole("button", { name: "Expandir lista" }).click();
    await cards(page).last().scrollIntoViewIfNeeded();
    await expect(cards(page).last()).toBeVisible();
    await expect(page.locator(".leaflet-container")).toBeAttached();
  });

  test("ningún pin queda bajo la hoja asomada", async ({ page }) => {
    await gotoHydrated(page, "/");
    await expect(page.locator(".leaflet-marker-pane .leaflet-marker-icon").first()).toBeVisible();
    const sheet = (await ui(page).boundingBox())!;
    const pins = await page
      .locator(".leaflet-marker-pane .leaflet-marker-icon")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().bottom));
    for (const bottom of pins) expect(bottom).toBeLessThanOrEqual(sheet.y + 1);
  });
});
```

`tests/e2e/nojs.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("sin JavaScript, la portada lista todos los grupos con enlaces a sus fichas", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/\bjs\b/);
  const items = page.locator("[data-finder-ui]:visible li[data-grupo-id]");
  await expect(items).toHaveCount(22);
  await expect(items.first().getByRole("link", { name: /^Ver ficha de/ })).toHaveAttribute(
    "href",
    /^\/grupos\//,
  );
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  // La página hace scroll: el último grupo es alcanzable.
  await items.last().scrollIntoViewIfNeeded();
  await expect(items.last()).toBeVisible();
});
```

Run: `npm run test:e2e -- tests/e2e/sheet.spec.ts tests/e2e/nojs.spec.ts` → FAIL (sin arrastre ni teclado).

- [ ] **Step 2: `useSheet.ts`**

```ts
import { useEffect, useRef } from "preact/hooks";
import type { Snap } from "@/components/finder/Sheet";

const ORDER: Snap[] = ["peek", "half", "full"];
const PEEK = 0.3;
const HALF = 0.55;
const TAP_PX = 8;
const FLICK_PX = 60;

interface Options {
  snap: Snap;
  onSnap: (next: Snap) => void;
  /** Avisa el alto en píxeles de la posición "asomada" (para el padding del mapa). */
  onPeekHeight?: (px: number) => void;
}

/** Posiciones y arrastre de la hoja. Fija `--sheet-h` por CSSOM durante el arrastre. */
export function useSheet({ snap, onSnap, onPeekHeight }: Options) {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{ startY: number; startH: number } | null>(null);

  const bounds = () => {
    const parent = ref.current?.parentElement;
    const total = parent?.clientHeight ?? 0;
    return { peek: Math.round(total * PEEK), half: Math.round(total * HALF), full: total - 8 };
  };

  useEffect(() => {
    if (!onPeekHeight) return;
    const report = () => onPeekHeight(bounds().peek);
    report();
    const ro = new ResizeObserver(report);
    if (ref.current?.parentElement) ro.observe(ref.current.parentElement);
    return () => ro.disconnect();
  }, [onPeekHeight]);

  const step = (dir: 1 | -1) => {
    const i = ORDER.indexOf(snap) + dir;
    if (i >= 0 && i < ORDER.length) onSnap(ORDER[i]!);
  };

  const gripProps = {
    onPointerDown: (e: PointerEvent) => {
      const el = ref.current;
      if (!el || e.button !== 0) return;
      drag.current = { startY: e.clientY, startH: el.getBoundingClientRect().height };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      el.style.setProperty("--sheet-h", `${drag.current.startH}px`);
    },
    onPointerMove: (e: PointerEvent) => {
      const el = ref.current;
      if (!el || !drag.current) return;
      const { peek, full } = bounds();
      const h = Math.min(
        full,
        Math.max(peek, drag.current.startH + (drag.current.startY - e.clientY)),
      );
      el.style.setProperty("--sheet-h", `${h}px`);
    },
    onPointerUp: (e: PointerEvent) => {
      const el = ref.current;
      if (!el || !drag.current) return;
      const dy = drag.current.startY - e.clientY;
      const h = drag.current.startH + dy;
      drag.current = null;
      el.classList.remove("is-dragging");
      el.style.removeProperty("--sheet-h");
      if (Math.abs(dy) < TAP_PX) return; // un toque lo gestiona el botón del asa
      const b = bounds();
      if (dy > FLICK_PX) return step(1);
      if (dy < -FLICK_PX) return step(-1);
      const nearest = (["peek", "half", "full"] as const).reduce((best, s) =>
        Math.abs(b[s] - h) < Math.abs(b[best] - h) ? s : best,
      );
      onSnap(nearest);
    },
    onPointerCancel: () => {
      const el = ref.current;
      drag.current = null;
      el?.classList.remove("is-dragging");
      el?.style.removeProperty("--sheet-h");
    },
  };

  const onGripKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      step(1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      step(-1);
    }
  };

  return { ref, gripProps, onGripKeyDown };
}
```

- [ ] **Step 3: `Sheet.tsx` con arrastre**

```tsx
const { ref, gripProps, onGripKeyDown } = useSheet({ snap, onSnap, onPeekHeight });
// <section ref={ref} …>  y en el <div data-sheet-grip {...gripProps} class="… touch-none select-none">
// el <button> del asa recibe onKeyDown={onGripKeyDown}
```

`touch-none` (`touch-action: none`) en el asa evita que el navegador haga scroll mientras se arrastra. El botón del asa sigue alternando `peek ↔ full` al clic. Si el usuario arrastra desde el asa, `onPointerUp` ignora los movimientos < 8 px para que el clic normal funcione.

- [ ] **Step 4: `Finder.tsx`: búsqueda y padding**

- `SearchBar` móvil: `onFocus={() => setSnap("full")}` y `onBlur={() => { if (!filters.q.trim()) setSnap("half"); }}`.
- Padding de la hoja: estado `const [peekPx, setPeekPx] = useState(0)`; `<Sheet onPeekHeight={setPeekPx} …/>`; en `fitPadding` móvil usa `bottomRight: [16, peekPx + 16]` y deja `useMemo` dependiente de `[isDesktop, peekPx]`.
- Al cambiar `selectedId` a un grupo en móvil, el panel está en `peek`: `GroupMap` ya desplaza el pin por encima de la hoja (`panBy` de Task 4).

- [ ] **Step 5: Verificar y commit**

```bash
npm run check && npm run lint && npm run build && npm run test:e2e
git add -A && git commit -m "feat(finder): draggable bottom sheet with keyboard support, search focus behavior and no-JS fallback test"
```

---

### Task 7: Ficha en móvil, limpieza, verificación visual y documentación

**Files:**

- Modify: `src/components/ContactActions.astro`, `src/components/GroupDetail.astro`, `src/i18n/ui.ts`, `README.md`, `docs/screenshot.png`
- Delete: `src/components/finder/Filters.tsx`, `src/components/finder/GroupList.tsx`, `src/components/finder/GroupCard.tsx`
- Test: `tests/e2e/grupo.spec.ts` (añadir prueba de la barra), `tests/unit/i18n.test.ts` (sigue verde)

- [ ] **Step 1: Test de la barra fija (falla)**

`tests/e2e/grupo.spec.ts`:

```ts
test("en móvil, la barra de contacto queda fija abajo", async ({ page, isMobile }) => {
  test.skip(!isMobile, "solo móvil");
  await page.goto("/grupos/815-fenix-escarlata/");
  const bar = page.locator("[data-contact-bar]");
  await expect(bar).toBeVisible();
  await expect(bar.locator('[data-action="email"]')).toHaveAttribute("href", /^mailto:/);
  await expect(bar.locator('[data-action="directions"]')).toBeVisible();
  const vh = page.viewportSize()!.height;
  const box = (await bar.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(vh + 1);
});
```

- [ ] **Step 2: `ContactActions.astro` con `variant="bar"`**

Añade la prop `variant?: "full" | "bar"` (por defecto `"full"`). Con `"bar"` renderiza solo:

```astro
<div data-contact-bar class="flex gap-2">
  {primary && (
    <a
      class={`${base} flex-1 bg-brand text-on-brand`}
      href={primary.href}
      target="…"
      rel="…"
      data-action={primary.key}
    >
      <Icon name={primary.icon} />
      {primary.label}
    </a>
  )}
  <a
    class={`${base} border border-line bg-surface text-ink`}
    href={directionsUrl(grupo.ubicacion)}
    target="_blank"
    rel="noopener noreferrer"
    data-action="directions"
  >
    <Icon name="navigation" class="size-5 text-brand" />
    {t("grupo.directions")}
  </a>
</div>
```

Si no hay `primary`, la barra muestra solo "Cómo llegar" a todo el ancho.

- [ ] **Step 3: `GroupDetail.astro`: barra fija en móvil**

Dentro del `<article>` al final:

```astro
<div class="sticky bottom-0 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
  <ContactActions grupo={grupo} lang={lang} variant="bar" />
</div>
```

y añade `pb-2 md:pb-0` al `<article>` para que el último contenido no quede pegado a la barra. Dale a la `data-action` de la barra el mismo nombre que el bloque completo (hay dos `data-action="email"` en la página: los tests existentes que usan `page.locator('[data-action="email"]')` deben pasar a `.first()` o a `page.locator('aside [data-action="email"]')`; actualízalos).

- [ ] **Step 4: Limpieza**

- Borra `Filters.tsx`, `GroupList.tsx`, `GroupCard.tsx`. Mueve `GeoStatus` definitivamente a `SearchBar.tsx` si aún no está.
- Elimina de `ui.ts` (ES y EN) las claves sin uso: `finder.showMap`, `finder.showList`, `finder.allMunicipios`. Comprueba con `grep -rn '"finder.showMap"\|finder.showMap' src tests` que no quedan usos antes de borrar cada una.
- `grep -rn "GroupCard\|GroupList\|Filters\"" src` → sin resultados.

- [ ] **Step 5: Verificación visual (obligatoria)**

Con `astro preview --port 4402 --ignore-lock`, toma capturas (script desechable en el scratchpad) de: portada escritorio 1280×860 (claro y oscuro), portada escritorio con popup abierto, portada móvil 390×844 con la hoja en `peek`, `half` y `full` (claro y oscuro), portada móvil con tarjeta seleccionada, ficha móvil (claro). Míralas y corrige hasta que: el panel no tape pines, la hoja asomada deje ver mapa y primer resultado, los chips quepan o hagan scroll sin cortes, el popup y la tarjeta se lean bien en oscuro, la barra de contacto no tape el pie de la ficha. Guarda las finales como `docs/screenshot.png` (portada escritorio claro) y `docs/screenshot-mobile.png` (portada móvil claro con la hoja en `half`).

- [ ] **Step 6: Lighthouse local (sanidad)**

```bash
npx lighthouse http://localhost:4402/ --form-factor=mobile --screenEmulation.mobile --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless" --output=json --output-path=./lh.json
node -e "const r=require('./lh.json');for(const [k,v] of Object.entries(r.categories))console.log(k,Math.round(v.score*100))"; rm lh.json
```

Si _performance_ baja de 90 en local, revisa que Leaflet se cargue en `requestIdleCallback` y que no haya imágenes grandes en la portada; anota el resultado en el informe. La cifra definitiva se mide en la vista previa de Vercel.

- [ ] **Step 7: README y commit final**

En `README.md`, actualiza la lista "Qué hace" (mapa a pantalla completa, panel/hoja, ficha resumida al tocar un pin) y añade la captura móvil debajo de la de escritorio. Luego:

```bash
npm run lint && npm run format:check && npm run check && npm test && npm run build && npm run test:e2e
git add -A && git commit -m "feat(grupo): sticky contact bar on mobile; remove legacy finder components; refresh docs"
```

---

## Self-review (hecho)

- **Cobertura del spec:** §3 panel (Task 5), §4 hoja y gestos (Tasks 5–6), §5 ficha móvil (Task 7), §6 sin JS y a11y (Tasks 1, 5, 6), §7 arquitectura (mapa de archivos), §8 textos (Task 1), §9 pruebas (Tasks 2–7), §10 riesgos (carga ociosa en Task 4; Lighthouse en Task 7).
- **Tipos:** `Municipio` (Task 2) se usa en `Finder` y `FilterChips`; `FitPadding`/`popups` (Task 4) en `Finder` (Task 5); `Snap` (Task 5) en `useSheet` (Task 6); `GeoStatus` migra de `Filters.tsx` a `SearchBar.tsx` (Task 2) y `Filters.tsx` se borra en Task 7.
- **Review Focus:** las cinco entradas tienen prueba en la tarea dueña.
- **Placeholders:** ninguno.
