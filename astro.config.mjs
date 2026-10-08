import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Astro no calcula el hash de los `<script is:inline>`: se deriva aquí del propio Base.astro
// para que el script de tema (anti-parpadeo) pase la CSP sin usar 'unsafe-inline'.
const baseLayout = readFileSync(new URL("./src/layouts/Base.astro", import.meta.url), "utf8");
const themeScript = /<script is:inline>([\s\S]*?)<\/script>/.exec(baseLayout)?.[1];
if (themeScript === undefined) throw new Error("Base.astro: falta el <script is:inline> de tema");
const themeScriptHash = `sha256-${createHash("sha256").update(themeScript).digest("base64")}`;

/**
 * Precarga de módulos para la portada. Astro no emite `modulepreload` para las dependencias de
 * las islas ni para el chunk dinámico de Leaflet, así que el navegador las descubre en serie
 * (HTML → Finder → leaflet → leaflet-bundle → teselas). Tras el build se añaden `<link
 * rel="modulepreload">` a las páginas del buscador con todos los chunks que la isla necesita,
 * para que bajen en paralelo desde el HTML. La CSP no cambia (script-src 'self').
 */
function preloadFinderChunks() {
  const FINDER_PAGES = ["index.html", "en/index.html"];
  return {
    name: "preload-finder-chunks",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const dist = fileURLToPath(dir);
        const astroDir = join(dist, "_astro");
        const chunks = readdirSync(astroDir).filter((f) => f.endsWith(".js"));
        // Dependencias estáticas, de forma transitiva, a partir de los módulos que referencia la página.
        const staticDeps = (file, seen = new Set()) => {
          if (seen.has(file)) return seen;
          seen.add(file);
          const src = readFileSync(join(astroDir, file), "utf8");
          for (const m of src.matchAll(
            /from\s*"\.\/([\w.-]+\.js)"|import\s*"\.\/([\w.-]+\.js)"/g,
          )) {
            staticDeps(m[1] ?? m[2], seen);
          }
          return seen;
        };
        for (const page of FINDER_PAGES) {
          const path = join(dist, page);
          const html = readFileSync(path, "utf8");
          const entries = [...html.matchAll(/\/_astro\/([\w.-]+\.js)/g)].map((m) => m[1]);
          const wanted = new Set(chunks.filter((f) => /^leaflet-bundle\./.test(f)));
          for (const entry of entries) for (const dep of staticDeps(entry)) wanted.add(dep);
          const links = [...wanted]
            .sort()
            .map((f) => `<link rel="modulepreload" href="/_astro/${f}">`)
            .join("");
          writeFileSync(path, html.replace("</head>", `${links}</head>`));
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://buscador.vallescout.org.co",
  trailingSlash: "always",
  integrations: [
    preact(),
    sitemap({ filter: (page) => !page.includes("/404") && !page.includes("/og/") }),
    preloadFinderChunks(),
  ],
  security: {
    csp: {
      scriptDirective: { hashes: [themeScriptHash] },
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://tile.openstreetmap.org",
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
