# Buscador de Grupos Scout — Región Valle · Diseño del refactor

- **Fecha:** 2026-10-07
- **Estado:** aprobado en conversación, pendiente de revisión escrita
- **Dominio de producción:** `https://buscador.vallescout.org.co`

## 1. Propósito

Que una familia o un joven del Valle del Cauca encuentre, desde el celular, el grupo scout más cercano y lo contacte en menos de un minuto.

El repositorio es público y funciona como carta de presentación del autor: el código, la documentación y las prácticas deben ser ejemplares.

### Criterios de éxito

- Lighthouse ≥ 95 en Performance, Accessibility, Best Practices y SEO (móvil).
- WCAG 2.2 AA: navegable por teclado y con contraste suficiente en tema claro y oscuro.
- La lista de grupos funciona aunque el mapa no cargue.
- Actualizar un grupo = editar un JSON + `git push`. Si los datos son inválidos, el despliegue no sale.
- Sitio completo en español (por defecto) e inglés.
- Ningún dato personal de dirigentes en el sitio ni en el repositorio.

### Fuera de alcance

Backend, login, panel de administración, formularios, analítica con cookies y filtro por día de reunión (21 de los 22 grupos se reúnen el sábado; el día se muestra en la tarjeta, pero no se filtra por él).

## 2. Decisiones tomadas

| Tema                           | Decisión                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                      | Astro 7 (salida estática) + TypeScript 6 estricto                                                                                                                               |
| Interactividad                 | Una isla Preact para el buscador y el mapa; el resto es HTML sin JS                                                                                                             |
| Estilos                        | Tailwind CSS 4 con tokens propios                                                                                                                                               |
| Mapa                           | Leaflet + teselas estándar de OpenStreetMap (modo oscuro con filtro CSS) + agrupación de pines (`leaflet.markercluster`). CARTO pasó a requerir API key (oct 2026)              |
| Datos                          | `src/data/grupos.json`, validado con Zod al compilar                                                                                                                            |
| Actualización                  | Solo el mantenedor, vía commit                                                                                                                                                  |
| Idiomas                        | ES (por defecto, sin prefijo) y EN (`/en/...`) con i18n nativo de Astro                                                                                                         |
| Hosting                        | Vercel, plan Hobby                                                                                                                                                              |
| Licencia                       | MIT para el código. Marca, logos y nombres de Scouts de Colombia excluidos (aviso en README y LICENSE)                                                                          |
| Fuente de verdad institucional | `scout.org.co` (nombres de rama, edades, paleta). `vallescout.org.co` está desactualizado                                                                                       |
| Logo del encabezado            | Región Valle                                                                                                                                                                    |
| Privacidad                     | Solo correos `@scout.org.co`, redes del grupo y un WhatsApp autorizado. Se eliminan `jefe`, `telefono`, `telefonoAlt` y los correos personales, y se limpia el historial de git |

## 3. Información institucional

### Ramas (fuente: scout.org.co, octubre de 2026)

| id          | Nombre ES     | Nombre EN  | Edad       | Color     | Texto sobre claro |
| ----------- | ------------- | ---------- | ---------- | --------- | ----------------- |
| `cachorros` | Cachorros     | Beavers    | 5–6 años   | `#f0592b` | `#c23600`         |
| `lobatos`   | Lobatos       | Cub Scouts | 7–10 años  | `#ffd00f` | `#8a5a00`         |
| `scouts`    | Scouts        | Scouts     | 11–14 años | `#016937` | `#016937`         |
| `nomadas`   | Nómadas Scout | Venturers  | 15–17 años | `#233f96` | `#233f96`         |
| `rovers`    | Rovers        | Rovers     | 18–20 años | `#be2026` | `#be2026`         |

El orden de la tabla es el orden oficial. La equivalencia con los datos actuales es: Cachorros→`cachorros`, Manada→`lobatos`, Tropa→`scouts`, Comunidad→`nomadas`, Clan→`rovers`.

Los nombres en inglés son aproximaciones descriptivas. En la interfaz EN se muestra el nombre oficial en español con la traducción como apoyo (p. ej. "Nómadas Scout · Venturers").

### Paleta

- **Marca:** `--scouts-purple #4d006e` (encabezado, acciones primarias, pines).
- **Institucionales secundarios:** `#003087` azul, `#ffcd00` amarillo, `#ff8308` naranja, `#c40f2f` rojo. Se usan con moderación (enlaces, foco, estados).
- **Neutros:** texto `#2a1d3d`, texto suave `#5a4a70`, fondo lila `#f3eefa`, blanco.
- **Regla:** los colores de rama se usan **solo** para identificar ramas (chips, filtro, leyenda). Nunca como decoración.
- **Tema oscuro:** variantes aclaradas del morado y de los colores de rama que cumplan AA sobre fondo oscuro; se calculan y verifican en la implementación.

## 4. Experiencia de usuario

### Páginas

| Ruta ES             | Ruta EN                | Contenido                                                                    |
| ------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `/`                 | `/en/`                 | Buscador: lista + mapa                                                       |
| `/grupos/[slug]`    | `/en/groups/[slug]`    | Ficha del grupo                                                              |
| `/que-es-ser-scout` | `/en/what-is-scouting` | Ramas por edad, cómo inscribirse, enlaces a scout.org.co y vallescout.org.co |
| `404`               | `404`                  | Página bilingüe con regreso al buscador                                      |

Formato del slug: `815-fenix-escarlata`.

### Buscador

- **Móvil:** campo de búsqueda, chips de filtro y lista de tarjetas. Un botón flotante "Mapa / Lista" alterna la vista.
- **Escritorio (≥ 1024 px):** lista a la izquierda (≈ 420 px) y mapa a la derecha, sincronizados. Hover o foco en una tarjeta resalta su pin; clic en un pin desplaza la lista y resalta la tarjeta.
- **Búsqueda de texto:** por nombre, número, municipio, localidad o dirección. Ignora tildes y mayúsculas.
- **Filtros:** municipio (selección única) y ramas (multiselección; muestra los grupos que tengan **todas** las ramas elegidas). Cada chip de rama muestra su rango de edad.
- **"Cerca de mí":** pide geolocalización. Si se concede, ordena por distancia (haversine) y la muestra ("2,3 km"); si se niega o falla, aparece un mensaje breve y el orden sigue por municipio y nombre.
- **Estado en la URL:** `?q=&municipio=cali&rama=scouts&rama=nomadas`, para poder compartir la búsqueda.
- **Estado vacío:** "No encontramos grupos con esos filtros", con botones para limpiar filtros y contactar a la Región.
- **Contador:** "12 grupos", anunciado con `aria-live`.

### Tarjeta de grupo

Nombre y número, municipio (más localidad si existe) y distancia, día y hora, chips de rama y un botón directo de WhatsApp (si existe). Toda la tarjeta enlaza a la ficha.

### Ficha de grupo

Nombre y número, municipio, dirección con mini mapa estático, horario, ramas con edades, y acciones grandes: **WhatsApp**, **Correo**, **Cómo llegar** (Google Maps; enlace secundario a Waze), Instagram, Facebook y Web. Las acciones sin dato no se muestran. Pie: "Información actualizada: octubre 2026". Incluye metadatos Open Graph e imagen OG generada al compilar.

### Detalles

- Tema claro u oscuro según `prefers-color-scheme`, con selector manual guardado en `localStorage`.
- Selector de idioma que conserva la página actual.
- Respeto por `prefers-reduced-motion`.
- Tipografía: una sola familia autoalojada (candidatas: Figtree o Instrument Sans) con cifras tabulares para distancias y horas.

## 5. Arquitectura

```
src/
  data/
    grupos.json        datos de grupos (único archivo que se edita al actualizar)
    schema.ts          esquema Zod + tipos
    ramas.ts           ramas, edades, colores, orden oficial
    region.ts          contacto de la Región, límites geográficos del Valle
  i18n/
    ui.ts              textos de interfaz es/en tipados (una clave faltante es error de compilación)
    index.ts           t(), helpers de rutas por idioma
  lib/                 funciones puras y testeables
    search.ts          normalización y filtrado
    geo.ts             distancia haversine, formateo
    schedule.ts        formateo de horarios ES/EN
    slug.ts
    contact.ts         construcción de enlaces wa.me, mailto, mapas
  components/
    Header.astro, Footer.astro, LangSwitch.astro, ThemeToggle.astro
    GroupDetail.astro, ContactActions.astro, RamaChip.astro
    finder/            isla Preact
      Finder.tsx       estado, URL sync, geolocalización
      Filters.tsx
      GroupList.tsx, GroupCard.tsx
      GroupMap.tsx     carga Leaflet de forma diferida
  layouts/Base.astro   head, SEO, hreflang, OG
  pages/
    index.astro, grupos/[slug].astro, que-es-ser-scout.astro, 404.astro
    en/index.astro, en/groups/[slug].astro, en/what-is-scouting.astro
    og/[slug].png.ts   imágenes OG (satori)
  styles/global.css    tokens Tailwind 4
public/
  logo-valle.svg (o .png), favicon, robots.txt
tests/
  unit/                Vitest
  e2e/                 Playwright + axe
```

Cada módulo de `lib/` es puro y no depende de Astro ni de Preact. La isla `Finder` recibe los grupos ya validados como prop serializada, así que no hace `fetch` en tiempo de ejecución.

## 6. Modelo de datos

```jsonc
{
  "id": 815,
  "nombre": "Fénix Escarlata",
  "municipio": "Cali",
  "localidad": null, // p. ej. "Rozo" (Palmira)
  "direccion": "Parque del Amor, Avenida 6 con Calle 70",
  "ubicacion": { "lat": 3.493053, "lng": -76.520585 },
  "reunion": { "dia": "sabado", "inicio": "14:00", "fin": "18:00" }, // fin opcional
  "ramas": ["lobatos", "scouts", "nomadas", "rovers"],
  "contacto": {
    "email": "valle.grupo815@scout.org.co",
    "whatsapp": null, // E.164 sin "+", p. ej. "573001234567"; solo si el grupo lo autoriza
    "instagram": "https://www.instagram.com/fenix_escarlata_815",
    "facebook": null,
    "web": null,
  },
  "actualizado": "2026-10",
}
```

### Reglas de validación (Zod; el build falla si no se cumplen)

- `id` entero positivo y único; el slug resultante también es único.
- `municipio` dentro de una lista cerrada de municipios del Valle (en `region.ts`).
- `ubicacion` dentro del rectángulo del Valle del Cauca (lat 3.0–5.1, lng −77.6 a −75.6, aprox.).
- `dia` ∈ lunes…domingo; `inicio`/`fin` en `HH:mm`, con `fin > inicio`.
- `ramas` sin vacíos ni repetidos, todas válidas; se ordenan según el orden oficial.
- `email` nullable y solo `@scout.org.co`; `instagram`, `facebook` y `web` deben ser URLs `https://`; `whatsapp` debe cumplir `^57\d{10}$`.
- Cualquier campo extra (`jefe`, `telefonoAlt`, …) **rechaza** el build (`.strict()`), para evitar que vuelvan a entrar datos personales por error.
- Los mensajes de error identifican el grupo: `grupo 815 (Fénix Escarlata): ubicacion.lat fuera del Valle`.

### Migración inicial

Un script de una sola vez (no se versiona, o se guarda en `scripts/` con fecha) convierte `public/grupos.json`:

- Ramas: equivalencias de la sección 3.
- Horarios: texto libre → `reunion`. Se revisan a mano los 22 casos.
- `telefono` y `telefonoAlt` se descartan. `whatsapp` queda `null` hasta que el mantenedor confirme qué números están autorizados.
- Correos que no son `@scout.org.co` (12 de 22, personales) se descartan.
- Valores de `facebook` que no son URL (p. ej. "Grupo scout 808 Delfines") → `null`.
- Nombres en mayúsculas se normalizan: ZIMBABUE → Zimbabue, SAMAGUARE → Samaguare, LEON DORADO → León Dorado.
- `jefe` se descarta.
- Rozo → `municipio: "Palmira"`, `localidad: "Rozo"`.
- URLs vacías → `null`.

## 7. Despliegue y operación

- **Vercel:** proyecto importado desde GitHub. `main` → producción; cada PR → URL de vista previa. Framework preset: Astro.
- **Dominio:** el administrador DNS de `vallescout.org.co` crea `CNAME buscador → cname.vercel-dns.com`. Luego se agrega el dominio en Vercel (el certificado TLS es automático).
- **`vercel.json`:** encabezados de seguridad (CSP que permita las teselas de OpenStreetMap, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` con `geolocation=(self)`) y caché inmutable para `/_astro/*`.
- **SEO:** `@astrojs/sitemap`, `robots.txt`, `hreflang` ES/EN, `canonical`, JSON-LD (`Organization` por grupo).
- **Analítica:** opcional, Vercel Web Analytics (sin cookies). Se decide después.
- **Limpieza:** se eliminan `gh-pages`, `homepage`, scripts `predeploy`/`deploy`, restos de la plantilla Vite y el uso de `prop-types`.

## 8. Manejo de errores

| Situación                          | Comportamiento                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Datos inválidos                    | Falla el build con un mensaje que identifica el grupo y el campo                         |
| Teselas o Leaflet no cargan        | La lista sigue funcionando; el panel del mapa muestra un aviso y un enlace a Google Maps |
| JS deshabilitado                   | El buscador muestra la lista completa renderizada en el servidor; las fichas funcionan   |
| Geolocalización negada o con error | Toast breve; se mantiene el orden por defecto                                            |
| Grupo sin WhatsApp o sin redes     | No se muestran esos botones                                                              |
| Grupo sin ningún canal directo     | Se muestra "Contacta a la Región Valle" con enlace a vallescout.org.co                   |
| Parámetro de URL inválido          | Se ignora en silencio                                                                    |

## 9. Calidad y pruebas

- **Vitest:** `search`, `geo`, `schedule`, `slug`, `contact` y el esquema (casos válidos e inválidos, incluido el rechazo de campos extra).
- **Playwright** (Chromium, viewport móvil y escritorio):
  - buscar → filtrar → ver resultados → abrir ficha → los enlaces de contacto son correctos;
  - la URL refleja los filtros y al recargar se conserva el estado;
  - cambio de idioma conservando la página;
  - `@axe-core/playwright` sin violaciones serias en las cuatro páginas.
- **Estático:** ESLint (flat config), Prettier, `astro check` (tipos).
- **CI (GitHub Actions):** en cada PR y en cada push a `main`: install → lint → check → unit → build → e2e contra `astro preview`.
- **Hooks locales:** se mantiene husky + lint-staged.

## 10. Documentación del repositorio

- `README.md` en español con sección en inglés: qué es, captura, enlace al sitio, stack, cómo correrlo y cómo actualizar un grupo.
- `docs/actualizar-grupos.md`: guía paso a paso para editar `grupos.json`, con ejemplos de errores de validación.
- `LICENSE` MIT + aviso de marca ("Los nombres, logos y emblemas de Scouts de Colombia y la Región Valle pertenecen a sus titulares").
- Commits convencionales.

## 11. Limpieza del historial de git

Es el **último paso** y solo se hace con confirmación explícita del mantenedor en ese momento:

1. Backup (`git clone --mirror`).
2. `git filter-repo` para eliminar los valores de `jefe`, `telefono` y `telefonoAlt` de todo el historial (por reemplazo de texto con la lista de valores actuales). La lista de reemplazo incluye también los correos personales (cualquier correo que no sea `@scout.org.co`), de acuerdo con la Task 17 del plan.
3. Force-push a `main` y aviso de que los clones o forks existentes siguen teniendo el historial viejo.

## 12. Pendientes del mantenedor

- Logo de la Región Valle en SVG o PNG de alta resolución (provisional: `logo_scoutvalle_new.png` de vallescout.org.co).
- Números de WhatsApp autorizados por cada grupo y correos `@scout.org.co` de los 12 grupos que hoy solo tienen correo personal.
- Contacto general de la Región para el estado vacío y el pie de página.
- Solicitar el registro CNAME al administrador DNS.
