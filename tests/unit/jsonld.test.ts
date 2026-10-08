import { describe, expect, it } from "vitest";
import { grupos } from "@/data/grupos";
import { buildBreadcrumbJsonLd, buildGrupoJsonLd, buildWebSiteJsonLd } from "@/lib/jsonld";

const SITE = new URL("https://buscador.vallescout.org.co");
const grupo815 = () => {
  const g = grupos.find((x) => x.id === 815);
  if (!g) throw new Error("falta el grupo 815");
  return g;
};

describe("buildGrupoJsonLd", () => {
  it("describe el grupo como organización con dirección y geo", () => {
    const ld = buildGrupoJsonLd(
      grupo815(),
      "https://buscador.vallescout.org.co/grupos/815-fenix-escarlata/",
      "es",
      SITE,
    );
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Grupo Scout 815 Fénix Escarlata",
      inLanguage: "es",
      image: "https://buscador.vallescout.org.co/og/815-fenix-escarlata.png",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Cali",
        addressRegion: "Valle del Cauca",
        addressCountry: "CO",
      },
      geo: { "@type": "GeoCoordinates", latitude: 3.493053, longitude: -76.520585 },
      parentOrganization: {
        name: "Asociación Scouts de Colombia - Región Valle",
        url: "https://vallescout.org.co/",
        parentOrganization: {
          name: "Asociación Scouts de Colombia",
          memberOf: { name: "World Organization of the Scout Movement" },
        },
      },
    });
    expect(ld["sameAs"]).toEqual(["https://www.instagram.com/fenix_escarlata_815"]);
  });

  it("localiza nombre, descripción, idioma e imagen en inglés", () => {
    const ld = buildGrupoJsonLd(
      grupo815(),
      "https://buscador.vallescout.org.co/en/groups/815-fenix-escarlata/",
      "en",
      SITE,
    );
    expect(ld).toMatchObject({
      name: "Scout Group 815 Fénix Escarlata",
      inLanguage: "en",
      image: "https://buscador.vallescout.org.co/og/en/815-fenix-escarlata.png",
    });
    expect(ld["description"]).toContain("Scout Group 815 Fénix Escarlata in Cali");
  });
});

describe("buildWebSiteJsonLd", () => {
  it("describe el sitio con su editor", () => {
    expect(buildWebSiteJsonLd("en", SITE)).toMatchObject({
      "@type": "WebSite",
      name: "Scout Group Finder · Región Valle",
      url: "https://buscador.vallescout.org.co/en/",
      inLanguage: "en",
      publisher: { "@type": "Organization", name: "Asociación Scouts de Colombia - Región Valle" },
    });
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("lista Inicio → Grupo con URLs absolutas", () => {
    const ld = buildBreadcrumbJsonLd(grupo815(), "es", SITE);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld["itemListElement"]).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://buscador.vallescout.org.co/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Grupo Scout 815 Fénix Escarlata",
        item: "https://buscador.vallescout.org.co/grupos/815-fenix-escarlata/",
      },
    ]);
  });
});
