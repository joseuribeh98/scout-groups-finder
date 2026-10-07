# Buscador de Grupos Scout · Región Valle — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la SPA React/Vite actual por un sitio estático Astro, bilingüe y accesible, que se despliega en Vercel en `buscador.vallescout.org.co`, con datos validados y sin datos personales.

**Architecture:** Astro genera HTML estático para el buscador, una ficha por grupo y las páginas informativas, en ES (sin prefijo) y EN (`/en/`). Una sola isla Preact (`Finder`) maneja búsqueda, filtros, geolocalización y el mapa Leaflet, que se carga de forma diferida. Los datos viven en `src/data/grupos.json` y se validan con Zod al importar, así que un dato inválido rompe el build.

**Tech Stack:** Astro 7 · Preact 10 (`@astrojs/preact`) · TypeScript 6 (strictest) · Tailwind CSS 4 (`@tailwindcss/vite`) · Zod 4 · Leaflet 1.9 + leaflet.markercluster · satori + resvg (imágenes OG) · Vitest 5 · Playwright + axe · ESLint 10 (flat) · Prettier · Vercel.

**Spec:** `docs/superpowers/specs/2026-10-07-buscador-refactor-design.md`

## Global Constraints

- Node `>=22.12.0` (requisito de Astro 7). En CI se usa Node 24.
- Versiones: `astro@^7.3`, `preact@^10` (la que resuelve `@astrojs/preact@^6`; **no** Preact 11), `typescript@^6` (**no** TS 7, porque `@astrojs/check` no lo soporta), `zod@^4`, `tailwindcss@^4.3`.
- Paleta (de scout.org.co): marca `#4d006e`. Ramas: cachorros `#f0592b` / texto `#c23600`, lobatos `#ffd00f` / texto `#8a5a00`, scouts `#016937`, nomadas `#233f96`, rovers `#be2026`. Los colores de rama solo se usan para identificar ramas.
- Ramas (orden oficial, ids, edades): `cachorros` Cachorros 5–6 · `lobatos` Lobatos 7–10 · `scouts` Scouts 11–14 · `nomadas` Nómadas Scout 15–17 · `rovers` Rovers 18–20.
- Logo del encabezado: Región Valle.
- Privacidad: ningún nombre de dirigente, teléfono personal ni correo personal en el repo o en el sitio. Solo correos `@scout.org.co`, redes del grupo y un WhatsApp **autorizado**. El esquema Zod es `.strict()`.
- CSP: Astro genera la CSP (`security.csp`). **Prohibido** usar atributos `style="..."` en `.astro`/`.tsx` y `innerHTML` con datos; se usan clases y `data-*`.
- Todo texto visible sale de `src/i18n/ui.ts` (o de los componentes de prosa `About*.astro`). Nada de strings sueltos en componentes.
- Rutas internas siempre con `/` final (`trailingSlash: "always"`).
- Identificadores de código en inglés; campos de datos en español (`nombre`, `municipio`, …), igual que en el spec.
- Commits convencionales (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`), terminados con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Se trabaja en la rama `refactor/astro`. Nada se fusiona a `main` sin aprobación del mantenedor.

### Cambios al spec descubiertos al planificar (el spec se actualiza en el mismo commit que este plan)

1. Astro **7**, no 5.
2. `contacto.email` pasa a ser **nullable** y solo acepta `@scout.org.co`. 12 de los 22 correos actuales son personales (Gmail, Hotmail, Yahoo con nombres propios) y se descartan.
3. Si un grupo no tiene ningún canal de contacto, la ficha muestra "Contacta a la Región Valle" con enlace a vallescout.org.co.
4. Valores de `facebook` que no son URLs ("Grupo scout 808 Delfines") se descartan (`null`).
5. Los nombres en mayúsculas se normalizan: ZIMBABUE → Zimbabue, SAMAGUARE → Samaguare, LEON DORADO → León Dorado.
6. Los textos de interfaz viven en `src/i18n/ui.ts` (TypeScript tipado) en vez de `es.json`/`en.json`, para que una clave faltante sea error de compilación.

## Review Focus

1. **Búsqueda con tildes, mayúsculas y espacios** ("fenix", " FÉNIX ", "815", "pance"): debe encontrar el grupo. Lo cubre Task 6 (`search.test.ts`).
2. **URL manipulada** (`?rama=foo&municipio=bogota&q=<script>…`): se ignora lo inválido, no hay errores y no se inyecta HTML. Lo cubren Task 6 (`url-state.test.ts`) y Task 11 (e2e).
3. **El JS de Leaflet o las teselas no cargan**: la lista sigue completa y usable y aparece el aviso del mapa. Lo cubre Task 12 (e2e con `page.route` abortando).
4. **Geolocalización negada, o usuario lejos del Valle**: aparece un mensaje y el orden queda por municipio; si se concede, se ordena por distancia. Lo cubre Task 11 (e2e con permisos de Playwright).
5. **Violaciones de CSP en producción** (scripts inline, estilos de Leaflet): cero errores "Content Security Policy" en consola en todas las páginas. Lo cubre Task 15 (`csp.spec.ts`).

---

## Mapa de archivos

```
astro.config.mjs            Astro: site, trailingSlash, preact, tailwind, sitemap, CSP
tsconfig.json               strictest + JSX Preact + alias @/*
vitest.config.ts            tests unitarios (alias @/*)
playwright.config.ts        e2e móvil + escritorio contra `astro preview`
eslint.config.js            ESLint flat (js + typescript-eslint + astro)
.prettierrc.json / .prettierignore
vercel.json                 encabezados de seguridad, caché, trailing slash
.github/workflows/ci.yml    lint, formato, tipos, unit, e2e
.husky/pre-commit           lint-staged

src/data/ramas.ts           ramas: ids, nombres, edades, orden, helpers
src/data/region.ts          municipios del Valle, límites, centro del mapa, enlaces de la Región, repo
src/data/schema.ts          esquema Zod + parseGrupos() con errores legibles
src/data/grupos.json        DATOS (lo único que se edita al actualizar)
src/data/grupos.ts          grupos validados (import único para todo el sitio)

src/i18n/lang.ts            Lang, LANGS, LOCALE
src/i18n/ui.ts              diccionarios es/en + translator()
src/i18n/routes.ts          rutas por idioma, ruta alterna, idioma desde ruta
src/i18n/format.ts          formatMonth()

src/lib/slug.ts             slugify, grupoSlug
src/lib/geo.ts              distanceKm, formatDistance
src/lib/schedule.ts         formatHora, formatReunion
src/lib/contact.ts          whatsappUrl, mailtoUrl, directionsUrl, wazeUrl, formatWhatsapp
src/lib/search.ts           normalize, matchesFilters, buscar
src/lib/url-state.ts        parseFilters, serializeFilters
src/lib/jsonld.ts           buildGrupoJsonLd
src/lib/og.ts               renderOg (satori → PNG)

src/styles/global.css       Tailwind 4, tokens, tema oscuro, chips de rama, pines

src/assets/logo-region-valle.png        logo a color
src/assets/logo-region-valle-white.png  logo blanco (tema oscuro y OG)

src/layouts/Base.astro      <head>, SEO, hreflang, OG, tema, header/footer
src/components/Header.astro, Footer.astro, LangSwitch.astro, ThemeToggle.astro
src/components/RamaChip.astro, ContactActions.astro, GroupDetail.astro
src/components/AboutEs.astro, AboutEn.astro
src/components/map/leaflet.ts           carga diferida de Leaflet + tiles + iconos
src/components/map/MiniMap.tsx          mapa estático de la ficha (isla)
src/components/finder/Finder.tsx        isla principal
src/components/finder/Filters.tsx, GroupList.tsx, GroupCard.tsx, GroupMap.tsx
src/components/finder/useMediaQuery.ts

src/views/HomePage.astro, GroupPage.astro, AboutPage.astro   vistas compartidas por idioma
src/pages/index.astro, grupos/[slug].astro, que-es-ser-scout.astro, 404.astro
src/pages/en/index.astro, en/groups/[slug].astro, en/what-is-scouting.astro
src/pages/og/[slug].png.ts

public/favicon.png, apple-touch-icon.png, robots.txt

tests/unit/*.test.ts
tests/e2e/*.spec.ts

README.md, LICENSE, docs/actualizar-grupos.md
```

---

### Task 1: Base del proyecto Astro (reemplaza la SPA)

**Files:**

- Delete: `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `src/App.jsx`, `src/App.css`, `src/index.css`, `src/main.jsx`, `src/components/GroupInfo.jsx`, `src/components/GroupList.jsx`, `src/components/Map.jsx`, `src/assets/react.svg`, `public/vite.svg`
- Keep (se migra en Task 4): `public/grupos.json`
- Replace: `package.json`, `.gitignore`, `.husky/pre-commit`
- Create: `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `src/styles/global.css`, `src/pages/index.astro`, `src/env.d.ts` (si `astro sync` no lo genera)

**Interfaces:**

- Produces: alias `@/*` → `src/*` (en Astro y en Vitest); scripts npm `dev`, `build`, `preview`, `check`, `lint`, `format`, `format:check`, `test`, `test:e2e`.

- [ ] **Step 1: Borrar la app vieja**

```bash
git rm -q index.html vite.config.js tailwind.config.js postcss.config.js eslint.config.js \
  src/App.jsx src/App.css src/index.css src/main.jsx \
  src/components/GroupInfo.jsx src/components/GroupList.jsx src/components/Map.jsx \
  src/assets/react.svg public/vite.svg package-lock.json
rm -rf node_modules dist
```

- [ ] **Step 2: Escribir `package.json` sin dependencias**

```json
{
  "name": "buscador-grupos-scout-valle",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Buscador de Grupos Scout de la Región Valle del Cauca (Scouts de Colombia).",
  "license": "MIT",
  "author": "Jose Uribe",
  "repository": {
    "type": "git",
    "url": "https://github.com/joseuribeh98/scout-groups-finder"
  },
  "homepage": "https://buscador.vallescout.org.co",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx,astro,js,mjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,yml,yaml}": "prettier --write"
  }
}
```

- [ ] **Step 3: Instalar dependencias**

```bash
npm i astro@^7 @astrojs/preact @astrojs/sitemap preact@^10 zod@^4 leaflet leaflet.markercluster @fontsource-variable/figtree
npm i -D @astrojs/check typescript@^6 tailwindcss @tailwindcss/vite vitest @playwright/test @axe-core/playwright \
  eslint @eslint/js typescript-eslint eslint-plugin-astro globals prettier prettier-plugin-astro husky lint-staged \
  @types/leaflet @types/leaflet.markercluster satori @resvg/resvg-js @fontsource/figtree
```

Si npm reporta conflicto de peers entre `eslint@10` y algún plugin, instala la versión mayor más reciente de `eslint` que acepten todos los plugins (p. ej. `eslint@^9`) y la misma para `@eslint/js`. **No** uses `--force` ni `--legacy-peer-deps`.

- [ ] **Step 4: Configuración de Astro, TS y estilos**

`astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://buscador.vallescout.org.co",
  trailingSlash: "always",
  integrations: [preact()],
  vite: { plugins: [tailwindcss()] },
});
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strictest",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

`src/styles/global.css` (provisional; Task 8 lo completa):

```css
@import "tailwindcss";
```

`src/pages/index.astro` (provisional; Task 11 lo reemplaza):

```astro
---
import "@/styles/global.css";
---

<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Buscador de Grupos Scout · Región Valle</title>
  </head>
  <body>
    <h1 class="text-2xl font-bold">Buscador de Grupos Scout</h1>
  </body>
</html>
```

- [ ] **Step 5: Vitest, ESLint, Prettier, husky, gitignore**

`vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["tests/unit/**/*.test.ts"], passWithNoTests: true },
});
```

`eslint.config.js`:

```js
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "dist/",
      ".astro/",
      ".vercel/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
]);
```

`.prettierrc.json`:

```json
{
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

`.prettierignore`:

```
dist
.astro
.vercel
node_modules
package-lock.json
playwright-report
test-results
```

`.gitignore`:

```
node_modules/
dist/
.astro/
.vercel/
playwright-report/
test-results/
.env
.env.*
.DS_Store
```

`.husky/pre-commit`:

```sh
npx lint-staged
```

- [ ] **Step 6: Verificar**

```bash
npm run build && npm run check && npm run lint && npm test && npm run format:check
```

Esperado: todo en verde; `dist/index.html` existe. Si `format:check` falla, corre `npm run format` y repite. `public/grupos.json` todavía se copia a `dist/`; es temporal y se elimina en Task 4.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: replace React SPA with Astro 7 + Preact + Tailwind 4 scaffold

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Ramas, municipios e idioma (constantes de dominio)

**Files:**

- Create: `src/data/ramas.ts`, `src/data/region.ts`, `src/i18n/lang.ts`
- Test: `tests/unit/ramas.test.ts`, `tests/unit/region.test.ts`

**Interfaces:**

- Produces:
  - `src/i18n/lang.ts`: `LANGS = ["es","en"] as const`, `type Lang`, `LOCALE: Record<Lang,string>` (`es-CO`, `en-US`), `isLang(v: string): v is Lang`.
  - `src/data/ramas.ts`: `RAMA_IDS`, `type RamaId`, `interface Rama { id; nombre; nombreEn; edadMin; edadMax }`, `RAMAS: Record<RamaId, Rama>`, `isRamaId(v: string): v is RamaId`, `sortRamas(ids: readonly RamaId[]): RamaId[]`, `ramaLabel(id: RamaId, lang: Lang): string`.
  - `src/data/region.ts`: `MUNICIPIOS` (tupla `as const` de 42), `type Municipio`, `VALLE_BOUNDS`, `VALLE_CENTER`, `VALLE_ZOOM`, `REGION`, `REPO_URL`.

- [ ] **Step 1: Tests que fallan**

`tests/unit/ramas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { RAMA_IDS, RAMAS, isRamaId, ramaLabel, sortRamas } from "@/data/ramas";

describe("ramas", () => {
  it("tiene las cinco ramas en orden oficial", () => {
    expect(RAMA_IDS).toEqual(["cachorros", "lobatos", "scouts", "nomadas", "rovers"]);
  });

  it("usa las edades oficiales de scout.org.co", () => {
    const edades = RAMA_IDS.map((id) => [id, RAMAS[id].edadMin, RAMAS[id].edadMax]);
    expect(edades).toEqual([
      ["cachorros", 5, 6],
      ["lobatos", 7, 10],
      ["scouts", 11, 14],
      ["nomadas", 15, 17],
      ["rovers", 18, 20],
    ]);
  });

  it("usa los nombres nacionales", () => {
    expect(RAMAS.nomadas.nombre).toBe("Nómadas Scout");
    expect(RAMAS.lobatos.nombre).toBe("Lobatos");
  });

  it("ordena según el orden oficial", () => {
    expect(sortRamas(["rovers", "cachorros", "scouts"])).toEqual(["cachorros", "scouts", "rovers"]);
  });

  it("no muta el arreglo original", () => {
    const input = ["rovers", "lobatos"] as const;
    sortRamas(input);
    expect(input).toEqual(["rovers", "lobatos"]);
  });

  it("reconoce ids válidos", () => {
    expect(isRamaId("scouts")).toBe(true);
    expect(isRamaId("tropa")).toBe(false);
    expect(isRamaId("")).toBe(false);
  });

  it("etiqueta en inglés incluye el nombre oficial", () => {
    expect(ramaLabel("nomadas", "es")).toBe("Nómadas Scout");
    expect(ramaLabel("nomadas", "en")).toBe("Nómadas Scout · Venturers");
  });
});
```

`tests/unit/region.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MUNICIPIOS, VALLE_BOUNDS, VALLE_CENTER } from "@/data/region";

describe("region", () => {
  it("lista los 42 municipios del Valle sin repetidos", () => {
    expect(MUNICIPIOS).toHaveLength(42);
    expect(new Set(MUNICIPIOS).size).toBe(42);
    expect(MUNICIPIOS).toContain("Cali");
    expect(MUNICIPIOS).toContain("Tuluá");
  });

  it("el centro del mapa está dentro de los límites", () => {
    expect(VALLE_CENTER.lat).toBeGreaterThan(VALLE_BOUNDS.latMin);
    expect(VALLE_CENTER.lat).toBeLessThan(VALLE_BOUNDS.latMax);
    expect(VALLE_CENTER.lng).toBeGreaterThan(VALLE_BOUNDS.lngMin);
    expect(VALLE_CENTER.lng).toBeLessThan(VALLE_BOUNDS.lngMax);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run tests/unit/ramas.test.ts tests/unit/region.test.ts`
Expected: FAIL, "Failed to resolve import @/data/ramas".

- [ ] **Step 3: Implementar**

`src/i18n/lang.ts`:

```ts
export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const LOCALE: Record<Lang, string> = { es: "es-CO", en: "en-US" };

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}
```

`src/data/ramas.ts`:

```ts
import type { Lang } from "@/i18n/lang";

/** Orden oficial de las ramas (fuente: scout.org.co). */
export const RAMA_IDS = ["cachorros", "lobatos", "scouts", "nomadas", "rovers"] as const;
export type RamaId = (typeof RAMA_IDS)[number];

export interface Rama {
  id: RamaId;
  nombre: string;
  nombreEn: string;
  edadMin: number;
  edadMax: number;
}

export const RAMAS: Record<RamaId, Rama> = {
  cachorros: { id: "cachorros", nombre: "Cachorros", nombreEn: "Beavers", edadMin: 5, edadMax: 6 },
  lobatos: { id: "lobatos", nombre: "Lobatos", nombreEn: "Cub Scouts", edadMin: 7, edadMax: 10 },
  scouts: { id: "scouts", nombre: "Scouts", nombreEn: "Scouts", edadMin: 11, edadMax: 14 },
  nomadas: {
    id: "nomadas",
    nombre: "Nómadas Scout",
    nombreEn: "Venturers",
    edadMin: 15,
    edadMax: 17,
  },
  rovers: { id: "rovers", nombre: "Rovers", nombreEn: "Rovers", edadMin: 18, edadMax: 20 },
};

export function isRamaId(value: string): value is RamaId {
  return (RAMA_IDS as readonly string[]).includes(value);
}

export function sortRamas(ids: readonly RamaId[]): RamaId[] {
  return [...ids].sort((a, b) => RAMA_IDS.indexOf(a) - RAMA_IDS.indexOf(b));
}

/** En inglés se muestra el nombre oficial con la traducción como apoyo. */
export function ramaLabel(id: RamaId, lang: Lang): string {
  const rama = RAMAS[id];
  if (lang === "es" || rama.nombre === rama.nombreEn) return rama.nombre;
  return `${rama.nombre} · ${rama.nombreEn}`;
}
```

`src/data/region.ts`:

```ts
/** Los 42 municipios del Valle del Cauca. */
export const MUNICIPIOS = [
  "Alcalá",
  "Andalucía",
  "Ansermanuevo",
  "Argelia",
  "Bolívar",
  "Buenaventura",
  "Buga",
  "Bugalagrande",
  "Caicedonia",
  "Cali",
  "Calima",
  "Candelaria",
  "Cartago",
  "Dagua",
  "El Águila",
  "El Cairo",
  "El Cerrito",
  "El Dovio",
  "Florida",
  "Ginebra",
  "Guacarí",
  "Jamundí",
  "La Cumbre",
  "La Unión",
  "La Victoria",
  "Obando",
  "Palmira",
  "Pradera",
  "Restrepo",
  "Riofrío",
  "Roldanillo",
  "San Pedro",
  "Sevilla",
  "Toro",
  "Trujillo",
  "Tuluá",
  "Ulloa",
  "Versalles",
  "Vijes",
  "Yotoco",
  "Yumbo",
  "Zarzal",
] as const;
export type Municipio = (typeof MUNICIPIOS)[number];

/** Rectángulo aproximado del departamento; sirve para detectar coordenadas erradas. */
export const VALLE_BOUNDS = { latMin: 3.0, latMax: 5.1, lngMin: -77.6, lngMax: -75.6 } as const;
export const VALLE_CENTER = { lat: 3.9, lng: -76.4 } as const;
export const VALLE_ZOOM = 9;

export const REGION = {
  nombre: "Región Valle · Scouts de Colombia",
  web: "https://vallescout.org.co/",
  nacional: "https://scout.org.co/",
} as const;

export const REPO_URL = "https://github.com/joseuribeh98/scout-groups-finder";
```

(Prettier reformatea la lista de municipios a una por línea; es esperado.)

- [ ] **Step 4: Correr tests**

Run: `npx vitest run tests/unit/ramas.test.ts tests/unit/region.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/ramas.ts src/data/region.ts src/i18n/lang.ts tests/unit
git commit -m "feat(data): add official branches, Valle municipalities and language constants

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Esquema de datos con Zod y errores legibles

**Files:**

- Create: `src/data/schema.ts`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**

- Consumes: `RAMA_IDS`, `sortRamas` (Task 2); `MUNICIPIOS`, `VALLE_BOUNDS` (Task 2).
- Produces: `DIAS`, `type Dia`, `reunionSchema`, `type Reunion = { dia: Dia; inicio: string; fin: string | null }`, `grupoSchema`, `type Grupo`, `parseGrupos(raw: unknown): Grupo[]` (lanza `Error` con un mensaje multilínea).

`type Grupo` (salida del esquema):

```ts
{
  id: number; nombre: string; municipio: Municipio; localidad: string | null; direccion: string;
  ubicacion: { lat: number; lng: number };
  reunion: Reunion;
  ramas: RamaId[]; // ordenadas
  contacto: { email: string | null; whatsapp: string | null; instagram: string | null; facebook: string | null; web: string | null };
  actualizado: string; // "YYYY-MM"
}
```

- [ ] **Step 1: Test que falla**

`tests/unit/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseGrupos } from "@/data/schema";

function grupo(overrides: Record<string, unknown> = {}) {
  return {
    id: 815,
    nombre: "Fénix Escarlata",
    municipio: "Cali",
    localidad: null,
    direccion: "Parque del Amor, Avenida 6 con Calle 70",
    ubicacion: { lat: 3.493053, lng: -76.520585 },
    reunion: { dia: "sabado", inicio: "14:00", fin: "18:00" },
    ramas: ["rovers", "lobatos"],
    contacto: {
      email: "valle.grupo815@scout.org.co",
      whatsapp: null,
      instagram: "https://www.instagram.com/fenix_escarlata_815",
      facebook: null,
      web: null,
    },
    actualizado: "2025-05",
    ...overrides,
  };
}

function errorOf(raw: unknown): string {
  try {
    parseGrupos(raw);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("se esperaba un error de validación");
}

describe("parseGrupos", () => {
  it("acepta un grupo válido y ordena sus ramas", () => {
    const [g] = parseGrupos([grupo()]);
    expect(g?.ramas).toEqual(["lobatos", "rovers"]);
  });

  it("acepta reunión sin hora de fin", () => {
    expect(() =>
      parseGrupos([grupo({ reunion: { dia: "sabado", inicio: "14:30", fin: null } })]),
    ).not.toThrow();
  });

  it("rechaza campos extra como datos personales, identificando el grupo", () => {
    const msg = errorOf([grupo({ jefe: "Nombre Apellido" })]);
    expect(msg).toContain("grupo 815 (Fénix Escarlata)");
    expect(msg).toContain("jefe");
  });

  it("rechaza campos extra dentro de contacto", () => {
    expect(
      errorOf([grupo({ contacto: { ...grupo().contacto, telefonoAlt: "3000000000" } })]),
    ).toContain("telefonoAlt");
  });

  it("rechaza coordenadas fuera del Valle", () => {
    const msg = errorOf([grupo({ ubicacion: { lat: 4.711, lng: -74.072 } })]);
    expect(msg).toContain("ubicacion.lng");
  });

  it("rechaza municipios que no son del Valle", () => {
    expect(errorOf([grupo({ municipio: "Bogotá" })])).toContain("municipio");
  });

  it("rechaza correos que no son institucionales", () => {
    const msg = errorOf([grupo({ contacto: { ...grupo().contacto, email: "persona@gmail.com" } })]);
    expect(msg).toContain("contacto.email");
  });

  it("rechaza WhatsApp que no sea colombiano en formato 57XXXXXXXXXX", () => {
    expect(
      errorOf([grupo({ contacto: { ...grupo().contacto, whatsapp: "3001234567" } })]),
    ).toContain("contacto.whatsapp");
  });

  it("rechaza URLs sin https", () => {
    expect(
      errorOf([grupo({ contacto: { ...grupo().contacto, web: "http://ejemplo.org" } })]),
    ).toContain("contacto.web");
  });

  it("rechaza hora de fin anterior al inicio", () => {
    expect(
      errorOf([grupo({ reunion: { dia: "sabado", inicio: "18:00", fin: "14:00" } })]),
    ).toContain("reunion.fin");
  });

  it("rechaza ramas vacías, repetidas o desconocidas", () => {
    expect(errorOf([grupo({ ramas: [] })])).toContain("ramas");
    expect(errorOf([grupo({ ramas: ["scouts", "scouts"] })])).toContain("ramas");
    expect(errorOf([grupo({ ramas: ["tropa"] })])).toContain("ramas");
  });

  it("rechaza ids repetidos", () => {
    expect(errorOf([grupo(), grupo({ nombre: "Otro" })])).toContain("id 815 repetido");
  });

  it("rechaza actualizado con formato inválido", () => {
    expect(errorOf([grupo({ actualizado: "2025-13" })])).toContain("actualizado");
  });

  it("lista todos los errores, no solo el primero", () => {
    const msg = errorOf([grupo({ municipio: "Bogotá", actualizado: "x" })]);
    expect(msg).toContain("municipio");
    expect(msg).toContain("actualizado");
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL, "Failed to resolve import @/data/schema".

- [ ] **Step 3: Implementar `src/data/schema.ts`**

```ts
import { z } from "zod";
import { RAMA_IDS, sortRamas } from "@/data/ramas";
import { MUNICIPIOS, VALLE_BOUNDS } from "@/data/region";

export const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;
export type Dia = (typeof DIAS)[number];

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "debe tener formato HH:mm (24 h)");
const httpsUrl = z.url({ protocol: /^https$/, error: "debe ser una URL https://" }).nullable();
const texto = z.string().trim().min(1, "no puede estar vacío");

export const reunionSchema = z
  .strictObject({ dia: z.enum(DIAS), inicio: hora, fin: hora.nullable() })
  .refine((r) => r.fin === null || r.fin > r.inicio, {
    message: "debe ser posterior a la hora de inicio",
    path: ["fin"],
  });
export type Reunion = z.output<typeof reunionSchema>;

export const grupoSchema = z.strictObject({
  id: z.number().int().positive(),
  nombre: texto,
  municipio: z.enum(MUNICIPIOS),
  localidad: texto.nullable(),
  direccion: texto,
  ubicacion: z.strictObject({
    lat: z.number().min(VALLE_BOUNDS.latMin).max(VALLE_BOUNDS.latMax),
    lng: z.number().min(VALLE_BOUNDS.lngMin).max(VALLE_BOUNDS.lngMax),
  }),
  reunion: reunionSchema,
  ramas: z
    .array(z.enum(RAMA_IDS))
    .min(1, "debe tener al menos una rama")
    .refine((rs) => new Set(rs).size === rs.length, "tiene ramas repetidas")
    .transform(sortRamas),
  contacto: z.strictObject({
    email: z
      .email("debe ser un correo válido")
      .refine((e) => e.endsWith("@scout.org.co"), "solo se publican correos @scout.org.co")
      .nullable(),
    whatsapp: z
      .string()
      .regex(/^57\d{10}$/, "debe tener formato 57 + 10 dígitos, sin + ni espacios")
      .nullable(),
    instagram: httpsUrl,
    facebook: httpsUrl,
    web: httpsUrl,
  }),
  actualizado: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "debe tener formato YYYY-MM"),
});
export type Grupo = z.output<typeof grupoSchema>;

const gruposSchema = z.array(grupoSchema).superRefine((grupos, ctx) => {
  const vistos = new Set<number>();
  grupos.forEach((g, i) => {
    if (vistos.has(g.id)) {
      ctx.addIssue({ code: "custom", message: `id ${g.id} repetido`, path: [i, "id"] });
    }
    vistos.add(g.id);
  });
});

function etiqueta(raw: unknown, index: PropertyKey | undefined): string {
  if (typeof index !== "number" || !Array.isArray(raw)) return "grupos.json";
  const g: unknown = raw[index];
  if (typeof g === "object" && g !== null && "id" in g && "nombre" in g) {
    return `grupo ${String(g.id)} (${String(g.nombre)})`;
  }
  return `grupo en la posición ${index}`;
}

/** Valida los datos de grupos. Si algo falla, lanza un Error que lista todos los problemas. */
export function parseGrupos(raw: unknown): Grupo[] {
  const result = gruposSchema.safeParse(raw);
  if (result.success) return result.data;

  const lineas = result.error.issues.map((issue) => {
    const [index, ...resto] = issue.path;
    const campo = resto.length > 0 ? resto.map(String).join(".") : "(registro)";
    return `  - ${etiqueta(raw, index)}: ${campo}: ${issue.message}`;
  });
  throw new Error(`Datos de grupos inválidos (src/data/grupos.json):\n${lineas.join("\n")}`);
}
```

Nota: en Zod 4, la clave desconocida produce un issue `unrecognized_keys` con `path` en el objeto padre y mensaje `Unrecognized key: "jefe"`. Por eso el test busca `jefe` en el mensaje y no en el campo. Si la versión instalada redacta el mensaje distinto, ajusta **la implementación** para que el nombre de la clave aparezca (por ejemplo, agregando `issue.keys` cuando `issue.code === "unrecognized_keys"`), no el test.

- [ ] **Step 4: Correr tests**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/schema.ts tests/unit/schema.test.ts
git commit -m "feat(data): validate group data with strict Zod schema and readable errors

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Migrar los datos al nuevo formato (y sacar los datos personales)

**Files:**

- Create (temporal, no se commitea): `scripts/migrate-2026-10.mjs`
- Create: `src/data/grupos.json`, `src/data/grupos.ts`
- Delete: `public/grupos.json`
- Test: `tests/unit/grupos-data.test.ts`

**Interfaces:**

- Consumes: `parseGrupos`, `type Grupo` (Task 3).
- Produces: `src/data/grupos.ts` exporta `grupos: readonly Grupo[]` y `municipiosConGrupos: { slug: string; nombre: Municipio }[]` (ordenados por nombre, solo municipios con al menos un grupo).

`municipiosConGrupos` usa `slugify` de Task 5, que todavía no existe. Para no adelantar Task 5, aquí se exporta solo `grupos`; `municipiosConGrupos` se agrega en Task 6.

- [ ] **Step 1: Test que falla**

`tests/unit/grupos-data.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { grupos } from "@/data/grupos";

const raw = readFileSync("src/data/grupos.json", "utf8");

describe("datos de grupos", () => {
  it("contiene los 22 grupos validados", () => {
    expect(grupos).toHaveLength(22);
  });

  it("no contiene campos ni correos personales", () => {
    for (const campo of ['"jefe"', '"telefono"', '"telefonoAlt"']) expect(raw).not.toContain(campo);
    for (const dominio of ["@gmail.", "@hotmail.", "@yahoo."]) expect(raw).not.toContain(dominio);
  });

  it("Rozo es localidad de Palmira", () => {
    const g = grupos.find((x) => x.id === 607);
    expect(g?.municipio).toBe("Palmira");
    expect(g?.localidad).toBe("Rozo");
  });

  it("migra ramas a los nombres nacionales", () => {
    expect(grupos.find((x) => x.id === 840)?.ramas).toEqual([
      "cachorros",
      "lobatos",
      "scouts",
      "nomadas",
      "rovers",
    ]);
  });

  it("migra el horario del domingo", () => {
    expect(grupos.find((x) => x.id === 909)?.reunion).toEqual({
      dia: "domingo",
      inicio: "10:00",
      fin: "12:30",
    });
  });
});
```

Run: `npx vitest run tests/unit/grupos-data.test.ts`
Expected: FAIL, "Failed to resolve import @/data/grupos".

- [ ] **Step 2: Escribir el script de migración**

`scripts/migrate-2026-10.mjs`:

```js
// Migración única del formato 2025 al formato 2026. Se ejecuta una vez y se borra.
import { readFileSync, writeFileSync } from "node:fs";

const [, , origen, destino, actualizado] = process.argv;
const viejos = JSON.parse(readFileSync(origen, "utf8"));

const RAMAS = {
  Cachorros: "cachorros",
  Manada: "lobatos",
  Tropa: "scouts",
  Comunidad: "nomadas",
  Clan: "rovers",
};

// Horarios revisados a mano desde el texto libre original.
const REUNION = {
  815: ["sabado", "14:00", "18:00"],
  662: ["sabado", "14:00", "18:00"],
  928: ["sabado", "14:00", null],
  823: ["sabado", "15:00", "18:30"],
  938: ["sabado", "14:00", "17:00"],
  901: ["sabado", "14:30", "17:30"],
  315: ["sabado", "14:00", null],
  808: ["sabado", "15:00", "18:00"],
  904: ["sabado", "14:30", "18:00"],
  208: ["sabado", "15:00", null],
  607: ["sabado", "14:00", "17:30"],
  828: ["sabado", "14:30", "17:30"],
  117: ["sabado", "15:00", null],
  123: ["sabado", "15:00", "18:00"],
  411: ["sabado", "14:30", null],
  601: ["sabado", "14:30", null],
  841: ["sabado", "14:30", null],
  840: ["sabado", "14:00", "18:00"],
  816: ["sabado", "14:30", "18:00"],
  909: ["domingo", "10:00", "12:30"],
  605: ["sabado", "14:00", "17:30"],
  809: ["sabado", "14:00", "18:00"],
};

const NOMBRES = { 607: "Zimbabue", 841: "Samaguare", 809: "León Dorado" };

function url(valor) {
  const v = (valor ?? "").trim();
  if (!v || v === "N/A" || /\s/.test(v)) return null; // "Grupo scout 808 Delfines" no es URL
  const conProtocolo = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return conProtocolo.replace(/^http:\/\//i, "https://");
}

function email(valor) {
  const v = (valor ?? "").trim().toLowerCase();
  return v.endsWith("@scout.org.co") ? v : null;
}

const nuevos = viejos.map((g) => {
  const [dia, inicio, fin] = REUNION[g.id];
  const esRozo = g.ciudad === "Rozo";
  return {
    id: g.id,
    nombre: NOMBRES[g.id] ?? g.nombre.trim(),
    municipio: esRozo ? "Palmira" : g.ciudad,
    localidad: esRozo ? "Rozo" : null,
    direccion: g.direccion.trim(),
    ubicacion: { lat: g.latitud, lng: g.longitud },
    reunion: { dia, inicio, fin },
    ramas: g.ramas.map((r) => RAMAS[r]),
    contacto: {
      email: email(g.email),
      whatsapp: null,
      instagram: url(g.instagram),
      facebook: url(g.facebook),
      web: url(g.sitioWeb),
    },
    actualizado,
  };
});

nuevos.sort((a, b) => a.id - b.id);
writeFileSync(destino, `${JSON.stringify(nuevos, null, 2)}\n`);
console.log(`Migrados ${nuevos.length} grupos → ${destino}`);
```

- [ ] **Step 3: Ejecutar la migración y borrar el origen**

```bash
ACTUALIZADO=$(git log -1 --format=%cs -- public/grupos.json | cut -c1-7)   # 2025-05
node scripts/migrate-2026-10.mjs public/grupos.json src/data/grupos.json "$ACTUALIZADO"
rm scripts/migrate-2026-10.mjs && rmdir scripts 2>/dev/null || true
git rm -q public/grupos.json
npx prettier --write src/data/grupos.json
```

Expected: "Migrados 22 grupos → src/data/grupos.json".

- [ ] **Step 4: Crear `src/data/grupos.ts`**

```ts
import raw from "@/data/grupos.json";
import { parseGrupos, type Grupo } from "@/data/schema";

/** Todos los grupos, validados. Si los datos son inválidos, el build falla aquí. */
export const grupos: readonly Grupo[] = parseGrupos(raw);
```

- [ ] **Step 5: Correr tests y build**

Run: `npx vitest run && npm run build`
Expected: PASS. Si `parseGrupos` lanza un error, el mensaje dice qué grupo y qué campo falla: corrígelo en `src/data/grupos.json` (no en el esquema) y repite.

- [ ] **Step 6: Commit**

```bash
git add -A src/data tests/unit public
git commit -m "feat(data): migrate groups to validated format without personal data

Removes leader names, personal phones and personal email addresses.
Branch names follow the national program (scout.org.co).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Utilidades puras: slug, distancia, horario y enlaces de contacto

**Files:**

- Create: `src/lib/slug.ts`, `src/lib/geo.ts`, `src/lib/schedule.ts`, `src/lib/contact.ts`
- Test: `tests/unit/slug.test.ts`, `tests/unit/geo.test.ts`, `tests/unit/schedule.test.ts`, `tests/unit/contact.test.ts`

**Interfaces:**

- Consumes: `type Lang`, `LOCALE` (Task 2); `type Reunion`, `type Dia`, `type Grupo` (Task 3).
- Produces:
  - `slugify(text: string): string`; `grupoSlug(g: { id: number; nombre: string }): string`
  - `interface LatLng { lat: number; lng: number }`; `distanceKm(a: LatLng, b: LatLng): number`; `formatDistance(km: number, lang: Lang): string`
  - `formatHora(hhmm: string, lang: Lang): string`; `formatReunion(r: Reunion, lang: Lang): string`
  - `whatsappUrl(numero: string, mensaje: string): string`; `mailtoUrl(email: string, asunto: string): string`; `directionsUrl(p: LatLng): string`; `wazeUrl(p: LatLng): string`; `formatWhatsapp(numero: string): string`

- [ ] **Step 1: Tests que fallan**

`tests/unit/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { grupoSlug, slugify } from "@/lib/slug";

describe("slug", () => {
  it("quita tildes, mayúsculas y signos", () => {
    expect(slugify("Fénix Escarlata")).toBe("fenix-escarlata");
    expect(slugify("  Águilas   Doradas! ")).toBe("aguilas-doradas");
    expect(slugify("Tuluá")).toBe("tulua");
    expect(slugify("Orión")).toBe("orion");
  });

  it("antepone el número del grupo", () => {
    expect(grupoSlug({ id: 815, nombre: "Fénix Escarlata" })).toBe("815-fenix-escarlata");
  });
});
```

`tests/unit/geo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { distanceKm, formatDistance } from "@/lib/geo";

describe("geo", () => {
  it("calcula la distancia Cali–Palmira (~23 km)", () => {
    const d = distanceKm({ lat: 3.4516, lng: -76.532 }, { lat: 3.5394, lng: -76.3036 });
    expect(d).toBeGreaterThan(25);
    expect(d).toBeLessThan(28);
  });

  it("distancia cero al mismo punto", () => {
    expect(distanceKm({ lat: 3.4, lng: -76.5 }, { lat: 3.4, lng: -76.5 })).toBe(0);
  });

  it("formatea según idioma y magnitud", () => {
    expect(formatDistance(0.853, "es")).toBe("850 m");
    expect(formatDistance(2.345, "es")).toBe("2,3 km");
    expect(formatDistance(2.345, "en")).toBe("2.3 km");
    expect(formatDistance(23.4, "es")).toBe("23 km");
  });
});
```

`tests/unit/schedule.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatHora, formatReunion } from "@/lib/schedule";

describe("schedule", () => {
  it("formatea horas en 12 h", () => {
    expect(formatHora("14:00", "es")).toBe("2:00 p. m.");
    expect(formatHora("14:00", "en")).toBe("2:00 PM");
    expect(formatHora("10:30", "es")).toBe("10:30 a. m.");
    expect(formatHora("12:00", "en")).toBe("12:00 PM");
    expect(formatHora("00:15", "en")).toBe("12:15 AM");
  });

  it("formatea una reunión con inicio y fin", () => {
    const r = { dia: "sabado", inicio: "14:00", fin: "18:00" } as const;
    expect(formatReunion(r, "es")).toBe("Sábados, 2:00 p. m. – 6:00 p. m.");
    expect(formatReunion(r, "en")).toBe("Saturdays, 2:00 PM – 6:00 PM");
  });

  it("formatea una reunión sin hora de fin", () => {
    const r = { dia: "sabado", inicio: "14:30", fin: null } as const;
    expect(formatReunion(r, "es")).toBe("Sábados, desde las 2:30 p. m.");
    expect(formatReunion(r, "en")).toBe("Saturdays, from 2:30 PM");
  });

  it("formatea domingos", () => {
    expect(formatReunion({ dia: "domingo", inicio: "10:00", fin: "12:30" }, "es")).toBe(
      "Domingos, 10:00 a. m. – 12:30 p. m.",
    );
  });
});
```

`tests/unit/contact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { directionsUrl, formatWhatsapp, mailtoUrl, wazeUrl, whatsappUrl } from "@/lib/contact";

describe("contact", () => {
  it("arma el enlace de WhatsApp con mensaje codificado", () => {
    expect(whatsappUrl("573001234567", "Hola, ¿info?")).toBe(
      "https://wa.me/573001234567?text=Hola%2C%20%C2%BFinfo%3F",
    );
  });

  it("arma mailto con asunto", () => {
    expect(mailtoUrl("valle.grupo815@scout.org.co", "Inscripción — Grupo 815")).toBe(
      "mailto:valle.grupo815@scout.org.co?subject=Inscripci%C3%B3n%20%E2%80%94%20Grupo%20815",
    );
  });

  it("arma enlaces de navegación", () => {
    const p = { lat: 3.493053, lng: -76.520585 };
    expect(directionsUrl(p)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=3.493053%2C-76.520585",
    );
    expect(wazeUrl(p)).toBe("https://waze.com/ul?ll=3.493053%2C-76.520585&navigate=yes");
  });

  it("formatea el número para mostrar", () => {
    expect(formatWhatsapp("573001234567")).toBe("+57 300 123 4567");
  });
});
```

Run: `npx vitest run tests/unit/slug.test.ts tests/unit/geo.test.ts tests/unit/schedule.test.ts tests/unit/contact.test.ts`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 2: Implementar**

`src/lib/slug.ts`:

```ts
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function grupoSlug(grupo: { id: number; nombre: string }): string {
  return `${grupo.id}-${slugify(grupo.nombre)}`;
}
```

`src/lib/geo.ts`:

```ts
import { LOCALE, type Lang } from "@/i18n/lang";

export interface LatLng {
  lat: number;
  lng: number;
}

const RADIO_TIERRA_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia en línea recta (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number, lang: Lang): string {
  if (km < 1) return `${Math.round((km * 1000) / 10) * 10} m`;
  const digits = km < 10 ? 1 : 0;
  const n = new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(km);
  return `${n} km`;
}
```

`src/lib/schedule.ts`:

```ts
import type { Lang } from "@/i18n/lang";
import type { Dia, Reunion } from "@/data/schema";

const DIAS_PLURAL: Record<Lang, Record<Dia, string>> = {
  es: {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábados",
    domingo: "Domingos",
  },
  en: {
    lunes: "Mondays",
    martes: "Tuesdays",
    miercoles: "Wednesdays",
    jueves: "Thursdays",
    viernes: "Fridays",
    sabado: "Saturdays",
    domingo: "Sundays",
  },
};

export function formatHora(hhmm: string, lang: Lang): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const h12 = ((h + 11) % 12) + 1;
  const pm = h >= 12;
  const sufijo = lang === "es" ? (pm ? "p. m." : "a. m.") : pm ? "PM" : "AM";
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

export function formatReunion(reunion: Reunion, lang: Lang): string {
  const dia = DIAS_PLURAL[lang][reunion.dia];
  const inicio = formatHora(reunion.inicio, lang);
  if (reunion.fin === null)
    return lang === "es" ? `${dia}, desde las ${inicio}` : `${dia}, from ${inicio}`;
  return `${dia}, ${inicio} – ${formatHora(reunion.fin, lang)}`;
}
```

`src/lib/contact.ts`:

```ts
import type { LatLng } from "@/lib/geo";

export function whatsappUrl(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function mailtoUrl(email: string, asunto: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}`;
}

export function directionsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function wazeUrl({ lat, lng }: LatLng): string {
  return `https://waze.com/ul?ll=${encodeURIComponent(`${lat},${lng}`)}&navigate=yes`;
}

/** "573001234567" → "+57 300 123 4567" */
export function formatWhatsapp(numero: string): string {
  const local = numero.slice(2);
  return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
```

- [ ] **Step 3: Correr tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib tests/unit
git commit -m "feat(lib): add slug, distance, schedule and contact link helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Búsqueda, filtros y estado en la URL

**Files:**

- Create: `src/lib/search.ts`, `src/lib/url-state.ts`
- Modify: `src/data/grupos.ts` (agregar `municipiosConGrupos`)
- Test: `tests/unit/search.test.ts`, `tests/unit/url-state.test.ts`

**Interfaces:**

- Consumes: `Grupo` (Task 3); `RamaId`, `isRamaId`, `sortRamas` (Task 2); `slugify` (Task 5); `distanceKm`, `LatLng` (Task 5).
- Produces:
  - `interface Filters { q: string; municipio: string | null /* slug */; ramas: RamaId[] }`, `EMPTY_FILTERS: Filters`, `hasActiveFilters(f: Filters): boolean`
  - `normalize(text: string): string`
  - `matchesFilters(g: Grupo, f: Filters): boolean`
  - `interface Resultado { grupo: Grupo; distanciaKm: number | null }`
  - `buscar(grupos: readonly Grupo[], f: Filters, origen: LatLng | null): Resultado[]`
  - `parseFilters(params: URLSearchParams, municipioSlugs: readonly string[]): Filters`
  - `serializeFilters(f: Filters): string` (devuelve `""` o `"?…"`)
  - En `src/data/grupos.ts`: `municipiosConGrupos: { slug: string; nombre: string }[]`

- [ ] **Step 1: Tests que fallan**

`tests/unit/search.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Grupo } from "@/data/schema";
import { EMPTY_FILTERS, buscar, hasActiveFilters, matchesFilters, normalize } from "@/lib/search";

function g(
  id: number,
  nombre: string,
  municipio: Grupo["municipio"],
  extra: Partial<Grupo> = {},
): Grupo {
  return {
    id,
    nombre,
    municipio,
    localidad: null,
    direccion: "Colegio Claret, barrio Pance",
    ubicacion: { lat: 3.45, lng: -76.53 },
    reunion: { dia: "sabado", inicio: "14:00", fin: null },
    ramas: ["lobatos", "scouts"],
    contacto: { email: null, whatsapp: null, instagram: null, facebook: null, web: null },
    actualizado: "2025-05",
    ...extra,
  };
}

const fenix = g(815, "Fénix Escarlata", "Cali", {
  ramas: ["lobatos", "scouts", "nomadas", "rovers"],
});
const rozo = g(607, "Zimbabue", "Palmira", {
  localidad: "Rozo",
  ubicacion: { lat: 3.609, lng: -76.388 },
});
const buga = g(315, "Águilas Doradas", "Buga", { ubicacion: { lat: 3.8918, lng: -76.29 } });
const todos = [fenix, rozo, buga];

describe("normalize", () => {
  it("ignora tildes, mayúsculas y espacios extra", () => {
    expect(normalize("  FÉNIX  ")).toBe("fenix");
  });
});

describe("matchesFilters", () => {
  const f = (over: Partial<typeof EMPTY_FILTERS>) => ({ ...EMPTY_FILTERS, ...over });

  it("encuentra por nombre sin tildes ni mayúsculas", () => {
    expect(matchesFilters(fenix, f({ q: "fenix" }))).toBe(true);
    expect(matchesFilters(fenix, f({ q: "  FÉNIX " }))).toBe(true);
  });

  it("encuentra por número, municipio, localidad y dirección", () => {
    expect(matchesFilters(fenix, f({ q: "815" }))).toBe(true);
    expect(matchesFilters(rozo, f({ q: "rozo" }))).toBe(true);
    expect(matchesFilters(fenix, f({ q: "pance" }))).toBe(true);
  });

  it("exige todas las palabras", () => {
    expect(matchesFilters(fenix, f({ q: "fenix cali" }))).toBe(true);
    expect(matchesFilters(fenix, f({ q: "fenix buga" }))).toBe(false);
  });

  it("filtra por municipio (slug)", () => {
    expect(matchesFilters(buga, f({ municipio: "buga" }))).toBe(true);
    expect(matchesFilters(fenix, f({ municipio: "buga" }))).toBe(false);
  });

  it("exige todas las ramas elegidas", () => {
    expect(matchesFilters(fenix, f({ ramas: ["scouts", "rovers"] }))).toBe(true);
    expect(matchesFilters(rozo, f({ ramas: ["scouts", "rovers"] }))).toBe(false);
  });
});

describe("buscar", () => {
  it("sin ubicación ordena por municipio y nombre, sin distancia", () => {
    const r = buscar(todos, EMPTY_FILTERS, null);
    expect(r.map((x) => x.grupo.id)).toEqual([315, 815, 607]);
    expect(r.every((x) => x.distanciaKm === null)).toBe(true);
  });

  it("con ubicación ordena por distancia", () => {
    const enBuga = { lat: 3.9, lng: -76.3 };
    const r = buscar(todos, EMPTY_FILTERS, enBuga);
    expect(r[0]?.grupo.id).toBe(315);
    expect(r[0]?.distanciaKm).toBeLessThan(2);
  });

  it("devuelve vacío si nada coincide", () => {
    expect(buscar(todos, { ...EMPTY_FILTERS, q: "zzz" }, null)).toEqual([]);
  });
});

describe("hasActiveFilters", () => {
  it("detecta filtros activos", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: "  " })).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, ramas: ["scouts"] })).toBe(true);
  });
});
```

`tests/unit/url-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "@/lib/search";
import { parseFilters, serializeFilters } from "@/lib/url-state";

const SLUGS = ["buga", "cali", "palmira"];
const parse = (qs: string) => parseFilters(new URLSearchParams(qs), SLUGS);

describe("url-state", () => {
  it("lee filtros válidos", () => {
    expect(parse("q=fenix&municipio=cali&rama=rovers&rama=scouts")).toEqual({
      q: "fenix",
      municipio: "cali",
      ramas: ["scouts", "rovers"],
    });
  });

  it("ignora valores inválidos sin fallar", () => {
    expect(parse("municipio=bogota&rama=foo&rama=scouts&rama=scouts")).toEqual({
      q: "",
      municipio: null,
      ramas: ["scouts"],
    });
  });

  it("recorta búsquedas excesivamente largas y conserva texto literal", () => {
    const largo = "<script>".repeat(50);
    const f = parse(`q=${encodeURIComponent(largo)}`);
    expect(f.q.length).toBe(100);
    expect(f.q.startsWith("<script>")).toBe(true);
  });

  it("serializa y vuelve a leer igual", () => {
    const f = { q: "fénix", municipio: "cali", ramas: ["scouts", "rovers"] as const };
    const qs = serializeFilters({ ...f, ramas: [...f.ramas] });
    expect(qs).toBe("?q=f%C3%A9nix&municipio=cali&rama=scouts&rama=rovers");
    expect(parse(qs.slice(1))).toEqual({ ...f, ramas: [...f.ramas] });
  });

  it("sin filtros no agrega query string", () => {
    expect(serializeFilters(EMPTY_FILTERS)).toBe("");
    expect(serializeFilters({ ...EMPTY_FILTERS, q: "   " })).toBe("");
  });
});
```

Run: `npx vitest run tests/unit/search.test.ts tests/unit/url-state.test.ts`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 2: Implementar**

`src/lib/search.ts`:

```ts
import type { RamaId } from "@/data/ramas";
import type { Grupo } from "@/data/schema";
import { distanceKm, type LatLng } from "@/lib/geo";
import { slugify } from "@/lib/slug";

export interface Filters {
  q: string;
  /** slug del municipio, p. ej. "cali" */
  municipio: string | null;
  ramas: RamaId[];
}

export const EMPTY_FILTERS: Filters = { q: "", municipio: null, ramas: [] };

export function hasActiveFilters(f: Filters): boolean {
  return f.q.trim() !== "" || f.municipio !== null || f.ramas.length > 0;
}

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchesFilters(grupo: Grupo, f: Filters): boolean {
  if (f.municipio !== null && slugify(grupo.municipio) !== f.municipio) return false;
  if (!f.ramas.every((r) => grupo.ramas.includes(r))) return false;

  const q = normalize(f.q);
  if (q === "") return true;
  const texto = normalize(
    [grupo.nombre, String(grupo.id), grupo.municipio, grupo.localidad ?? "", grupo.direccion].join(
      " ",
    ),
  );
  return q.split(" ").every((palabra) => texto.includes(palabra));
}

export interface Resultado {
  grupo: Grupo;
  distanciaKm: number | null;
}

export function buscar(grupos: readonly Grupo[], f: Filters, origen: LatLng | null): Resultado[] {
  const resultados = grupos
    .filter((g) => matchesFilters(g, f))
    .map((grupo) => ({ grupo, distanciaKm: origen ? distanceKm(origen, grupo.ubicacion) : null }));

  return resultados.sort((a, b) =>
    origen
      ? (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0)
      : a.grupo.municipio.localeCompare(b.grupo.municipio, "es") ||
        a.grupo.nombre.localeCompare(b.grupo.nombre, "es"),
  );
}
```

`src/lib/url-state.ts`:

```ts
import { isRamaId, sortRamas } from "@/data/ramas";
import type { Filters } from "@/lib/search";

const MAX_Q = 100;

export function parseFilters(params: URLSearchParams, municipioSlugs: readonly string[]): Filters {
  const municipio = params.get("municipio");
  const ramas = [...new Set(params.getAll("rama"))].filter(isRamaId);
  return {
    q: (params.get("q") ?? "").slice(0, MAX_Q),
    municipio: municipio !== null && municipioSlugs.includes(municipio) ? municipio : null,
    ramas: sortRamas(ramas),
  };
}

export function serializeFilters(f: Filters): string {
  const params = new URLSearchParams();
  const q = f.q.trim();
  if (q) params.set("q", q);
  if (f.municipio) params.set("municipio", f.municipio);
  for (const rama of f.ramas) params.append("rama", rama);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
```

`src/data/grupos.ts` (versión completa):

```ts
import raw from "@/data/grupos.json";
import { parseGrupos, type Grupo } from "@/data/schema";
import { slugify } from "@/lib/slug";

/** Todos los grupos, validados. Si los datos son inválidos, el build falla aquí. */
export const grupos: readonly Grupo[] = parseGrupos(raw);

/** Municipios que tienen al menos un grupo, ordenados alfabéticamente. */
export const municipiosConGrupos: { slug: string; nombre: string }[] = [
  ...new Set(grupos.map((g) => g.municipio)),
]
  .sort((a, b) => a.localeCompare(b, "es"))
  .map((nombre) => ({ slug: slugify(nombre), nombre }));
```

Agrega a `tests/unit/grupos-data.test.ts`:

```ts
import { municipiosConGrupos } from "@/data/grupos";

it("lista los municipios con grupos, ordenados", () => {
  expect(municipiosConGrupos.map((m) => m.slug)).toEqual([
    "buga",
    "cali",
    "candelaria",
    "cartago",
    "palmira",
    "tulua",
  ]);
});
```

(Combina el `import` con el existente al inicio del archivo y pon el `it` dentro del `describe`.)

- [ ] **Step 3: Correr tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib src/data/grupos.ts tests/unit
git commit -m "feat(lib): add accent-insensitive search, filters and URL state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Textos de interfaz, rutas por idioma y formato de fecha

**Files:**

- Create: `src/i18n/ui.ts`, `src/i18n/routes.ts`, `src/i18n/format.ts`
- Test: `tests/unit/i18n.test.ts`

**Interfaces:**

- Consumes: `Lang`, `LOCALE` (Task 2); `grupoSlug` (Task 5).
- Produces:
  - `type UiKey`; `translator(lang: Lang): (key: UiKey, vars?: Record<string, string | number>) => string`
  - `type PageKey = "home" | "about"`; `pagePath(lang: Lang, page: PageKey): string`; `grupoPath(lang: Lang, g: { id: number; nombre: string }): string`; `alternatePath(path: string, target: Lang): string`; `langFromPath(path: string): Lang`
  - `formatMonth(ym: string, lang: Lang): string`

- [ ] **Step 1: Test que falla**

`tests/unit/i18n.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatMonth } from "@/i18n/format";
import { alternatePath, grupoPath, langFromPath, pagePath } from "@/i18n/routes";
import { translator, ui } from "@/i18n/ui";

describe("ui", () => {
  it("ambos idiomas tienen exactamente las mismas claves", () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.es).sort());
  });

  it("ningún texto está vacío", () => {
    for (const dict of [ui.es, ui.en])
      for (const v of Object.values(dict)) expect(v.trim()).not.toBe("");
  });

  it("interpola variables", () => {
    expect(translator("es")("grupo.number", { id: 815 })).toBe("Grupo 815");
    expect(translator("en")("grupo.number", { id: 815 })).toBe("Group 815");
  });
});

describe("routes", () => {
  const fenix = { id: 815, nombre: "Fénix Escarlata" };

  it("arma rutas por idioma", () => {
    expect(pagePath("es", "home")).toBe("/");
    expect(pagePath("en", "about")).toBe("/en/what-is-scouting/");
    expect(grupoPath("es", fenix)).toBe("/grupos/815-fenix-escarlata/");
    expect(grupoPath("en", fenix)).toBe("/en/groups/815-fenix-escarlata/");
  });

  it("traduce rutas al otro idioma", () => {
    expect(alternatePath("/grupos/815-fenix-escarlata/", "en")).toBe(
      "/en/groups/815-fenix-escarlata/",
    );
    expect(alternatePath("/en/groups/815-fenix-escarlata/", "es")).toBe(
      "/grupos/815-fenix-escarlata/",
    );
    expect(alternatePath("/que-es-ser-scout/", "en")).toBe("/en/what-is-scouting/");
    expect(alternatePath("/en/", "es")).toBe("/");
    expect(alternatePath("/ruta-desconocida/", "en")).toBe("/en/");
  });

  it("detecta el idioma por la ruta", () => {
    expect(langFromPath("/en/groups/x/")).toBe("en");
    expect(langFromPath("/en/")).toBe("en");
    expect(langFromPath("/grupos/x/")).toBe("es");
    expect(langFromPath("/english/")).toBe("es");
  });
});

describe("formatMonth", () => {
  it("formatea YYYY-MM", () => {
    expect(formatMonth("2025-05", "es")).toBe("mayo de 2025");
    expect(formatMonth("2025-05", "en")).toBe("May 2025");
  });
});
```

Run: `npx vitest run tests/unit/i18n.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implementar `src/i18n/ui.ts`**

```ts
import type { Lang } from "@/i18n/lang";

const es = {
  "site.title": "Buscador de Grupos Scout · Región Valle",
  "site.description":
    "Encuentra el grupo scout más cercano en el Valle del Cauca, mira sus horarios y contáctalo.",
  "nav.skip": "Saltar al contenido",
  "nav.finder": "Buscar grupo",
  "nav.about": "¿Qué es ser scout?",
  "nav.home": "Inicio: buscador de grupos",
  "lang.switch": "English",
  "lang.switchLabel": "Ver esta página en inglés",
  "theme.toggle": "Cambiar entre tema claro y oscuro",
  "finder.heading": "Encuentra tu grupo scout",
  "finder.lead": "{n} grupos en el Valle del Cauca. Busca por nombre, número, municipio o barrio.",
  "finder.searchLabel": "Buscar grupo",
  "finder.searchPlaceholder": "Nombre, número o barrio",
  "finder.municipio": "Municipio",
  "finder.allMunicipios": "Todos los municipios",
  "finder.ramas": "Ramas",
  "finder.ramaAge": "{min}–{max} años",
  "finder.nearMe": "Cerca de mí",
  "finder.nearMeActive": "Ordenado por cercanía",
  "finder.locating": "Buscando tu ubicación…",
  "finder.geoError": "No pudimos obtener tu ubicación. Los grupos se muestran por municipio.",
  "finder.count.one": "1 grupo",
  "finder.count.other": "{n} grupos",
  "finder.clear": "Limpiar filtros",
  "finder.empty.title": "No encontramos grupos con esos filtros",
  "finder.empty.body": "Prueba con menos filtros o contacta a la Región Valle.",
  "finder.empty.contact": "Contactar a la Región",
  "finder.showMap": "Ver mapa",
  "finder.showList": "Ver lista",
  "map.label": "Mapa de grupos scout del Valle del Cauca",
  "map.error": "No se pudo cargar el mapa. La lista de grupos sigue disponible.",
  "map.openGoogle": "Abrir la zona en Google Maps",
  "map.you": "Tu ubicación",
  "card.whatsapp": "WhatsApp de {nombre}",
  "card.distance": "a {d}",
  "grupo.number": "Grupo {id}",
  "grupo.meets": "Reuniones",
  "grupo.address": "Dirección",
  "grupo.ramas": "Ramas activas",
  "grupo.contact": "Contacto",
  "grupo.whatsapp": "Escribir por WhatsApp",
  "grupo.whatsappMsg":
    "Hola, encontré al Grupo {id} {nombre} en el buscador de la Región Valle y quisiera información para inscribirme.",
  "grupo.email": "Enviar correo",
  "grupo.emailSubject": "Información para inscripción — Grupo {id} {nombre}",
  "grupo.directions": "Cómo llegar",
  "grupo.waze": "Abrir en Waze",
  "grupo.instagram": "Instagram",
  "grupo.facebook": "Facebook",
  "grupo.web": "Sitio web",
  "grupo.noContact": "Este grupo aún no tiene canales de contacto publicados.",
  "grupo.contactRegion": "Contacta a la Región Valle",
  "grupo.updated": "Información actualizada: {fecha}",
  "grupo.back": "Volver al buscador",
  "grupo.mapLabel": "Ubicación del Grupo {id} {nombre}",
  "grupo.metaTitle": "Grupo Scout {id} {nombre} · {municipio}",
  "grupo.metaDescription":
    "Grupo Scout {id} {nombre} en {municipio}: horario de reunión, ramas activas y contacto.",
  "about.metaTitle": "¿Qué es ser scout? · Región Valle",
  "about.metaDescription":
    "Qué es el Movimiento Scout, las ramas por edad y cómo inscribirse en un grupo del Valle del Cauca.",
  "notFound.title": "Página no encontrada",
  "notFound.body": "La página que buscas no existe o cambió de dirección.",
  "notFound.cta": "Ir al buscador",
  "footer.about": "Buscador de grupos de la Región Valle, Asociación Scouts de Colombia.",
  "footer.region": "Sitio de la Región Valle",
  "footer.national": "Scouts de Colombia",
  "footer.source": "Código abierto en GitHub",
  "footer.trademark":
    "Los nombres, logos y emblemas de Scouts de Colombia y de la Región Valle pertenecen a sus titulares.",
} as const;

export type UiKey = keyof typeof es;

const en: Record<UiKey, string> = {
  "site.title": "Scout Group Finder · Valle Region",
  "site.description":
    "Find the nearest scout group in Valle del Cauca, Colombia, check its meeting times and get in touch.",
  "nav.skip": "Skip to content",
  "nav.finder": "Find a group",
  "nav.about": "What is Scouting?",
  "nav.home": "Home: group finder",
  "lang.switch": "Español",
  "lang.switchLabel": "View this page in Spanish",
  "theme.toggle": "Toggle light and dark theme",
  "finder.heading": "Find your scout group",
  "finder.lead": "{n} groups across Valle del Cauca. Search by name, number, town or neighborhood.",
  "finder.searchLabel": "Search groups",
  "finder.searchPlaceholder": "Name, number or neighborhood",
  "finder.municipio": "Town",
  "finder.allMunicipios": "All towns",
  "finder.ramas": "Sections",
  "finder.ramaAge": "ages {min}–{max}",
  "finder.nearMe": "Near me",
  "finder.nearMeActive": "Sorted by distance",
  "finder.locating": "Finding your location…",
  "finder.geoError": "We couldn't get your location. Groups are listed by town.",
  "finder.count.one": "1 group",
  "finder.count.other": "{n} groups",
  "finder.clear": "Clear filters",
  "finder.empty.title": "No groups match those filters",
  "finder.empty.body": "Try fewer filters or contact the Valle Region.",
  "finder.empty.contact": "Contact the Region",
  "finder.showMap": "Show map",
  "finder.showList": "Show list",
  "map.label": "Map of scout groups in Valle del Cauca",
  "map.error": "The map couldn't load. The list of groups is still available.",
  "map.openGoogle": "Open the area in Google Maps",
  "map.you": "Your location",
  "card.whatsapp": "WhatsApp {nombre}",
  "card.distance": "{d} away",
  "grupo.number": "Group {id}",
  "grupo.meets": "Meetings",
  "grupo.address": "Address",
  "grupo.ramas": "Active sections",
  "grupo.contact": "Contact",
  "grupo.whatsapp": "Message on WhatsApp",
  "grupo.whatsappMsg":
    "Hi, I found Group {id} {nombre} on the Valle Region finder and I'd like information about joining.",
  "grupo.email": "Send email",
  "grupo.emailSubject": "Joining information — Group {id} {nombre}",
  "grupo.directions": "Get directions",
  "grupo.waze": "Open in Waze",
  "grupo.instagram": "Instagram",
  "grupo.facebook": "Facebook",
  "grupo.web": "Website",
  "grupo.noContact": "This group hasn't published contact channels yet.",
  "grupo.contactRegion": "Contact the Valle Region",
  "grupo.updated": "Information updated: {fecha}",
  "grupo.back": "Back to the finder",
  "grupo.mapLabel": "Location of Group {id} {nombre}",
  "grupo.metaTitle": "Scout Group {id} {nombre} · {municipio}",
  "grupo.metaDescription":
    "Scout Group {id} {nombre} in {municipio}, Colombia: meeting times, active sections and contact.",
  "about.metaTitle": "What is Scouting? · Valle Region",
  "about.metaDescription":
    "What the Scout Movement is, its age sections and how to join a group in Valle del Cauca, Colombia.",
  "notFound.title": "Page not found",
  "notFound.body": "The page you're looking for doesn't exist or has moved.",
  "notFound.cta": "Go to the finder",
  "footer.about": "Group finder of the Valle Region, Scouts of Colombia Association.",
  "footer.region": "Valle Region website",
  "footer.national": "Scouts of Colombia",
  "footer.source": "Open source on GitHub",
  "footer.trademark":
    "Names, logos and emblems of Scouts of Colombia and the Valle Region belong to their owners.",
};

export const ui: Record<Lang, Record<UiKey, string>> = { es, en };

export type Translate = (key: UiKey, vars?: Record<string, string | number>) => string;

export function translator(lang: Lang): Translate {
  return (key, vars) =>
    ui[lang][key].replace(/\{(\w+)\}/g, (match, name: string) =>
      vars && name in vars ? String(vars[name]) : match,
    );
}
```

`src/i18n/routes.ts`:

```ts
import type { Lang } from "@/i18n/lang";
import { grupoSlug } from "@/lib/slug";

export type PageKey = "home" | "about";

const PAGES: Record<Lang, Record<PageKey, string>> = {
  es: { home: "/", about: "/que-es-ser-scout/" },
  en: { home: "/en/", about: "/en/what-is-scouting/" },
};
const GRUPOS_BASE: Record<Lang, string> = { es: "/grupos/", en: "/en/groups/" };

export function pagePath(lang: Lang, page: PageKey): string {
  return PAGES[lang][page];
}

export function grupoPath(lang: Lang, grupo: { id: number; nombre: string }): string {
  return `${GRUPOS_BASE[lang]}${grupoSlug(grupo)}/`;
}

export function langFromPath(path: string): Lang {
  return path === "/en" || path.startsWith("/en/") ? "en" : "es";
}

/** Ruta equivalente en el otro idioma; si no se reconoce, la portada de ese idioma. */
export function alternatePath(path: string, target: Lang): string {
  const from = langFromPath(path);
  const base = GRUPOS_BASE[from];
  if (path.startsWith(base)) return `${GRUPOS_BASE[target]}${path.slice(base.length)}`;
  for (const page of Object.keys(PAGES[from]) as PageKey[]) {
    if (PAGES[from][page] === path) return PAGES[target][page];
  }
  return PAGES[target].home;
}
```

`src/i18n/format.ts`:

```ts
import { LOCALE, type Lang } from "@/i18n/lang";

/** "2025-05" → "mayo de 2025" / "May 2025" */
export function formatMonth(ym: string, lang: Lang): string {
  const [year = 1970, month = 1] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
```

- [ ] **Step 3: Correr tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/i18n tests/unit
git commit -m "feat(i18n): add typed ES/EN dictionaries and localized routes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Tokens visuales, layout base, encabezado y pie

**Files:**

- Modify: `src/styles/global.css`, `src/pages/index.astro`
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/LangSwitch.astro`, `src/components/ThemeToggle.astro`, `src/assets/logo-region-valle.png`, `src/assets/logo-region-valle-white.png`, `public/favicon.png`, `public/apple-touch-icon.png`

**Interfaces:**

- Consumes: `translator`, `alternatePath`, `pagePath` (Task 7); `REGION`, `REPO_URL` (Task 2).
- Produces: `Base.astro` con props `{ lang: Lang; title: string; description: string; path: string; ogImage?: string; jsonLd?: Record<string, unknown>; fullBleed?: boolean }`. `path` es la ruta canónica del idioma actual con `/` final. Por defecto `ogImage = "/og/default.png"`; esa imagen la crea Task 14 y hasta entonces el enlace queda roto, lo cual es esperado. `fullBleed` quita el ancho máximo del `<main>` (lo usa el buscador).
- CSS: clases `.rama-chip` con `data-rama="<id>"`; `.pin`, `.pin--active`, `.pin--you`; tokens `--color-*`; variante `dark:` ligada a `[data-theme="dark"]`.

- [ ] **Step 1: Descargar logos y favicons**

```bash
mkdir -p src/assets
curl -fsSL -o src/assets/logo-region-valle.png https://vallescout.org.co/wp-content/uploads/2025/02/logo_scoutvalle_new.png
curl -fsSL -o src/assets/logo-region-valle-white.png https://vallescout.org.co/wp-content/uploads/2025/02/logo-valle-scout_allwhite.png
curl -fsSL -o public/favicon.png https://vallescout.org.co/wp-content/uploads/2025/02/cropped-vallescout_flor-192x192.png
curl -fsSL -o public/apple-touch-icon.png https://vallescout.org.co/wp-content/uploads/2025/02/cropped-vallescout_flor-180x180.png
file src/assets/*.png public/*.png
```

Expected: cuatro archivos "PNG image data". Abre los dos logos y confirma que son el logo de la Región Valle (a color y en blanco). Si el mantenedor entrega un SVG, reemplaza estos archivos sin cambiar los nombres de import.

- [ ] **Step 2: Escribir `src/styles/global.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/figtree";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  --font-sans: "Figtree Variable", ui-sans-serif, system-ui, sans-serif;

  --color-brand: #4d006e;
  --color-brand-strong: #2c0f4d;
  --color-brand-soft: #f3eefa;
  --color-on-brand: #ffffff;
  --color-ink: #2a1d3d;
  --color-ink-soft: #5a4a70;
  --color-canvas: #faf8fd;
  --color-surface: #ffffff;
  --color-line: #e4dcef;
  --color-focus: #003087;
  --color-whatsapp: #0b7d3e;

  --color-rama-cachorros: #f0592b;
  --color-rama-lobatos: #ffd00f;
  --color-rama-scouts: #016937;
  --color-rama-nomadas: #233f96;
  --color-rama-rovers: #be2026;
  --color-rama-cachorros-ink: #c23600;
  --color-rama-lobatos-ink: #8a5a00;
  --color-rama-scouts-ink: #016937;
  --color-rama-nomadas-ink: #233f96;
  --color-rama-rovers-ink: #be2026;
}

@layer base {
  [data-theme="dark"] {
    color-scheme: dark;
    --color-brand: #9b6fd0;
    --color-brand-strong: #c7a8ee;
    --color-brand-soft: #2c0f4d;
    --color-on-brand: #1d1030;
    --color-ink: #f3eefa;
    --color-ink-soft: #c9bcdc;
    --color-canvas: #140a1f;
    --color-surface: #1d1030;
    --color-line: #3a2a52;
    --color-focus: #8fb4ff;
    --color-whatsapp: #4fd08a;
    --color-rama-cachorros-ink: #ff9a73;
    --color-rama-lobatos-ink: #ffd84a;
    --color-rama-scouts-ink: #5fd896;
    --color-rama-nomadas-ink: #9fb4ff;
    --color-rama-rovers-ink: #ff8a8e;
  }

  html {
    @apply bg-canvas text-ink font-sans antialiased;
  }

  :focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

@layer components {
  .rama-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    border-radius: 999px;
    padding: 0.125rem 0.625rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--rama-ink);
    background: color-mix(in oklab, var(--rama) 14%, transparent);
  }
  .rama-chip::before {
    content: "";
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 999px;
    background: var(--rama);
  }
  [data-rama="cachorros"] {
    --rama: var(--color-rama-cachorros);
    --rama-ink: var(--color-rama-cachorros-ink);
  }
  [data-rama="lobatos"] {
    --rama: var(--color-rama-lobatos);
    --rama-ink: var(--color-rama-lobatos-ink);
  }
  [data-rama="scouts"] {
    --rama: var(--color-rama-scouts);
    --rama-ink: var(--color-rama-scouts-ink);
  }
  [data-rama="nomadas"] {
    --rama: var(--color-rama-nomadas);
    --rama-ink: var(--color-rama-nomadas-ink);
  }
  [data-rama="rovers"] {
    --rama: var(--color-rama-rovers);
    --rama-ink: var(--color-rama-rovers-ink);
  }

  /* Pines del mapa (L.divIcon con className "pin") */
  .pin {
    width: 22px;
    height: 22px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: var(--color-brand);
    border: 2px solid var(--color-surface);
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
  }
  .pin--active {
    background: var(--color-focus);
    transform: rotate(-45deg) scale(1.3);
  }
  .pin--you {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    transform: none;
    background: #0090b4;
  }
  .marker-cluster-brand {
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--color-brand);
    color: var(--color-on-brand);
    font-weight: 700;
    border: 3px solid color-mix(in oklab, var(--color-brand) 35%, white);
  }
}
```

- [ ] **Step 3: Componentes del layout**

`src/components/ThemeToggle.astro`:

```astro
---
import type { Lang } from "@/i18n/lang";
import { translator } from "@/i18n/ui";

interface Props {
  lang: Lang;
}
const t = translator(Astro.props.lang);
---

<button
  type="button"
  data-theme-toggle
  class="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-brand-soft hover:text-ink"
  aria-label={t("theme.toggle")}
  title={t("theme.toggle")}
>
  <svg
    class="size-5 dark:hidden"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
  </svg>
  <svg
    class="hidden size-5 dark:block"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>
  </svg>
</button>

<script>
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Almacenamiento bloqueado: el cambio aplica solo a esta visita.
      }
    });
  }
</script>
```

`src/components/LangSwitch.astro`:

```astro
---
import type { Lang } from "@/i18n/lang";
import { alternatePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";

interface Props {
  lang: Lang;
  path: string;
}
const { lang, path } = Astro.props;
const t = translator(lang);
const target: Lang = lang === "es" ? "en" : "es";
---

<a
  href={alternatePath(path, target)}
  hreflang={target}
  lang={target}
  aria-label={t("lang.switchLabel")}
  class="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-brand-soft hover:text-ink"
>
  {t("lang.switch")}
</a>
```

`src/components/Header.astro`:

```astro
---
import { Image } from "astro:assets";
import logo from "@/assets/logo-region-valle.png";
import logoWhite from "@/assets/logo-region-valle-white.png";
import LangSwitch from "@/components/LangSwitch.astro";
import ThemeToggle from "@/components/ThemeToggle.astro";
import type { Lang } from "@/i18n/lang";
import { pagePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";

interface Props {
  lang: Lang;
  path: string;
}
const { lang, path } = Astro.props;
const t = translator(lang);
const about = pagePath(lang, "about");
---

<header class="sticky top-0 z-[1100] border-b border-line bg-surface/95 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
    <a href={pagePath(lang, "home")} aria-label={t("nav.home")} class="shrink-0">
      <Image src={logo} alt="" height={40} class="h-10 w-auto dark:hidden" loading="eager" />
      <Image
        src={logoWhite}
        alt=""
        height={40}
        class="hidden h-10 w-auto dark:block"
        loading="eager"
      />
    </a>
    <nav class="ml-auto flex items-center gap-1" aria-label="Principal">
      <a
        href={about}
        aria-current={path === about ? "page" : undefined}
        class="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-brand-soft hover:text-ink aria-[current=page]:text-brand sm:block"
      >
        {t("nav.about")}
      </a>
      <LangSwitch lang={lang} path={path} />
      <ThemeToggle lang={lang} />
    </nav>
  </div>
</header>
```

`src/components/Footer.astro`:

```astro
---
import type { Lang } from "@/i18n/lang";
import { pagePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";
import { REGION, REPO_URL } from "@/data/region";

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = translator(lang);
const link = "underline decoration-line underline-offset-4 hover:text-ink hover:decoration-current";
---

<footer class="border-t border-line bg-surface">
  <div class="mx-auto grid max-w-7xl gap-3 px-4 py-8 text-sm text-ink-soft">
    <p>{t("footer.about")}</p>
    <ul class="flex flex-wrap gap-x-5 gap-y-2">
      <li>
        <a class={link} href={pagePath(lang, "about")}>
          {t("nav.about")}
        </a>
      </li>
      <li>
        <a class={link} href={REGION.web}>
          {t("footer.region")}
        </a>
      </li>
      <li>
        <a class={link} href={REGION.nacional}>
          {t("footer.national")}
        </a>
      </li>
      <li>
        <a class={link} href={REPO_URL}>
          {t("footer.source")}
        </a>
      </li>
    </ul>
    <p class="text-xs">{t("footer.trademark")}</p>
  </div>
</footer>
```

- [ ] **Step 4: `src/layouts/Base.astro`**

```astro
---
import "@/styles/global.css";
import Footer from "@/components/Footer.astro";
import Header from "@/components/Header.astro";
import { LOCALE, type Lang } from "@/i18n/lang";
import { alternatePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";

interface Props {
  lang: Lang;
  title: string;
  description: string;
  /** Ruta canónica de esta página en su idioma, con "/" final. */
  path: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
  fullBleed?: boolean;
}

const {
  lang,
  title,
  description,
  path,
  ogImage = "/og/default.png",
  jsonLd,
  fullBleed = false,
} = Astro.props;
const t = translator(lang);
const site = Astro.site ?? new URL("https://buscador.vallescout.org.co");
const url = (p: string) => new URL(p, site).href;
const esPath = lang === "es" ? path : alternatePath(path, "es");
const enPath = lang === "en" ? path : alternatePath(path, "en");
const ldJson = jsonLd ? JSON.stringify(jsonLd).replace(/</g, "\\u003c") : null;
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={url(path)} />
    <link rel="alternate" hreflang="es" href={url(esPath)} />
    <link rel="alternate" hreflang="en" href={url(enPath)} />
    <link rel="alternate" hreflang="x-default" href={url(esPath)} />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <meta name="theme-color" content="#4d006e" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={t("site.title")} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url(path)} />
    <meta property="og:image" content={url(ogImage)} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content={LOCALE[lang].replace("-", "_")} />
    <meta name="twitter:card" content="summary_large_image" />
    <script is:inline>
      (() => {
        let theme = null;
        try {
          theme = localStorage.getItem("theme");
        } catch {
          /* almacenamiento bloqueado */
        }
        if (theme !== "light" && theme !== "dark") {
          theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.dataset.theme = theme;
      })();
    </script>
    {ldJson && <script type="application/ld+json" set:html={ldJson} />}
  </head>
  <body class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[2000] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
    >
      {t("nav.skip")}
    </a>
    <Header lang={lang} path={path} />
    <main id="main" class:list={["flex-1", !fullBleed && "mx-auto w-full max-w-5xl px-4 py-8"]}>
      <slot />
    </main>
    <Footer lang={lang} />
  </body>
</html>
```

- [ ] **Step 5: Usar el layout en la portada provisional**

`src/pages/index.astro`:

```astro
---
import Base from "@/layouts/Base.astro";
import { translator } from "@/i18n/ui";

const t = translator("es");
---

<Base lang="es" title={t("site.title")} description={t("site.description")} path="/">
  <h1 class="text-3xl font-bold text-brand">{t("finder.heading")}</h1>
</Base>
```

- [ ] **Step 6: Verificar**

```bash
npm run build && npm run check && npm run lint
grep -c 'hreflang="en"' dist/index.html          # ≥ 2 (alternate + LangSwitch)
grep -o '<meta http-equiv="content-security-policy"' dist/index.html || echo "sin CSP todavía (OK, llega en Task 14)"
npm run dev   # abre http://localhost:4321/ , cambia el tema, recarga: el tema persiste sin parpadeo
```

Expected: build, check y lint en verde. Visualmente: logo a color en claro y blanco en oscuro; "English" lleva a `/en/` (404 por ahora, esperado).

- [ ] **Step 7: Commit**

```bash
git add -A src public
git commit -m "feat(ui): add design tokens, base layout, header, footer and theme toggle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Base del mapa (Leaflet diferido) y mini mapa

**Files:**

- Create: `src/components/map/leaflet.ts`, `src/components/map/MiniMap.tsx`

**Interfaces:**

- Consumes: clases CSS `.pin`, `.pin--active`, `.pin--you`, `.marker-cluster-brand` (Task 8).
- Produces:
  - `loadLeaflet(): Promise<typeof Leaflet>`: carga Leaflet, su CSS y markercluster una sola vez; si falla, permite reintentar.
  - `addThemedTiles(L, map): () => void`: agrega teselas CARTO según `data-theme` y las cambia cuando cambia el tema; devuelve una función de limpieza.
  - `pinIcon(L, variant: "default" | "active" | "you"): Leaflet.DivIcon`
  - `clusterIcon(L, count: number): Leaflet.DivIcon`
  - `<MiniMap lat lng label errorText fallbackHref fallbackText />`: isla Preact.

- [ ] **Step 1: `src/components/map/leaflet.ts`**

```ts
import type * as Leaflet from "leaflet";

type L = typeof Leaflet;
let cargando: Promise<L> | null = null;

/** Carga Leaflet + markercluster bajo demanda. markercluster espera `window.L`. */
export function loadLeaflet(): Promise<L> {
  cargando ??= (async () => {
    const mod = await import("leaflet");
    await import("leaflet/dist/leaflet.css");
    const L = ("default" in mod ? mod.default : mod) as L;
    (window as unknown as { L: L }).L = L;
    await import("leaflet.markercluster");
    await import("leaflet.markercluster/dist/MarkerCluster.css");
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
```

- [ ] **Step 2: `src/components/map/MiniMap.tsx`**

```tsx
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
```

- [ ] **Step 3: Verificar tipos y lint**

Run: `npm run check && npm run lint`
Expected: en verde. `@types/leaflet.markercluster` ya amplía los tipos de `leaflet` (agrega `L.markerClusterGroup`), así que **no** declares ese módulo a mano. Si TS se queja solo de los `.css` dinámicos, agrega en `src/env.d.ts`:

```ts
declare module "*.css";
```

El render se verifica en Task 10, que usa `MiniMap`.

- [ ] **Step 4: Commit**

```bash
git add -A src
git commit -m "feat(map): add lazy Leaflet loader, themed tiles, pins and mini map island

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Ficha de grupo (ES/EN) con contacto, JSON-LD y e2e

**Files:**

- Create: `src/lib/jsonld.ts`, `src/components/RamaChip.astro`, `src/components/ContactActions.astro`, `src/components/GroupDetail.astro`, `src/views/GroupPage.astro`, `src/pages/grupos/[slug].astro`, `src/pages/en/groups/[slug].astro`, `playwright.config.ts`
- Test: `tests/unit/jsonld.test.ts`, `tests/e2e/grupo.spec.ts`

**Interfaces:**

- Consumes: `grupos` (Task 6), `Grupo` (Task 3), `RAMAS`, `ramaLabel` (Task 2), `formatReunion` (Task 5), contacto (Task 5), `translator`, `grupoPath`, `pagePath`, `formatMonth` (Task 7), `Base.astro` (Task 8), `MiniMap` (Task 9), `REGION` (Task 2).
- Produces:
  - `buildGrupoJsonLd(g: Grupo, url: string): Record<string, unknown>`
  - `<RamaChip id={RamaId} lang={Lang} showAge?={boolean} />`
  - `playwright.config.ts` con proyectos `mobile` (Pixel 7) y `desktop` (Desktop Chrome) y `webServer` que hace build + preview en el puerto 4321.

- [ ] **Step 1: Test unitario de JSON-LD que falla**

`tests/unit/jsonld.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { grupos } from "@/data/grupos";
import { buildGrupoJsonLd } from "@/lib/jsonld";

describe("buildGrupoJsonLd", () => {
  it("describe el grupo como organización con dirección y geo", () => {
    const g = grupos.find((x) => x.id === 815);
    if (!g) throw new Error("falta el grupo 815");
    const ld = buildGrupoJsonLd(
      g,
      "https://buscador.vallescout.org.co/grupos/815-fenix-escarlata/",
    );
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Grupo Scout 815 Fénix Escarlata",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Cali",
        addressRegion: "Valle del Cauca",
        addressCountry: "CO",
      },
      geo: { "@type": "GeoCoordinates", latitude: 3.493053, longitude: -76.520585 },
      parentOrganization: { name: "Asociación Scouts de Colombia" },
    });
    expect(ld["sameAs"]).toEqual(["https://www.instagram.com/fenix_escarlata_815"]);
  });
});
```

Run: `npx vitest run tests/unit/jsonld.test.ts` · Expected: FAIL.

- [ ] **Step 2: Implementar `src/lib/jsonld.ts`**

```ts
import type { Grupo } from "@/data/schema";
import { REGION } from "@/data/region";

export function buildGrupoJsonLd(g: Grupo, url: string): Record<string, unknown> {
  const sameAs = [g.contacto.instagram, g.contacto.facebook, g.contacto.web].filter(
    (x): x is string => x !== null,
  );
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: `Grupo Scout ${g.id} ${g.nombre}`,
    url,
    ...(g.contacto.email ? { email: g.contacto.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: g.direccion,
      addressLocality: g.localidad ?? g.municipio,
      addressRegion: "Valle del Cauca",
      addressCountry: "CO",
    },
    geo: { "@type": "GeoCoordinates", latitude: g.ubicacion.lat, longitude: g.ubicacion.lng },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    parentOrganization: {
      "@type": "Organization",
      name: "Asociación Scouts de Colombia",
      url: REGION.nacional,
    },
  };
}
```

Run: `npx vitest run tests/unit/jsonld.test.ts` · Expected: PASS.

- [ ] **Step 3: Componentes**

`src/components/RamaChip.astro`:

```astro
---
import { RAMAS, ramaLabel, type RamaId } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import { translator } from "@/i18n/ui";

interface Props {
  id: RamaId;
  lang: Lang;
  showAge?: boolean;
}
const { id, lang, showAge = false } = Astro.props;
const t = translator(lang);
const rama = RAMAS[id];
---

<span class="rama-chip" data-rama={id}>
  {ramaLabel(id, lang)}
  {showAge && (
    <span class="font-normal opacity-80">
      · {t("finder.ramaAge", { min: rama.edadMin, max: rama.edadMax })}
    </span>
  )}
</span>
```

`src/components/ContactActions.astro`:

```astro
---
import type { Grupo } from "@/data/schema";
import { REGION } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import { translator } from "@/i18n/ui";
import { directionsUrl, mailtoUrl, wazeUrl, whatsappUrl } from "@/lib/contact";

interface Props {
  grupo: Grupo;
  lang: Lang;
}
const { grupo, lang } = Astro.props;
const t = translator(lang);
const vars = { id: grupo.id, nombre: grupo.nombre };
const { email, whatsapp, instagram, facebook, web } = grupo.contacto;
const hasDirectContact = Boolean(whatsapp || email || instagram || facebook || web);
const primary = "flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold";
const secondary = `${primary} border border-line bg-surface hover:bg-brand-soft`;
---

<div class="grid gap-3">
  {whatsapp && (
    <a
      class={`${primary} bg-whatsapp text-white dark:text-canvas`}
      href={whatsappUrl(whatsapp, t("grupo.whatsappMsg", vars))}
      target="_blank"
      rel="noopener noreferrer"
      data-action="whatsapp"
    >
      {t("grupo.whatsapp")}
    </a>
  )}
  {email && (
    <a
      class={`${primary} bg-brand text-on-brand`}
      href={mailtoUrl(email, t("grupo.emailSubject", vars))}
      data-action="email"
    >
      {t("grupo.email")}
    </a>
  )}
  {!hasDirectContact && (
    <p class="rounded-xl bg-brand-soft p-4 text-sm">
      {t("grupo.noContact")}{" "}
      <a class="font-semibold underline" href={REGION.web} data-action="region">
        {t("grupo.contactRegion")}
      </a>
    </p>
  )}
  <div class="grid grid-cols-2 gap-3">
    <a
      class={secondary}
      href={directionsUrl(grupo.ubicacion)}
      target="_blank"
      rel="noopener noreferrer"
      data-action="directions"
    >
      {t("grupo.directions")}
    </a>
    <a
      class={secondary}
      href={wazeUrl(grupo.ubicacion)}
      target="_blank"
      rel="noopener noreferrer"
      data-action="waze"
    >
      {t("grupo.waze")}
    </a>
  </div>
  {(instagram || facebook || web) && (
    <ul class="flex flex-wrap gap-2">
      {instagram && (
        <li>
          <a
            class={secondary}
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            data-action="instagram"
          >
            {t("grupo.instagram")}
          </a>
        </li>
      )}
      {facebook && (
        <li>
          <a
            class={secondary}
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            data-action="facebook"
          >
            {t("grupo.facebook")}
          </a>
        </li>
      )}
      {web && (
        <li>
          <a
            class={secondary}
            href={web}
            target="_blank"
            rel="noopener noreferrer"
            data-action="web"
          >
            {t("grupo.web")}
          </a>
        </li>
      )}
    </ul>
  )}
</div>
```

`src/components/GroupDetail.astro`:

```astro
---
import ContactActions from "@/components/ContactActions.astro";
import MiniMap from "@/components/map/MiniMap";
import RamaChip from "@/components/RamaChip.astro";
import type { Grupo } from "@/data/schema";
import { formatMonth } from "@/i18n/format";
import type { Lang } from "@/i18n/lang";
import { pagePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";
import { directionsUrl } from "@/lib/contact";
import { formatReunion } from "@/lib/schedule";

interface Props {
  grupo: Grupo;
  lang: Lang;
}
const { grupo, lang } = Astro.props;
const t = translator(lang);
const lugar = grupo.localidad ? `${grupo.localidad}, ${grupo.municipio}` : grupo.municipio;
---

<article class="grid gap-8 md:grid-cols-[1fr_20rem]">
  <div class="grid content-start gap-6">
    <a href={pagePath(lang, "home")} class="text-sm font-semibold text-brand hover:underline">
      ← {t("grupo.back")}
    </a>
    <header>
      <p class="text-sm font-semibold tracking-wide text-ink-soft uppercase">
        {t("grupo.number", { id: grupo.id })} · {lugar}
      </p>
      <h1 class="mt-1 text-4xl font-extrabold text-balance text-brand">{grupo.nombre}</h1>
    </header>
    <dl class="grid gap-4">
      <div>
        <dt class="text-sm font-semibold text-ink-soft">{t("grupo.meets")}</dt>
        <dd class="text-lg tabular-nums">{formatReunion(grupo.reunion, lang)}</dd>
      </div>
      <div>
        <dt class="text-sm font-semibold text-ink-soft">{t("grupo.address")}</dt>
        <dd class="text-lg">{grupo.direccion}</dd>
      </div>
      <div>
        <dt class="text-sm font-semibold text-ink-soft">{t("grupo.ramas")}</dt>
        <dd class="mt-2 flex flex-wrap gap-2">
          {grupo.ramas.map((id) => (
            <RamaChip id={id} lang={lang} showAge />
          ))}
        </dd>
      </div>
    </dl>
    <MiniMap
      client:visible
      lat={grupo.ubicacion.lat}
      lng={grupo.ubicacion.lng}
      label={t("grupo.mapLabel", { id: grupo.id, nombre: grupo.nombre })}
      errorText={t("map.error")}
      fallbackHref={directionsUrl(grupo.ubicacion)}
      fallbackText={t("grupo.directions")}
    />
  </div>
  <aside class="grid content-start gap-4">
    <h2 class="text-lg font-bold">{t("grupo.contact")}</h2>
    <ContactActions grupo={grupo} lang={lang} />
    <p class="text-xs text-ink-soft">
      {t("grupo.updated", { fecha: formatMonth(grupo.actualizado, lang) })}
    </p>
  </aside>
</article>
```

`src/views/GroupPage.astro`:

```astro
---
import GroupDetail from "@/components/GroupDetail.astro";
import type { Grupo } from "@/data/schema";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";
import Base from "@/layouts/Base.astro";
import { buildGrupoJsonLd } from "@/lib/jsonld";
import { grupoSlug } from "@/lib/slug";

interface Props {
  grupo: Grupo;
  lang: Lang;
}
const { grupo, lang } = Astro.props;
const t = translator(lang);
const path = grupoPath(lang, grupo);
const vars = { id: grupo.id, nombre: grupo.nombre, municipio: grupo.municipio };
const site = Astro.site ?? new URL("https://buscador.vallescout.org.co");
---

<Base
  lang={lang}
  path={path}
  title={t("grupo.metaTitle", vars)}
  description={t("grupo.metaDescription", vars)}
  ogImage={`/og/${grupoSlug(grupo)}.png`}
  jsonLd={buildGrupoJsonLd(grupo, new URL(path, site).href)}
>
  <GroupDetail grupo={grupo} lang={lang} />
</Base>
```

`src/pages/grupos/[slug].astro`:

```astro
---
import type { GetStaticPaths } from "astro";
import { grupos } from "@/data/grupos";
import { grupoSlug } from "@/lib/slug";
import GroupPage from "@/views/GroupPage.astro";

export const getStaticPaths = (() =>
  grupos.map((grupo) => ({
    params: { slug: grupoSlug(grupo) },
    props: { grupo },
  }))) satisfies GetStaticPaths;

const { grupo } = Astro.props;
---

<GroupPage grupo={grupo} lang="es" />
```

`src/pages/en/groups/[slug].astro`: mismo contenido, cambiando `lang="es"` por `lang="en"`.

- [ ] **Step 4: Configurar Playwright y escribir el e2e de la ficha**

```bash
npx playwright install chromium
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
  },
});
```

Vitest no toca `tests/e2e/`, porque su `include` es `tests/unit/**`.

`tests/e2e/grupo.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("ficha de grupo", () => {
  test("muestra datos y acciones de contacto del grupo 815", async ({ page }) => {
    await page.goto("/grupos/815-fenix-escarlata/");
    await expect(page.getByRole("heading", { level: 1, name: "Fénix Escarlata" })).toBeVisible();
    await expect(page.getByText("Sábados, 2:00 p. m. – 6:00 p. m.")).toBeVisible();
    await expect(page.locator('[data-action="email"]')).toHaveAttribute(
      "href",
      /^mailto:valle\.grupo815@scout\.org\.co\?subject=/,
    );
    await expect(page.locator('[data-action="directions"]')).toHaveAttribute(
      "href",
      /destination=3\.493053/,
    );
    await expect(page.locator('[data-action="instagram"]')).toHaveAttribute(
      "href",
      "https://www.instagram.com/fenix_escarlata_815",
    );
  });

  test("no muestra botones vacíos cuando falta un canal", async ({ page }) => {
    await page.goto("/grupos/815-fenix-escarlata/");
    await expect(page.locator('[data-action="whatsapp"]')).toHaveCount(0);
    await expect(page.locator('[data-action="facebook"]')).toHaveCount(0);
    for (const link of await page.locator("a[href]").all()) {
      expect(await link.getAttribute("href")).not.toBe("");
    }
  });

  test("grupo sin canales directos ofrece contactar a la Región", async ({ page }) => {
    await page.goto("/grupos/816-san-luis-gonzaga/");
    await expect(page.locator('[data-action="region"]')).toHaveAttribute(
      "href",
      "https://vallescout.org.co/",
    );
  });

  test("versión en inglés", async ({ page }) => {
    await page.goto("/en/groups/815-fenix-escarlata/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Saturdays, 2:00 PM – 6:00 PM")).toBeVisible();
    await expect(page.getByText("Nómadas Scout · Venturers")).toBeVisible();
  });

  test("carga el mini mapa", async ({ page }) => {
    await page.goto("/grupos/815-fenix-escarlata/");
    await page.getByRole("img", { name: /Ubicación del Grupo 815/ }).scrollIntoViewIfNeeded();
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });
});
```

- [ ] **Step 5: Correr todo**

```bash
npx vitest run && npm run check && npm run lint
ls dist/grupos | wc -l      # 22
ls dist/en/groups | wc -l   # 22
npm run test:e2e -- tests/e2e/grupo.spec.ts
```

Expected: todo PASS en `mobile` y `desktop`. El grupo 816 no tiene correo institucional ni redes, así que debe mostrar el enlace a la Región; si los datos cambian, usa otro id sin canales.

- [ ] **Step 6: Commit**

```bash
git add -A src tests playwright.config.ts
git commit -m "feat(grupo): add bilingual group pages with contact actions, JSON-LD and e2e tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Buscador (isla Preact): lista, filtros, URL y "cerca de mí"

**Files:**

- Create: `src/components/finder/Finder.tsx`, `src/components/finder/Filters.tsx`, `src/components/finder/GroupList.tsx`, `src/components/finder/GroupCard.tsx`, `src/views/HomePage.astro`, `src/pages/en/index.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/finder.spec.ts`

**Interfaces:**

- Consumes: `grupos`, `municipiosConGrupos` (Task 6); `buscar`, `EMPTY_FILTERS`, `hasActiveFilters`, `Filters`, `Resultado` (Task 6); `parseFilters`, `serializeFilters` (Task 6); `translator`, `grupoPath` (Task 7); `RAMAS`, `RAMA_IDS`, `ramaLabel` (Task 2); `formatReunion` (Task 5); `formatDistance` (Task 5); `whatsappUrl` (Task 5); `REGION` (Task 2).
- Produces:
  - `<Finder grupos lang municipios client:load />` con props `{ grupos: Grupo[]; lang: Lang; municipios: { slug: string; nombre: string }[] }`.
  - Estado interno que Task 12 extiende: `activeId: number | null`, `setActive(id: number | null, source: "list" | "map")`, `origin: LatLng | null`, `results: Resultado[]`.
  - Atributos DOM para tests: cada tarjeta `li[data-grupo-id]` con `data-active="true"` cuando está activa; contador `[data-count]`.

- [ ] **Step 1: e2e que falla**

`tests/e2e/finder.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const cards = (page: import("@playwright/test").Page) => page.locator("li[data-grupo-id]");

test.describe("buscador", () => {
  test("lista los 22 grupos sin filtros", async ({ page }) => {
    await page.goto("/");
    await expect(cards(page)).toHaveCount(22);
    await expect(page.locator("[data-count]")).toHaveText("22 grupos");
  });

  test("busca sin tildes y actualiza la URL", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Buscar grupo").fill("fenix");
    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/\?q=fenix$/);
  });

  test("filtra por municipio y ramas; el estado sobrevive a recargar", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Municipio").selectOption("palmira");
    await page.getByRole("button", { name: /Rovers/ }).click();
    const n = await cards(page).count();
    expect(n).toBeGreaterThan(0);
    await page.reload();
    await expect(cards(page)).toHaveCount(n);
    await expect(page.getByLabel("Municipio")).toHaveValue("palmira");
    await expect(page.getByRole("button", { name: /Rovers/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("ignora parámetros inválidos y no inyecta HTML", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto("/?municipio=bogota&rama=foo&q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E");
    await expect(page.getByLabel("Buscar grupo")).toHaveValue("<img src=x onerror=alert(1)>");
    await expect(page.locator("img[src='x']")).toHaveCount(0);
    await expect(page.getByLabel("Municipio")).toHaveValue("");
    expect(errores).toEqual([]);
  });

  test("estado vacío con acción de limpiar", async ({ page }) => {
    await page.goto("/?q=zzzz");
    await expect(page.getByText("No encontramos grupos con esos filtros")).toBeVisible();
    await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
    await expect(cards(page)).toHaveCount(22);
    await expect(page).toHaveURL(/\/$/);
  });

  test("cerca de mí ordena por distancia cuando hay permiso", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 3.9, longitude: -76.3 }); // Buga
    await page.goto("/");
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await expect(cards(page).first()).toHaveAttribute("data-grupo-id", "315");
    await expect(cards(page).first()).toContainText(/\d+(,\d)? (k)?m/);
  });

  test("cerca de mí sin permiso muestra aviso y conserva el orden", async ({ page, context }) => {
    await context.clearPermissions();
    await page.goto("/");
    const primero = await cards(page).first().getAttribute("data-grupo-id");
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await expect(page.getByText("No pudimos obtener tu ubicación")).toBeVisible();
    await expect(cards(page).first()).toHaveAttribute("data-grupo-id", primero ?? "");
  });

  test("la tarjeta lleva a la ficha del grupo", async ({ page }) => {
    await page.goto("/?q=815");
    await page.getByRole("link", { name: "Fénix Escarlata" }).click();
    await expect(page).toHaveURL(/\/grupos\/815-fenix-escarlata\/$/);
  });

  test("portada en inglés", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("[data-count]")).toHaveText("22 groups");
    await expect(page.getByRole("link", { name: "Fénix Escarlata" })).toHaveAttribute(
      "href",
      "/en/groups/815-fenix-escarlata/",
    );
  });
});
```

Run: `npm run test:e2e -- tests/e2e/finder.spec.ts` · Expected: FAIL (la portada no tiene buscador).

- [ ] **Step 2: `GroupCard.tsx`**

```tsx
import { ramaLabel } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import type { Translate } from "@/i18n/ui";
import { whatsappUrl } from "@/lib/contact";
import { formatDistance } from "@/lib/geo";
import { formatReunion } from "@/lib/schedule";
import type { Resultado } from "@/lib/search";

interface Props {
  resultado: Resultado;
  lang: Lang;
  t: Translate;
  active: boolean;
  onActivate: (id: number | null) => void;
}

export default function GroupCard({ resultado, lang, t, active, onActivate }: Props) {
  const { grupo, distanciaKm } = resultado;
  const lugar = grupo.localidad ? `${grupo.localidad}, ${grupo.municipio}` : grupo.municipio;
  const { whatsapp } = grupo.contacto;

  return (
    <li
      data-grupo-id={grupo.id}
      data-active={active ? "true" : undefined}
      class="group relative rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md data-[active=true]:border-brand data-[active=true]:shadow-md"
      onMouseEnter={() => onActivate(grupo.id)}
      onMouseLeave={() => onActivate(null)}
      onFocusCapture={() => onActivate(grupo.id)}
    >
      <p class="text-xs font-semibold tracking-wide text-ink-soft uppercase">
        {t("grupo.number", { id: grupo.id })} · {lugar}
        {distanciaKm !== null && (
          <span class="ml-1 normal-case tabular-nums">
            · {t("card.distance", { d: formatDistance(distanciaKm, lang) })}
          </span>
        )}
      </p>
      <h3 class="mt-1 text-lg font-bold">
        <a
          href={grupoPath(lang, grupo)}
          class="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none group-focus-within:underline"
        >
          {grupo.nombre}
        </a>
      </h3>
      <p class="mt-1 text-sm text-ink-soft tabular-nums">{formatReunion(grupo.reunion, lang)}</p>
      <ul class="mt-3 flex flex-wrap gap-1.5">
        {grupo.ramas.map((id) => (
          <li key={id} class="rama-chip" data-rama={id}>
            {ramaLabel(id, lang)}
          </li>
        ))}
      </ul>
      {whatsapp && (
        <a
          href={whatsappUrl(
            whatsapp,
            t("grupo.whatsappMsg", { id: grupo.id, nombre: grupo.nombre }),
          )}
          target="_blank"
          rel="noopener noreferrer"
          class="relative z-10 mt-3 inline-flex rounded-full bg-whatsapp px-3 py-1.5 text-sm font-semibold text-white dark:text-canvas"
          aria-label={t("card.whatsapp", { nombre: grupo.nombre })}
        >
          WhatsApp
        </a>
      )}
    </li>
  );
}
```

- [ ] **Step 3: `Filters.tsx`**

```tsx
import { RAMA_IDS, RAMAS, ramaLabel, type RamaId } from "@/data/ramas";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Filters as FilterState } from "@/lib/search";

export type GeoStatus = "idle" | "locating" | "ok" | "error";

interface Props {
  lang: Lang;
  t: Translate;
  filters: FilterState;
  municipios: { slug: string; nombre: string }[];
  geoStatus: GeoStatus;
  canClear: boolean;
  onChange: (next: FilterState) => void;
  onNearMe: () => void;
  onClear: () => void;
}

export default function Filters({
  lang,
  t,
  filters,
  municipios,
  geoStatus,
  canClear,
  onChange,
  onNearMe,
  onClear,
}: Props) {
  const toggleRama = (id: RamaId) =>
    onChange({
      ...filters,
      ramas: filters.ramas.includes(id)
        ? filters.ramas.filter((r) => r !== id)
        : RAMA_IDS.filter((r) => r === id || filters.ramas.includes(r)),
    });

  return (
    <div class="grid gap-3" role="search">
      <label class="grid gap-1">
        <span class="text-sm font-semibold">{t("finder.searchLabel")}</span>
        <input
          type="search"
          value={filters.q}
          maxLength={100}
          placeholder={t("finder.searchPlaceholder")}
          onInput={(e) => onChange({ ...filters, q: e.currentTarget.value })}
          class="h-12 rounded-xl border border-line bg-surface px-4 text-base placeholder:text-ink-soft"
        />
      </label>
      <div class="flex flex-wrap items-end gap-2">
        <label class="grid flex-1 gap-1">
          <span class="text-sm font-semibold">{t("finder.municipio")}</span>
          <select
            value={filters.municipio ?? ""}
            onChange={(e) => onChange({ ...filters, municipio: e.currentTarget.value || null })}
            class="h-11 rounded-xl border border-line bg-surface px-3"
          >
            <option value="">{t("finder.allMunicipios")}</option>
            {municipios.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onNearMe}
          aria-pressed={geoStatus === "ok"}
          disabled={geoStatus === "locating"}
          class="h-11 rounded-xl border border-line bg-surface px-4 font-semibold aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-on-brand disabled:opacity-60"
        >
          {geoStatus === "locating" ? t("finder.locating") : t("finder.nearMe")}
        </button>
      </div>
      <fieldset class="grid gap-2">
        <legend class="text-sm font-semibold">{t("finder.ramas")}</legend>
        <div class="flex flex-wrap gap-2">
          {RAMA_IDS.map((id) => (
            <button
              key={id}
              type="button"
              data-rama={id}
              aria-pressed={filters.ramas.includes(id)}
              onClick={() => toggleRama(id)}
              class="rama-chip border-2 border-transparent py-1 aria-pressed:border-[var(--rama)]"
            >
              {ramaLabel(id, lang)}
              <span class="font-normal opacity-80">
                {t("finder.ramaAge", { min: RAMAS[id].edadMin, max: RAMAS[id].edadMax })}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      {geoStatus === "error" && (
        <p role="status" class="rounded-xl bg-brand-soft px-3 py-2 text-sm">
          {t("finder.geoError")}
        </p>
      )}
      {canClear && (
        <button
          type="button"
          onClick={onClear}
          class="justify-self-start text-sm font-semibold text-brand underline"
        >
          {t("finder.clear")}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `GroupList.tsx`**

```tsx
import { REGION } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import type { Translate } from "@/i18n/ui";
import type { Resultado } from "@/lib/search";
import GroupCard from "@/components/finder/GroupCard";

interface Props {
  lang: Lang;
  t: Translate;
  results: Resultado[];
  activeId: number | null;
  onActivate: (id: number | null) => void;
  onClear: () => void;
}

export default function GroupList({ lang, t, results, activeId, onActivate, onClear }: Props) {
  const count =
    results.length === 1 ? t("finder.count.one") : t("finder.count.other", { n: results.length });
  return (
    <section class="grid gap-3">
      <p data-count aria-live="polite" class="text-sm font-semibold text-ink-soft">
        {count}
      </p>
      {results.length === 0 ? (
        <div class="rounded-2xl border border-dashed border-line p-6 text-center">
          <p class="font-bold">{t("finder.empty.title")}</p>
          <p class="mt-1 text-sm text-ink-soft">{t("finder.empty.body")}</p>
          <div class="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onClear}
              class="rounded-xl bg-brand px-4 py-2 font-semibold text-on-brand"
            >
              {t("finder.clear")}
            </button>
            <a href={REGION.web} class="rounded-xl border border-line px-4 py-2 font-semibold">
              {t("finder.empty.contact")}
            </a>
          </div>
        </div>
      ) : (
        <ul class="grid gap-3">
          {results.map((r) => (
            <GroupCard
              key={r.grupo.id}
              resultado={r}
              lang={lang}
              t={t}
              active={r.grupo.id === activeId}
              onActivate={onActivate}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 5: `Finder.tsx`**

```tsx
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
```

- [ ] **Step 6: Vista y páginas**

`src/views/HomePage.astro`:

```astro
---
import Finder from "@/components/finder/Finder";
import { grupos, municipiosConGrupos } from "@/data/grupos";
import type { Lang } from "@/i18n/lang";
import { pagePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";
import Base from "@/layouts/Base.astro";

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = translator(lang);
---

<Base
  lang={lang}
  path={pagePath(lang, "home")}
  title={t("site.title")}
  description={t("site.description")}
  fullBleed
>
  <div class="mx-auto w-full max-w-7xl px-4 pt-6 pb-4">
    <h1 class="text-3xl font-extrabold text-balance text-brand sm:text-4xl">
      {t("finder.heading")}
    </h1>
    <p class="mt-2 text-ink-soft">{t("finder.lead", { n: grupos.length })}</p>
  </div>
  <div class="mx-auto w-full max-w-7xl px-4 pb-10">
    <Finder client:load grupos={[...grupos]} lang={lang} municipios={municipiosConGrupos} />
  </div>
</Base>
```

`src/pages/index.astro`:

```astro
---
import HomePage from "@/views/HomePage.astro";
---

<HomePage lang="es" />
```

`src/pages/en/index.astro`: igual, con `lang="en"`.

- [ ] **Step 7: Correr pruebas**

Run: `npm run check && npm run lint && npm run test:e2e -- tests/e2e/finder.spec.ts tests/e2e/grupo.spec.ts`
Expected: PASS en ambos proyectos.

- [ ] **Step 8: Commit**

```bash
git add -A src tests
git commit -m "feat(finder): add search island with filters, URL state and near-me sorting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Mapa del buscador sincronizado con la lista

**Files:**

- Create: `src/components/finder/GroupMap.tsx`, `src/components/finder/useMediaQuery.ts`
- Modify: `src/components/finder/Finder.tsx`, `src/components/finder/GroupList.tsx`
- Test: `tests/e2e/map.spec.ts`

**Interfaces:**

- Consumes: `loadLeaflet`, `addThemedTiles`, `pinIcon`, `clusterIcon` (Task 9); `Resultado` (Task 6); `VALLE_CENTER`, `VALLE_ZOOM` (Task 2); `grupoPath` (Task 7).
- Produces: `<GroupMap results activeId origin lang t visible onSelect />`; `useMediaQuery(query: string): boolean`. En `GroupList`, nueva prop `scrollToId: number | null`.

- [ ] **Step 1: e2e que falla**

`tests/e2e/map.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("mapa del buscador", () => {
  test("en escritorio el mapa se muestra junto a la lista", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await page.goto("/");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator(".pin, .marker-cluster-brand").first()).toBeVisible();
  });

  test("filtrar por municipio deja solo sus pines", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await page.goto("/?municipio=buga");
    await expect(page.locator(".leaflet-marker-pane .pin")).toHaveCount(1);
  });

  test("clic en un pin resalta su tarjeta", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await page.goto("/?municipio=buga");
    await page.locator(".leaflet-marker-pane .pin").click();
    await expect(page.locator('li[data-grupo-id="315"]')).toHaveAttribute("data-active", "true");
  });

  test("en móvil el mapa se abre con el botón y no carga antes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await page.goto("/");
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await page.getByRole("button", { name: "Ver lista" }).click();
    await expect(page.locator("li[data-grupo-id]").first()).toBeVisible();
  });

  test("si Leaflet no carga, la lista sigue funcionando y se avisa", async ({ page, isMobile }) => {
    await page.route(/leaflet/i, (route) => route.abort());
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(page.getByText("No se pudo cargar el mapa")).toBeVisible();
    if (isMobile) await page.getByRole("button", { name: "Ver lista" }).click();
    await page.getByLabel("Buscar grupo").fill("fenix");
    await expect(page.locator("li[data-grupo-id]")).toHaveCount(1);
  });
});
```

Run: `npm run test:e2e -- tests/e2e/map.spec.ts` · Expected: FAIL.

Si `page.route(/leaflet/i)` no intercepta porque el chunk de Vite tiene otro nombre, revisa `ls dist/_astro | grep -i leaflet`. Si hace falta, fija el nombre del chunk en `astro.config.mjs` con `vite.build.rollupOptions.output.manualChunks: (id) => (id.includes("leaflet") ? "leaflet" : undefined)`.

- [ ] **Step 2: `useMediaQuery.ts`**

```ts
import { useEffect, useState } from "preact/hooks";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
```

- [ ] **Step 3: `GroupMap.tsx`**

```tsx
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "preact/hooks";
import { addThemedTiles, clusterIcon, loadLeaflet, pinIcon } from "@/components/map/leaflet";
import { VALLE_CENTER, VALLE_ZOOM } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import { grupoPath } from "@/i18n/routes";
import type { Translate } from "@/i18n/ui";
import type { LatLng } from "@/lib/geo";
import type { Resultado } from "@/lib/search";

interface Props {
  results: Resultado[];
  activeId: number | null;
  origin: LatLng | null;
  lang: Lang;
  t: Translate;
  visible: boolean;
  onSelect: (id: number) => void;
}

type L = typeof Leaflet;

export default function GroupMap({ results, activeId, origin, lang, t, visible, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<L | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const cluster = useRef<Leaflet.MarkerClusterGroup | null>(null);
  const markers = useRef(new Map<number, Leaflet.Marker>());
  const youMarker = useRef<Leaflet.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Crear el mapa una sola vez.
  useEffect(() => {
    let stopTiles: (() => void) | undefined;
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !container.current) return;
        leaflet.current = L;
        const m = L.map(container.current, {
          center: [VALLE_CENTER.lat, VALLE_CENTER.lng],
          zoom: VALLE_ZOOM,
        });
        stopTiles = addThemedTiles(L, m);
        cluster.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 40,
          iconCreateFunction: (c) => clusterIcon(L, c.getChildCount()),
        }).addTo(m);
        map.current = m;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      stopTiles?.();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Redibujar marcadores cuando cambian los resultados.
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    const group = cluster.current;
    if (!ready || !L || !m || !group) return;

    group.clearLayers();
    markers.current.clear();
    for (const { grupo } of results) {
      const marker = L.marker([grupo.ubicacion.lat, grupo.ubicacion.lng], {
        icon: pinIcon(L),
        title: grupo.nombre,
      });
      const popup = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = grupo.nombre;
      const link = document.createElement("a");
      link.href = grupoPath(lang, grupo);
      link.textContent = t("grupo.number", { id: grupo.id });
      popup.append(strong, document.createElement("br"), link);
      marker.bindPopup(popup);
      marker.on("click", () => onSelectRef.current(grupo.id));
      markers.current.set(grupo.id, marker);
      group.addLayer(marker);
    }

    if (results.length > 0) {
      const bounds = L.latLngBounds(
        results.map(({ grupo }) => [grupo.ubicacion.lat, grupo.ubicacion.lng]),
      );
      if (origin) bounds.extend([origin.lat, origin.lng]);
      m.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [ready, results, origin, lang, t]);

  // Marcador "tu ubicación".
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    if (!ready || !L || !m) return;
    youMarker.current?.remove();
    youMarker.current = origin
      ? L.marker([origin.lat, origin.lng], {
          icon: pinIcon(L, "you"),
          title: t("map.you"),
          keyboard: false,
        }).addTo(m)
      : null;
  }, [ready, origin, t]);

  // Resaltar el pin activo.
  useEffect(() => {
    const L = leaflet.current;
    if (!ready || !L) return;
    for (const [id, marker] of markers.current) {
      marker.setIcon(pinIcon(L, id === activeId ? "active" : "default"));
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    }
  }, [ready, activeId, results]);

  // Leaflet necesita recalcular tamaño cuando el contenedor deja de estar oculto.
  useEffect(() => {
    if (visible) map.current?.invalidateSize();
  }, [visible]);

  if (failed) {
    return (
      <div
        class="grid h-full place-items-center rounded-2xl border border-line bg-brand-soft p-6 text-center"
        data-map-error
      >
        <p>
          {t("map.error")}{" "}
          <a
            class="font-semibold underline"
            href={`https://www.google.com/maps/@${VALLE_CENTER.lat},${VALLE_CENTER.lng},${VALLE_ZOOM}z`}
          >
            {t("map.openGoogle")}
          </a>
        </p>
      </div>
    );
  }
  return (
    <div
      ref={container}
      role="region"
      aria-label={t("map.label")}
      class="h-full min-h-[60dvh] w-full overflow-hidden rounded-2xl border border-line"
    />
  );
}
```

- [ ] **Step 4: Integrar en `Finder.tsx` y `GroupList.tsx`**

En `Finder.tsx`:

```tsx
// imports adicionales
import GroupMap from "@/components/finder/GroupMap";
import { useMediaQuery } from "@/components/finder/useMediaQuery";

// estado adicional dentro del componente
const isDesktop = useMediaQuery("(min-width: 1024px)");
const [view, setView] = useState<"list" | "map">("list");
const [mapRequested, setMapRequested] = useState(false);
const [scrollToId, setScrollToId] = useState<number | null>(null);
const showMap = isDesktop || view === "map";
useEffect(() => {
  if (showMap) setMapRequested(true);
}, [showMap]);

const selectFromMap = (id: number) => {
  setActiveId(id);
  setScrollToId(id);
};
```

Reemplaza el `return` de `Finder`:

```tsx
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
        onActivate={setActiveId}
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
          onSelect={selectFromMap}
        />
      )}
    </div>
    <button
      type="button"
      onClick={() => setView(view === "list" ? "map" : "list")}
      class="fixed bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand shadow-lg lg:hidden"
    >
      {view === "list" ? t("finder.showMap") : t("finder.showList")}
    </button>
  </div>
);
```

En `GroupList.tsx`, agrega la prop `scrollToId: number | null` a `Props` y al destructuring, y este efecto:

```tsx
import { useEffect } from "preact/hooks";

useEffect(() => {
  if (scrollToId === null) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .querySelector(`li[data-grupo-id="${scrollToId}"]`)
    ?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
}, [scrollToId]);
```

- [ ] **Step 5: Correr pruebas**

Run: `npm run check && npm run lint && npm run test:e2e`
Expected: PASS en `mobile` y `desktop` (las pruebas que no aplican se marcan skipped).

- [ ] **Step 6: Commit**

```bash
git add -A src tests astro.config.mjs
git commit -m "feat(finder): add clustered map synced with results, lazy on mobile, with fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Página "¿Qué es ser scout?" y 404

**Files:**

- Create: `src/components/AboutEs.astro`, `src/components/AboutEn.astro`, `src/views/AboutPage.astro`, `src/pages/que-es-ser-scout.astro`, `src/pages/en/what-is-scouting.astro`, `src/pages/404.astro`
- Test: `tests/e2e/pages.spec.ts`

**Interfaces:**

- Consumes: `Base.astro`, `RamaChip.astro`, `RAMA_IDS`, `RAMAS`, `REGION`, `pagePath`, `translator`.

- [ ] **Step 1: e2e que falla**

`tests/e2e/pages.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("¿Qué es ser scout? lista las cinco ramas con edades oficiales", async ({ page }) => {
  await page.goto("/que-es-ser-scout/");
  await expect(page.getByRole("heading", { level: 1, name: "¿Qué es ser scout?" })).toBeVisible();
  for (const texto of ["Cachorros", "Lobatos", "Scouts", "Nómadas Scout", "Rovers"]) {
    await expect(page.getByRole("heading", { level: 3, name: texto, exact: true })).toBeVisible();
  }
  await expect(page.getByText("15–17 años")).toBeVisible();
});

test("What is Scouting? en inglés", async ({ page }) => {
  await page.goto("/en/what-is-scouting/");
  await expect(page.getByRole("heading", { level: 1, name: "What is Scouting?" })).toBeVisible();
});

test("404 bilingüe con enlace al buscador", async ({ page }) => {
  const res = await page.goto("/no-existe/");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Página no encontrada")).toBeVisible();
  await expect(page.getByText("Page not found")).toBeVisible();
  await page.getByRole("link", { name: "Ir al buscador" }).click();
  await expect(page).toHaveURL(/\/$/);
});
```

Run: `npm run test:e2e -- tests/e2e/pages.spec.ts` · Expected: FAIL.

- [ ] **Step 2: Contenido**

`src/components/AboutEs.astro`:

```astro
---
import RamaChip from "@/components/RamaChip.astro";
import { RAMA_IDS, RAMAS } from "@/data/ramas";
import { REGION } from "@/data/region";
import { pagePath } from "@/i18n/routes";

const descripcion = {
  cachorros: "Descubren el mundo jugando y explorando, acompañados por adultos voluntarios.",
  lobatos: "Viven la aventura en Manada, inspirados en El libro de la selva.",
  scouts: "Aprenden en patrullas, al aire libre, a cuidarse, cuidar a otros y a la naturaleza.",
  nomadas: "Asumen retos personales y desarrollan proyectos con su comunidad.",
  rovers: "Orientan su vida al servicio y construyen su proyecto de vida.",
} as const;
---

<div class="grid gap-8">
  <header class="grid gap-3">
    <h1 class="text-4xl font-extrabold text-brand">¿Qué es ser scout?</h1>
    <p class="text-lg text-ink-soft">
      El Movimiento Scout es un movimiento educativo para niños, niñas y jóvenes. A través del
      juego, la vida al aire libre y el servicio, les ayuda a crecer como personas autónomas,
      solidarias y comprometidas con su comunidad. En Colombia lo lidera la Asociación Scouts de
      Colombia; en el Valle del Cauca, la Región Valle.
    </p>
  </header>
  <section class="grid gap-4">
    <h2 class="text-2xl font-bold">Las ramas por edad</h2>
    <ul class="grid gap-4 sm:grid-cols-2">
      {RAMA_IDS.map((id) => (
        <li class="rounded-2xl border border-line bg-surface p-5">
          <h3 class="text-xl font-bold">{RAMAS[id].nombre}</h3>
          <p class="mt-1">
            <RamaChip id={id} lang="es" showAge />
          </p>
          <p class="mt-3 text-ink-soft">{descripcion[id]}</p>
        </li>
      ))}
    </ul>
    <p class="text-sm text-ink-soft">
      Los adultos también pueden sumarse como voluntarios en los grupos.
    </p>
  </section>
  <section class="grid gap-3">
    <h2 class="text-2xl font-bold">¿Cómo inscribirse?</h2>
    <ol class="grid list-decimal gap-2 pl-6">
      <li>
        Encuentra un grupo cerca de tu casa en el{" "}
        <a class="font-semibold text-brand underline" href={pagePath("es", "home")}>
          buscador
        </a>
        .
      </li>
      <li>Escríbele al grupo y pregunta si puedes asistir a una reunión para conocerlo.</li>
      <li>El grupo te orientará sobre el registro en la Asociación Scouts de Colombia.</li>
    </ol>
  </section>
  <p class="text-sm text-ink-soft">
    Más información en{" "}
    <a class="underline" href={REGION.nacional}>
      scout.org.co
    </a>{" "}
    y
    <a class="underline" href={REGION.web}>
      vallescout.org.co
    </a>
    .
  </p>
</div>
```

`src/components/AboutEn.astro`: misma estructura con este texto:

- h1 "What is Scouting?"
- intro: "Scouting is an educational movement for children and young people. Through play, outdoor life and service, it helps them grow into independent, caring people committed to their community. In Colombia it is led by the Scouts of Colombia Association (Asociación Scouts de Colombia); in Valle del Cauca, by the Valle Region."
- h2 "Sections by age"; descripciones: cachorros "They discover the world through play and exploration, guided by adult volunteers." · lobatos "They live adventures as a Pack, inspired by The Jungle Book." · scouts "They learn outdoors in patrols to look after themselves, others and nature." · nomadas "They take on personal challenges and run projects with their community." · rovers "They focus on service and on building their life plan."
- nota: "Adults can also join groups as volunteers."
- h2 "How to join"; pasos: "Find a group near you with the [finder](/en/)." · "Contact the group and ask whether you can attend a meeting to get to know them." · "The group will guide you through registration with the Scouts of Colombia Association."
- cierre: "More information at scout.org.co and vallescout.org.co (in Spanish)."
- Los `<h3>` muestran `RAMAS[id].nombre` (nombre oficial), y el chip usa `lang="en"`.

`src/views/AboutPage.astro`:

```astro
---
import AboutEn from "@/components/AboutEn.astro";
import AboutEs from "@/components/AboutEs.astro";
import type { Lang } from "@/i18n/lang";
import { pagePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";
import Base from "@/layouts/Base.astro";

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const t = translator(lang);
---

<Base
  lang={lang}
  path={pagePath(lang, "about")}
  title={t("about.metaTitle")}
  description={t("about.metaDescription")}
>
  {lang === "es" ? <AboutEs /> : <AboutEn />}
</Base>
```

`src/pages/que-es-ser-scout.astro` → `<AboutPage lang="es" />`; `src/pages/en/what-is-scouting.astro` → `<AboutPage lang="en" />` (cada uno importando `@/views/AboutPage.astro`).

`src/pages/404.astro`:

```astro
---
import { translator } from "@/i18n/ui";
import Base from "@/layouts/Base.astro";

const es = translator("es");
const en = translator("en");
---

<Base
  lang="es"
  path="/404/"
  title={`${es("notFound.title")} · ${en("notFound.title")}`}
  description={es("notFound.body")}
>
  <div class="grid gap-10 py-10 text-center">
    <section class="grid gap-3">
      <h1 class="text-4xl font-extrabold text-brand">{es("notFound.title")}</h1>
      <p class="text-ink-soft">{es("notFound.body")}</p>
      <a
        href="/"
        class="justify-self-center rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand"
      >
        {es("notFound.cta")}
      </a>
    </section>
    <section class="grid gap-3" lang="en">
      <h2 class="text-2xl font-bold">{en("notFound.title")}</h2>
      <p class="text-ink-soft">{en("notFound.body")}</p>
      <a
        href="/en/"
        class="justify-self-center rounded-xl border border-line px-5 py-3 font-semibold"
      >
        {en("notFound.cta")}
      </a>
    </section>
  </div>
</Base>
```

Agrega `<meta name="robots" content="noindex" />` a la 404: añade la prop opcional `noindex?: boolean` a `Base.astro` (`{noindex && <meta name="robots" content="noindex" />}`) y pásala aquí.

- [ ] **Step 3: Correr pruebas**

Run: `npm run check && npm run lint && npm run test:e2e -- tests/e2e/pages.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A src tests
git commit -m "feat(pages): add 'What is Scouting?' page in both languages and bilingual 404

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: SEO, imágenes OG, CSP y configuración de Vercel

**Files:**

- Create: `src/lib/og.ts`, `src/pages/og/[slug].png.ts`, `public/robots.txt`, `vercel.json`
- Modify: `astro.config.mjs`
- Test: `tests/unit/og.test.ts`

**Interfaces:**

- Consumes: `grupos` (Task 6), `grupoSlug` (Task 5).
- Produces: `renderOg(props: { titulo: string; subtitulo: string }): Promise<Uint8Array>`; rutas `/og/<slug>.png` y `/og/default.png`; `sitemap-index.xml`; meta CSP en cada página.

- [ ] **Step 1: Test que falla**

`tests/unit/og.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderOg } from "@/lib/og";

describe("renderOg", () => {
  it("genera un PNG de 1200×630", async () => {
    const png = await renderOg({ titulo: "Fénix Escarlata", subtitulo: "Grupo 815 · Cali" });
    expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer, png.byteOffset);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  }, 20_000);
});
```

Run: `npx vitest run tests/unit/og.test.ts` · Expected: FAIL.

- [ ] **Step 2: `src/lib/og.ts`**

```ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const root = process.cwd();
const font = (weight: 400 | 800) =>
  readFile(
    join(root, `node_modules/@fontsource/figtree/files/figtree-latin-${weight}-normal.woff`),
  );

let assets: Promise<{ regular: Buffer; bold: Buffer; logo: string }> | null = null;
function loadAssets() {
  assets ??= Promise.all([
    font(400),
    font(800),
    readFile(join(root, "src/assets/logo-region-valle-white.png")),
  ]).then(([regular, bold, logo]) => ({
    regular,
    bold,
    logo: `data:image/png;base64,${logo.toString("base64")}`,
  }));
  return assets;
}

type Node = { type: string; props: Record<string, unknown> };
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra: Record<string, unknown> = {},
): Node => ({
  type,
  props: { style, children, ...extra },
});

export async function renderOg({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo: string;
}): Promise<Uint8Array> {
  const { regular, bold, logo } = await loadAssets();
  const tree = el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px",
      background: "#4d006e",
      color: "#ffffff",
      fontFamily: "Figtree",
    },
    [
      el("img", { height: 96 }, undefined, { src: logo, height: 96 }),
      el("div", { display: "flex", flexDirection: "column", gap: "12px" }, [
        el("div", { fontSize: 36, opacity: 0.85 }, subtitulo),
        el("div", { fontSize: 84, fontWeight: 800, lineHeight: 1.05 }, titulo),
      ]),
      el("div", { fontSize: 28, opacity: 0.85 }, "buscador.vallescout.org.co"),
    ],
  );
  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Figtree", data: regular, weight: 400, style: "normal" },
      { name: "Figtree", data: bold, weight: 800, style: "normal" },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}
```

Si `@fontsource/figtree` no trae el peso 800, usa `700`: revisa con `ls node_modules/@fontsource/figtree/files | grep latin-.00-normal.woff`.

Run: `npx vitest run tests/unit/og.test.ts` · Expected: PASS.

- [ ] **Step 3: Endpoint OG**

`src/pages/og/[slug].png.ts`:

```ts
import type { APIRoute, GetStaticPaths } from "astro";
import { grupos } from "@/data/grupos";
import { renderOg } from "@/lib/og";
import { grupoSlug } from "@/lib/slug";

export const getStaticPaths = (() => [
  {
    params: { slug: "default" },
    props: { titulo: "Encuentra tu grupo scout", subtitulo: "Región Valle del Cauca" },
  },
  ...grupos.map((g) => ({
    params: { slug: grupoSlug(g) },
    props: { titulo: g.nombre, subtitulo: `Grupo ${g.id} · ${g.localidad ?? g.municipio}` },
  })),
]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as { titulo: string; subtitulo: string });
  return new Response(png, { headers: { "Content-Type": "image/png" } });
};
```

- [ ] **Step 4: `astro.config.mjs` final**

```js
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://buscador.vallescout.org.co",
  trailingSlash: "always",
  integrations: [preact(), sitemap({ filter: (page) => !page.includes("/404") })],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://*.basemaps.cartocdn.com",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  vite: { plugins: [tailwindcss()] },
});
```

(Conserva `manualChunks` si se agregó en Task 12.)

`public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://buscador.vallescout.org.co/sitemap-index.xml
```

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "trailingSlash": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(self), camera=(), microphone=(), payment=()"
        }
      ]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

- [ ] **Step 5: Verificar**

```bash
npm run build
ls dist/og | wc -l                                              # 23
file dist/og/815-fenix-escarlata.png                            # PNG image data, 1200 x 630
grep -c '<meta http-equiv="content-security-policy"' dist/index.html   # 1
grep -o '<loc>[^<]*</loc>' dist/sitemap-0.xml | wc -l           # 48 (2 portadas + 2 about + 44 fichas)
npm run test:e2e
```

Expected: todo como se indica y e2e en verde. Abre `dist/og/815-fenix-escarlata.png` y revisa que se vea bien (logo, título y subtítulo legibles).

- [ ] **Step 6: Commit**

```bash
git add -A src public astro.config.mjs vercel.json tests
git commit -m "feat(seo): add OG images, sitemap, robots, CSP and Vercel security headers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Accesibilidad, CSP e idioma en e2e + CI

**Files:**

- Create: `tests/e2e/a11y.spec.ts`, `tests/e2e/csp.spec.ts`, `tests/e2e/i18n.spec.ts`, `.github/workflows/ci.yml`

- [ ] **Step 1: Tests**

`tests/e2e/a11y.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/grupos/815-fenix-escarlata/",
  "/que-es-ser-scout/",
  "/en/",
  "/en/groups/815-fenix-escarlata/",
  "/en/what-is-scouting/",
  "/no-existe/",
];

for (const theme of ["light", "dark"] as const) {
  for (const path of PAGES) {
    test(`sin violaciones serias de accesibilidad: ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const serias = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        serias,
        JSON.stringify(
          serias.map((v) => [v.id, v.nodes.map((n) => n.target)]),
          null,
          2,
        ),
      ).toEqual([]);
    });
  }
}
```

Si una violación viene de internos de Leaflet (p. ej. `.leaflet-control-attribution`), exclúyela con `.exclude(".leaflet-control-attribution")` y un comentario que explique por qué. Las violaciones de **nuestro** código se corrigen en los componentes o tokens, no se excluyen.

`tests/e2e/csp.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

for (const path of ["/", "/grupos/815-fenix-escarlata/", "/que-es-ser-scout/", "/en/"]) {
  test(`sin violaciones de CSP: ${path}`, async ({ page, isMobile }) => {
    const violaciones: string[] = [];
    page.on("console", (msg) => {
      if (/Content Security Policy|Refused to/i.test(msg.text())) violaciones.push(msg.text());
    });
    await page.goto(path);
    if (isMobile && path.endsWith("/") && !path.includes("grupos")) {
      const btn = page.getByRole("button", { name: /Ver mapa|Show map/ });
      if (await btn.count()) await btn.click();
    }
    await page.waitForLoadState("networkidle");
    expect(violaciones).toEqual([]);
  });
}
```

`tests/e2e/i18n.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("el cambio de idioma conserva la página", async ({ page }) => {
  await page.goto("/grupos/815-fenix-escarlata/");
  await page.getByRole("link", { name: "Ver esta página en inglés" }).click();
  await expect(page).toHaveURL(/\/en\/groups\/815-fenix-escarlata\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "View this page in Spanish" }).click();
  await expect(page).toHaveURL(/\/grupos\/815-fenix-escarlata\/$/);
});

test("hreflang y canonical correctos", async ({ page }) => {
  await page.goto("/en/what-is-scouting/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://buscador.vallescout.org.co/en/what-is-scouting/",
  );
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
    "href",
    "https://buscador.vallescout.org.co/que-es-ser-scout/",
  );
});

test("el tema elegido persiste al recargar", async ({ page }) => {
  await page.goto("/");
  const inicial = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: "Cambiar entre tema claro y oscuro" }).click();
  await page.reload();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", inicial ?? "");
});
```

- [ ] **Step 2: Correr y corregir**

Run: `npm run test:e2e`
Expected: PASS. Si axe reporta contraste insuficiente, ajusta los tokens del tema afectado en `src/styles/global.css` (no bajes el umbral).

- [ ] **Step 3: CI**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run check
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v5
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 7
```

Antes de commitear, confirma con `gh api repos/actions/checkout/releases/latest --jq .tag_name` (y lo mismo para `setup-node` y `upload-artifact`) que esas mayores siguen siendo las vigentes, y súbelas si hay una más nueva.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e .github
git commit -m "test: add accessibility, CSP and i18n e2e checks; add CI workflow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Documentación, licencia y presentación del repo

**Files:**

- Replace: `README.md`, `LICENSE`
- Create: `docs/actualizar-grupos.md`, `docs/screenshot.png`
- Modify: `docs/superpowers/specs/2026-10-07-buscador-refactor-design.md` (solo si algún detalle cambió durante la implementación)

- [ ] **Step 1: Captura**

```bash
npm run build && (npm run preview -- --port 4321 &) && sleep 3
npx playwright screenshot --viewport-size=1280,800 --wait-for-timeout=2500 http://localhost:4321/ docs/screenshot.png
kill %1 2>/dev/null || pkill -f "astro preview"
```

Abre `docs/screenshot.png` y confirma que se ven la lista y el mapa con pines.

- [ ] **Step 2: `LICENSE`**

```
MIT License

Copyright (c) 2025-2026 Jose Uribe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

Trademark notice: The MIT License applies to the source code only. The names,
logos and emblems of the Asociación Scouts de Colombia and its Valle Region,
including the files in src/assets/ and public/favicon.png and
public/apple-touch-icon.png, belong to their respective owners and are not
covered by this license.
```

- [ ] **Step 3: `README.md`**

````markdown
# Buscador de Grupos Scout · Región Valle

[![CI](https://github.com/joseuribeh98/scout-groups-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/joseuribeh98/scout-groups-finder/actions/workflows/ci.yml)

Encuentra el grupo scout más cercano en el Valle del Cauca (Colombia), mira cuándo se reúne y contáctalo.

**→ [buscador.vallescout.org.co](https://buscador.vallescout.org.co)**

![Buscador con lista de grupos y mapa](docs/screenshot.png)

## Qué hace

- Búsqueda por nombre, número, municipio o barrio, sin importar tildes.
- Filtros por municipio y por rama (Cachorros, Lobatos, Scouts, Nómadas Scout, Rovers), con edades oficiales.
- "Cerca de mí": ordena los grupos por distancia.
- Mapa con agrupación de pines, sincronizado con la lista.
- Una ficha por grupo con WhatsApp, correo, cómo llegar y redes, lista para compartir.
- En español e inglés, con tema claro y oscuro, accesible (WCAG 2.2 AA) y usable sin JavaScript.

## Stack

[Astro](https://astro.build) (salida estática) · [Preact](https://preactjs.com) (una isla para el buscador) · TypeScript estricto · Tailwind CSS 4 · Leaflet + OpenStreetMap/CARTO · Zod · Vitest · Playwright + axe · Vercel.

Decisiones de diseño: [`docs/superpowers/specs/2026-10-07-buscador-refactor-design.md`](docs/superpowers/specs/2026-10-07-buscador-refactor-design.md).

## Desarrollo

Requiere Node 22.12 o superior.

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # tests unitarios
npm run test:e2e     # tests end-to-end (instala antes: npx playwright install chromium)
npm run build        # sitio estático en dist/
```

## Actualizar la información de un grupo

Todos los datos están en [`src/data/grupos.json`](src/data/grupos.json). Edita, haz commit y push: CI valida los datos y Vercel publica. Guía paso a paso: [`docs/actualizar-grupos.md`](docs/actualizar-grupos.md).

Por privacidad, el sitio solo publica canales institucionales (correos `@scout.org.co`), redes del grupo y números de WhatsApp autorizados por cada grupo. El esquema rechaza cualquier otro campo.

## English

Scout group finder for the Valle del Cauca region of the Scouts of Colombia Association. Static Astro site with a single Preact island, bilingual (ES/EN), accessible, with validated data and no personal information. See the sections above for commands; group data lives in `src/data/grupos.json`.

## Licencia

Código bajo licencia [MIT](LICENSE). Los nombres, logos y emblemas de Scouts de Colombia y de la Región Valle pertenecen a sus titulares.
````

- [ ] **Step 4: `docs/actualizar-grupos.md`**

````markdown
# Cómo actualizar la información de un grupo

Todos los datos viven en `src/data/grupos.json`. Cada grupo es un objeto así:

```json
{
  "id": 815,
  "nombre": "Fénix Escarlata",
  "municipio": "Cali",
  "localidad": null,
  "direccion": "Parque del Amor. Avenida 6ta con calle 70",
  "ubicacion": { "lat": 3.493053, "lng": -76.520585 },
  "reunion": { "dia": "sabado", "inicio": "14:00", "fin": "18:00" },
  "ramas": ["lobatos", "scouts", "nomadas", "rovers"],
  "contacto": {
    "email": "valle.grupo815@scout.org.co",
    "whatsapp": null,
    "instagram": "https://www.instagram.com/fenix_escarlata_815",
    "facebook": null,
    "web": null
  },
  "actualizado": "2026-10"
}
```

## Reglas

| Campo                            | Formato                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`                             | Número del grupo. Único.                                                                               |
| `municipio`                      | Uno de los 42 municipios del Valle, escrito igual que en `src/data/region.ts`.                         |
| `localidad`                      | Corregimiento o barrio relevante (p. ej. `"Rozo"`), o `null`.                                          |
| `ubicacion`                      | Coordenadas decimales (clic derecho en Google Maps → copiar). Deben caer dentro del Valle.             |
| `reunion.dia`                    | `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado` o `domingo`.                             |
| `reunion.inicio` / `fin`         | Formato 24 h `HH:mm`. `fin` puede ser `null`.                                                          |
| `ramas`                          | Cualquier combinación de `cachorros`, `lobatos`, `scouts`, `nomadas`, `rovers`.                        |
| `contacto.email`                 | Solo correos `@scout.org.co`, o `null`.                                                                |
| `contacto.whatsapp`              | `57` + 10 dígitos, sin `+` ni espacios (p. ej. `"573001234567"`). **Solo con autorización del grupo.** |
| `instagram` / `facebook` / `web` | URL completa con `https://`, o `null`.                                                                 |
| `actualizado`                    | Mes de la última verificación, `YYYY-MM`.                                                              |

No agregues otros campos (nombres de dirigentes, teléfonos personales…): el build los rechaza.

## Pasos

1. Edita `src/data/grupos.json`.
2. Verifica: `npm test && npm run build`.
3. Commit y push a `main` (o abre un PR para ver una vista previa en Vercel).

Si hay un error, el mensaje dice exactamente qué grupo y qué campo corregir:

```
Datos de grupos inválidos (src/data/grupos.json):
  - grupo 815 (Fénix Escarlata): ubicacion.lat: Too big: expected number to be <=5.1
  - grupo 662 (León Blanco): contacto.email: solo se publican correos @scout.org.co
```
````

- [ ] **Step 5: Verificación completa**

```bash
npm run lint && npm run format:check && npm run check && npm test && npm run test:e2e
```

Expected: todo en verde.

- [ ] **Step 6: Commit**

```bash
git add README.md LICENSE docs
git commit -m "docs: rewrite README, add data update guide and MIT license with trademark notice

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Publicación y limpieza del historial (con el mantenedor; NO automatizar)

Esta tarea requiere cuentas y acciones irreversibles. Cada paso se hace **solo** con confirmación explícita del mantenedor en ese momento.

- [ ] **Step 1: PR y fusión**

```bash
git push -u origin refactor/astro
gh pr create --title "Refactor: Astro, bilingual, accessible, no personal data" --body "<resumen + checklist de verificación>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

El mantenedor revisa la vista previa de Vercel (Step 2) y fusiona.

- [ ] **Step 2: Vercel** (lo hace el mantenedor en vercel.com)
  1. _Add New → Project →_ importar `joseuribeh98/scout-groups-finder`. Framework: Astro (autodetectado). Sin variables de entorno.
  2. _Settings → Domains →_ agregar `buscador.vallescout.org.co`.
  3. Pedir al administrador DNS de `vallescout.org.co`: **registro CNAME, nombre `buscador`, valor `cname.vercel-dns.com`**.
  4. Verificar: `curl -sI https://buscador.vallescout.org.co | grep -iE "^(HTTP|strict-transport)"`.
  5. Desactivar GitHub Pages en _Settings → Pages_ del repo y borrar la rama `gh-pages` si existe.

- [ ] **Step 3: Lighthouse en producción**

```bash
npx lighthouse https://buscador.vallescout.org.co/ --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --quiet --chrome-flags="--headless" --output=json --output-path=./lh.json
node -e "const r=require('./lh.json');for(const [k,v] of Object.entries(r.categories))console.log(k,Math.round(v.score*100))"; rm lh.json
```

Expected: las cuatro ≥ 95. Si alguna queda por debajo, abre un issue con el detalle antes de cerrar.

- [ ] **Step 4: Limpiar datos personales del historial** (irreversible; requiere `git-filter-repo` y confirmación explícita)

```bash
SCRATCH=$(mktemp -d)
git clone --mirror git@github.com:joseuribeh98/scout-groups-finder.git "$SCRATCH/repo.git"
# Lista de valores a borrar, sacada del archivo viejo (nunca se guarda en el repo):
git -C "$SCRATCH/repo.git" show 921d203:public/grupos.json | python3 -I -c "
import json,sys
d=json.load(sys.stdin); vals=set()
for g in d:
  for k in ('jefe','telefono','telefonoAlt'):
    if g.get(k): vals.add(str(g[k]).strip())
  if g.get('email') and not g['email'].lower().endswith('@scout.org.co'): vals.add(g['email'].strip())
print('\n'.join(f'{v}==>[eliminado]' for v in sorted(vals, key=len, reverse=True)))
" > "$SCRATCH/replacements.txt"
wc -l "$SCRATCH/replacements.txt"
cd "$SCRATCH/repo.git" && git filter-repo --replace-text "$SCRATCH/replacements.txt" --force
# Verificar que no quede ningún valor:
while IFS= read -r line; do v="${line%%==>*}"; git log --all -p | grep -qF "$v" && echo "QUEDA: $v"; done < "$SCRATCH/replacements.txt"
git push --force --mirror origin
```

Después: avisar al mantenedor que (a) los clones y forks existentes conservan el historial viejo, (b) GitHub puede servir commits viejos por SHA hasta su recolección de basura; para purgarlos se pide a GitHub Support ("remove cached views"), y (c) debe volver a clonar su copia local.

---

## Self-review (hecho)

- **Cobertura del spec:** propósito y criterios (Tasks 10–16; Lighthouse en Task 17), decisiones (Tasks 1, 14, 16), ramas y paleta (Tasks 2, 8), páginas y buscador (Tasks 10–13), tarjeta, ficha y detalles de tema e idioma (Tasks 8, 10, 11), arquitectura (mapa de archivos), modelo y validación (Tasks 3–4), despliegue (Tasks 14, 17), manejo de errores (Tasks 9, 11, 12; JS deshabilitado = SSR de la isla en Task 11), pruebas y CI (Tasks 10–15), documentación (Task 16), historial (Task 17), pendientes del mantenedor (resumen al final).
- **Tipos:** `Filters`/`Resultado`/`buscar` (Task 6) se usan igual en Tasks 11–12; `Translate` (Task 7) en los componentes Preact; `pinIcon(L, variant)` (Task 9) igual en Task 12; `grupoPath(lang, grupo)` en Tasks 10–12.
- **Review Focus:** las cinco entradas tienen su test en la tarea dueña.

## Pendientes del mantenedor (no bloquean la implementación)

- Logo de la Región en SVG o PNG grande (se usa el PNG del sitio actual mientras tanto).
- WhatsApp autorizado de cada grupo y correos institucionales `@scout.org.co` de los 12 grupos que hoy solo tienen correo personal.
- Contacto general de la Región (hoy el sitio enlaza a vallescout.org.co).
- Registro CNAME en el DNS de vallescout.org.co.
