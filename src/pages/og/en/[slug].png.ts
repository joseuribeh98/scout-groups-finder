import type { APIRoute, GetStaticPaths } from "astro";
import { grupos } from "@/data/grupos";
import { translator } from "@/i18n/ui";
import { renderOg } from "@/lib/og";
import { grupoSlug } from "@/lib/slug";

const t = translator("en");

export const getStaticPaths = (() => [
  {
    params: { slug: "default" },
    props: { titulo: t("finder.heading"), subtitulo: t("og.region") },
  },
  ...grupos.map((g) => ({
    params: { slug: grupoSlug(g) },
    props: {
      titulo: g.nombre,
      subtitulo: `${t("grupo.number", { id: g.id })} · ${g.localidad ?? g.municipio}`,
    },
  })),
]) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as { titulo: string; subtitulo: string });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
