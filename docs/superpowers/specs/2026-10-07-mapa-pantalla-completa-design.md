# Buscador con mapa a pantalla completa · Diseño

- **Fecha:** 2026-10-07
- **Estado:** aprobado en conversación (variante 1 + estilo A), pendiente de revisión escrita
- **Antecede a:** `2026-10-07-buscador-refactor-design.md` (sigue vigente en todo lo que aquí no se cambia)

## 1. Propósito

La portada actual funciona, pero parece una plantilla de administración: todo en cajas iguales, los filtros como formulario apilado y el mapa encajonado como un widget. Para una familia que busca un grupo cerca desde el celular, el mapa debe ser la página. Este diseño reestructura la portada (el buscador) alrededor de un **mapa a pantalla completa**, con un **panel flotante** en escritorio y una **hoja inferior deslizable** en móvil, manteniendo el estilo institucional sobrio (morado nacional + neutros, Figtree).

### Criterios de éxito

- En cualquier pantalla, el mapa ocupa todo el espacio bajo el encabezado y nunca se tapa del todo.
- En móvil, buscar, filtrar y recorrer la lista se hace sin perder el mapa de vista, con una hoja que se arrastra entre tres posiciones.
- Tocar un pin o un resultado muestra una **ficha resumida** del grupo; ir a la página del grupo es siempre una acción explícita ("Ver ficha").
- Todo lo ya logrado se conserva: filtros en la URL, "Cerca de mí", bilingüe, CSP estricta, axe sin violaciones serias en claro y oscuro, Lighthouse ≥ 95 en móvil.
- Sin JavaScript, la portada sigue mostrando la lista completa de grupos con enlaces a sus fichas.

### Fuera de alcance

Cambios de datos, nuevas páginas, analítica, y rediseño profundo de "¿Qué es ser scout?" (solo alineación de estilo).

## 2. Decisiones

| Tema             | Decisión                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estructura       | Variante 1: mapa completo; panel flotante (escritorio) / hoja inferior (móvil)                                                                                            |
| Estilo           | A, institucional sobrio: tokens actuales (morado `#4d006e` como acento, neutros fríos; tema oscuro gris carbón), Figtree en todo; los títulos en `text-ink`, no en morado |
| Colores de rama  | Solo en el punto del chip (sin fondos de color), como hoy                                                                                                                 |
| Mapa             | OSM estándar, desaturado en claro y gris en oscuro, como hoy; pines SVG actuales + etiqueta con el número del grupo a partir de zoom 12                                   |
| Interacción      | Clic en pin o en resultado → ficha resumida (popup en escritorio; tarjeta en la hoja en móvil). "Ver ficha" es la única vía a la página del grupo                         |
| Página del grupo | Se mantiene; en móvil gana una barra de contacto fija abajo                                                                                                               |
| Sin JS           | La portada se renderiza como columna estática (búsqueda inerte + lista); el layout de mapa se activa con la clase `js` en `<html>`                                        |

## 3. Portada en escritorio (≥ 1024 px)

```
┌──────────────────────────────────────────────────────────────┐
│ Encabezado 64 px: logo · ¿Qué es ser scout? · EN · tema       │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐                                        │
│ │ Encuentra tu grupo │        M A P A  (100dvh − 64 px)       │
│ │ 22 grupos · 7 mun. │                                        │
│ │ [🔍 buscar  ◎ Cerca]│          ● pines con número          │
│ │ (Todo)(Cali 14)(…)  │          ⬤ clústeres                  │
│ │ (•Cachorros)(•Lob…) │          ▭ popup al tocar un pin      │
│ │ 22 grupos  Limpiar  │                                        │
│ │ ─ Águilas Doradas ─ │                                        │
│ │   315 · Buga · Sáb  │                                        │
│ │   ••••        2,3 km│                                 [+][−] │
│ │ ─ Mafeking …        │                                        │
│ └────────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

- **Página sin scroll:** `<main>` mide `calc(100dvh - altura del encabezado)`; el mapa llena ese alto; el panel tiene scroll interno.
- **Panel flotante:** izquierda, margen 16 px, ancho 400 px (mín. 360, máx. 440), alto máximo = alto del mapa − 32 px, radio 16 px, sombra suave, fondo `surface`. Contenido, de arriba abajo:
  1. Título h1 "Encuentra tu grupo scout" (24 px, `text-ink`) y subtítulo "22 grupos en 7 municipios del Valle" (clave `finder.lead` reescrita con `{n}` y `{m}`).
  2. **Barra de búsqueda** tipo píldora: icono lupa, campo, y dentro a la derecha el botón "Cerca de mí" (icono + texto; `aria-pressed`).
  3. **Chips de municipio** (selección única): "Todo el Valle" y un chip por municipio con grupos, con su conteo ("Cali 14"). Fila con scroll horizontal si no cabe.
  4. **Chips de rama** (multiselección): punto de color + nombre + edad abreviada ("Lobatos · 7–10"). Seleccionado: borde y fondo `brand-soft` + check.
  5. Línea de conteo (`aria-live`) y "Limpiar filtros" cuando hay filtros activos.
  6. **Lista de resultados.** Cada ítem: nombre (botón "Ver {nombre} en el mapa"), línea "Grupo 315 · Buga · Sáb, 2:00 p. m.", puntos de rama, y a la derecha la distancia como píldora `brand-soft` (si hay origen) y un enlace icono "Ver ficha" (`aria-label` "Ver ficha de {nombre}"). Hover/foco resalta su pin; clic centra el mapa y abre el popup.
  7. Estado vacío dentro del panel (mismo texto y acciones de hoy).
- **Mapa:** controles de zoom abajo a la derecha; atribución abajo a la derecha, discreta. Vista inicial: `fitBounds` a los resultados con `paddingTopLeft = [ancho del panel + 32, 16]` para que ningún pin quede bajo el panel. Al filtrar, se reajusta con el mismo padding.
- **Pines:** el `divIcon` incluye una etiqueta con el número del grupo; se muestra solo cuando el contenedor del mapa tiene la clase `zoom-labels` (se alterna en `zoomend` cuando zoom ≥ 12).
- **Popup** (escritorio): el `MapPopup` actual (grupo, nombre, horario, ramas, distancia, WhatsApp, Cómo llegar, **Ver ficha**).

## 4. Portada en móvil (< 1024 px)

```
┌──────────────────────┐
│ encabezado 56 px      │
├──────────────────────┤
│ [🔍 Buscar grupo   ◎] │  ← píldora flotante
│                      │
│        M A P A       │
│      ●   ⬤7   ●      │
│                      │
├─────── ═══ ──────────┤  ← asa de la hoja
│ (Todo)(Cali)(Palmira)│
│ 22 grupos · cerca    │     posición "asomada"
│ Águilas Doradas 2,3km│
└──────────────────────┘
```

- **Hoja inferior** con tres posiciones: **asomada** (≈ 30 % del alto: asa, título compacto, chips de municipio y de rama, conteo y el primer resultado), **media** (55 %) y **completa** (alto del mapa − 8 px; la lista hace scroll dentro). El h1 "Encuentra tu grupo scout" va en la cabecera de la hoja, en 18 px, visible en las tres posiciones.
  - Se arrastra desde el asa o desde la cabecera de la hoja (pointer events, con umbral de 8 px y velocidad para decidir el destino).
  - El asa es un `<button>` con `aria-label` "Expandir lista" / "Contraer lista" y `aria-expanded`; tocarlo alterna asomada ↔ completa; flechas ↑/↓ cambian de posición.
  - La hoja es `role="region"` con `aria-label` "Resultados". El contenido existe en el DOM en todas las posiciones.
  - Con `prefers-reduced-motion`, no hay animación de arrastre: salta a la posición.
- **Búsqueda:** píldora flotante arriba del mapa (margen 12 px) con la lupa y el botón "Cerca de mí" (solo icono, con `aria-label`). Al enfocar el campo, la hoja sube a **completa** para ver los resultados mientras se escribe; al limpiar y desenfocar vuelve a **media**.
- **Tocar un pin:** la hoja pasa a **asomada** y muestra, en lugar de la lista, la **tarjeta del grupo** (el mismo contenido del popup, con una X para volver a la lista). El mapa centra ese pin. No se usan popups de Leaflet en móvil.
- **Tocar un resultado:** igual que tocar su pin.
- Desaparecen el botón flotante "Ver mapa / Ver lista" y la vista por pestañas.
- El `body` no hace scroll en la portada; solo la lista dentro de la hoja.

## 5. Página del grupo

Se mantiene la estructura actual con dos ajustes:

- **Móvil:** barra de acciones fija abajo (`position: sticky; bottom: 0`), con el contacto principal lleno (WhatsApp si existe; si no, correo) y "Cómo llegar" al lado. El resto de acciones sigue en la sección "Contacto".
- **Escritorio:** sin cambios de estructura; se alinean tamaños y espaciados con el panel (mismos radios, mismas píldoras).

## 6. Sin JavaScript y accesibilidad

- El script inline del tema añade `document.documentElement.classList.add("js")`. Sin JS, la portada se renderiza como columna: encabezado, título, campo de búsqueda (inerte), lista completa de grupos con sus enlaces "Ver ficha", y el contenedor del mapa no se muestra. El layout de mapa completo, el panel y la hoja se activan con `.js`.
- Orden de foco en escritorio: encabezado → panel (búsqueda, chips, lista) → controles del mapa. En móvil: encabezado → búsqueda flotante → asa de la hoja → contenido de la hoja → mapa.
- Los pines siguen siendo marcadores con `title`; la ficha resumida es alcanzable por teclado desde la lista (el botón de cada ítem). Los popups de Leaflet reciben foco al abrirse (`autoPan` activo) y se cierran con Escape.
- Contraste AA en ambos temas, verificado con axe en los tests existentes (se amplían a la hoja en sus tres posiciones).

## 7. Arquitectura

```
src/components/finder/
  Finder.tsx          estado (filtros, URL, geolocalización, selección), decide Panel o Sheet por media query
  SearchBar.tsx       píldora de búsqueda + botón "Cerca de mí" (variantes desktop/mobile)
  FilterChips.tsx     chips de municipio (con conteos) y de rama
  ResultList.tsx      conteo, lista, estado vacío
  ResultItem.tsx      ítem compacto (botón "ver en el mapa" + enlace "Ver ficha")
  Panel.tsx           contenedor flotante de escritorio
  Sheet.tsx           hoja inferior móvil (posiciones, arrastre, asa)
  useSheet.ts         lógica de posiciones/arrastre, reduced motion
  SelectedCard.tsx    tarjeta del grupo seleccionado en la hoja (reutiliza MapPopup)
  MapPopup.tsx        (existente) contenido de la ficha resumida
  GroupMap.tsx        (existente) + padding de fitBounds, etiquetas por zoom, controles abajo a la derecha
src/views/HomePage.astro   layout de página completa (sin scroll) y fallback sin JS
src/layouts/Base.astro     prop `viewport?: boolean` para que <main> llene la pantalla y el pie no se muestre en la portada
src/styles/map.css         etiquetas de pin, posición de controles, popup
```

- `Finder` ya tiene filtros, URL, geolocalización y `focusRequest`; se reorganiza en los componentes de arriba sin cambiar `lib/`.
- `fitToResults` recibe el padding del panel (escritorio) o de la hoja (móvil: `paddingBottomRight = [16, alto de la hoja asomada + 16]`).
- El pie de página no aparece en la portada (los enlaces institucionales van en "¿Qué es ser scout?" y en las fichas). Se mantiene en el resto de páginas.

## 8. Textos nuevos (`ui.ts`, ES/EN)

`finder.lead` → "{n} grupos en {m} municipios del Valle" / "{n} groups across {m} towns in Valle"; `finder.allValle` "Todo el Valle" / "All of Valle"; `finder.municipioCount` "{nombre} {n}"; `sheet.expand` "Expandir lista" / "Expand list"; `sheet.collapse` "Contraer lista" / "Collapse list"; `sheet.results` "Resultados" / "Results"; `sheet.backToList` "Volver a la lista" / "Back to the list"; `card.detailsOf` "Ver ficha de {nombre}" / "View details of {nombre}"; `finder.nearMeShort` "Cerca de mí" (aria-label del botón solo icono).

## 9. Pruebas

- **e2e existentes** se adaptan: `finder.spec` (búsqueda, filtros, URL, cerca de mí) usa los nuevos selectores; `map.spec` (popup en escritorio; tarjeta en la hoja en móvil; pin y clúster).
- **Nuevos:** `sheet.spec` (móvil): posiciones por asa (clic y teclado), arrastre con `mouse.down/move/up`, enfocar la búsqueda sube la hoja, tocar un pin muestra la tarjeta y la X vuelve a la lista. Escritorio: el padding de `fitBounds` deja todos los pines fuera del área del panel (se comprueba que ningún `.pin` intersecta el rectángulo del panel tras cargar).
- **a11y:** axe en portada con la hoja en las tres posiciones y con un popup abierto, claro y oscuro.
- **Sin JS:** test con `javaScriptEnabled: false`: la portada lista los 22 grupos y los enlaces "Ver ficha" funcionan.
- **Visual:** capturas antes/después en escritorio y móvil, claro y oscuro, revisadas a ojo antes de dar por terminado.

## 10. Riesgos

- **Lighthouse móvil:** Leaflet pasa a cargarse siempre en la portada. Mitigación: carga del mapa tras la hidratación en `requestIdleCallback`, color de fondo de mapa como placeholder y tests de Lighthouse en la vista previa de Vercel.
- **Gestos de la hoja:** son la parte más delicada; se implementan con pointer events y umbrales simples, sin librería, y se prueban con Playwright.
- **Política de teselas OSM:** sin cambios respecto al diseño anterior.
