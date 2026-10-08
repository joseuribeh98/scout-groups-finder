import type { Grupo } from "@/data/schema";
import { REGION } from "@/data/region";
import type { Lang } from "@/i18n/lang";
import { grupoPath, pagePath } from "@/i18n/routes";
import { translator } from "@/i18n/ui";
import { grupoSlug } from "@/lib/slug";

type JsonLd = Record<string, unknown>;

/** Imagen OG absoluta de un grupo, en el idioma de la página. */
export function ogImagePath(lang: Lang, slug: string): string {
  return lang === "en" ? `/og/en/${slug}.png` : `/og/${slug}.png`;
}

export function buildGrupoJsonLd(g: Grupo, url: string, lang: Lang, site: URL): JsonLd {
  const t = translator(lang);
  const sameAs = [g.contacto.instagram, g.contacto.facebook, g.contacto.web].filter(
    (x): x is string => x !== null,
  );
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: t("grupo.ldName", { id: g.id, nombre: g.nombre }),
    description: t("grupo.metaDescription", { id: g.id, nombre: g.nombre, municipio: g.municipio }),
    image: new URL(ogImagePath(lang, grupoSlug(g)), site).href,
    inLanguage: lang,
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
    // Grupo → Región Valle → Asociación Scouts de Colombia (miembro de la WOSM).
    parentOrganization: {
      "@type": "Organization",
      name: REGION.nombre,
      url: REGION.web,
      parentOrganization: {
        "@type": "Organization",
        name: "Asociación Scouts de Colombia",
        url: REGION.nacional,
        memberOf: {
          "@type": "Organization",
          name: "World Organization of the Scout Movement",
          url: REGION.mundial,
        },
      },
    },
  };
}

export function buildWebSiteJsonLd(lang: Lang, site: URL): JsonLd {
  const t = translator(lang);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: t("site.title"),
    url: new URL(pagePath(lang, "home"), site).href,
    inLanguage: lang,
    publisher: { "@type": "Organization", name: REGION.nombre, url: REGION.web },
  };
}

export function buildBreadcrumbJsonLd(g: Grupo, lang: Lang, site: URL): JsonLd {
  const t = translator(lang);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("breadcrumb.home"),
        item: new URL(pagePath(lang, "home"), site).href,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("grupo.ldName", { id: g.id, nombre: g.nombre }),
        item: new URL(grupoPath(lang, g), site).href,
      },
    ],
  };
}
