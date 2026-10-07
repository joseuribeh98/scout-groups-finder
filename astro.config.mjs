import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
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

export default defineConfig({
  site: "https://buscador.vallescout.org.co",
  trailingSlash: "always",
  integrations: [
    preact(),
    sitemap({ filter: (page) => !page.includes("/404") && !page.includes("/og/") }),
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
