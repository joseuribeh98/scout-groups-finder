import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://buscador.vallescout.org.co",
  trailingSlash: "always",
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // El cargador (y su CSS) no debe llamarse "leaflet": así bloquear los chunks de
          // la librería en pruebas no bloquea también el CSS de la isla.
          manualChunks: (id) =>
            /\/src\/components\/map\/leaflet\.ts$/.test(id) ? "map-loader" : undefined,
        },
      },
    },
  },
});
