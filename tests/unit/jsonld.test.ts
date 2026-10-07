import { describe, expect, it } from "vitest";
import { grupos } from "@/data/grupos";
import { buildGrupoJsonLd } from "@/lib/jsonld";

describe("buildGrupoJsonLd", () => {
  it("describe el grupo como organización con dirección y geo", () => {
    const g = grupos.find((x) => x.id === 815);
    if (!g) throw new Error("falta el grupo 815");
    const ld = buildGrupoJsonLd(
      g,
      "https://buscador.vallescout.org.co/grupos/815-fenix-escarlata/",
    );
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Grupo Scout 815 Fénix Escarlata",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Cali",
        addressRegion: "Valle del Cauca",
        addressCountry: "CO",
      },
      geo: { "@type": "GeoCoordinates", latitude: 3.493053, longitude: -76.520585 },
      parentOrganization: { name: "Asociación Scouts de Colombia" },
    });
    expect(ld["sameAs"]).toEqual(["https://www.instagram.com/fenix_escarlata_815"]);
  });
});
