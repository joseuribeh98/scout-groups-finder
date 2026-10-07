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
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
