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
