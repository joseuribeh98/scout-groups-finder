import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type SatoriType from "satori";

const root = process.cwd();
// El build ESM de satori 0.36 referencia `__dirname` al importarse y falla en Node ESM
// puro (Vitest, build de Astro). Su build CJS funciona, así que se carga con require.
const { default: satori } = createRequire(join(root, "package.json"))("satori") as {
  default: typeof SatoriType;
};
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
