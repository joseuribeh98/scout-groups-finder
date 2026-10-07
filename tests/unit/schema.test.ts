import { describe, expect, it } from "vitest";
import { parseGrupos } from "@/data/schema";

function grupo(overrides: Record<string, unknown> = {}) {
  return {
    id: 815,
    nombre: "Fénix Escarlata",
    municipio: "Cali",
    localidad: null,
    direccion: "Parque del Amor, Avenida 6 con Calle 70",
    ubicacion: { lat: 3.493053, lng: -76.520585 },
    reunion: { dia: "sabado", inicio: "14:00", fin: "18:00" },
    ramas: ["rovers", "lobatos"],
    contacto: {
      email: "valle.grupo815@scout.org.co",
      whatsapp: null,
      instagram: "https://www.instagram.com/fenix_escarlata_815",
      facebook: null,
      web: null,
    },
    actualizado: "2025-05",
    ...overrides,
  };
}

function errorOf(raw: unknown): string {
  try {
    parseGrupos(raw);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("se esperaba un error de validación");
}

describe("parseGrupos", () => {
  it("acepta un grupo válido y ordena sus ramas", () => {
    const [g] = parseGrupos([grupo()]);
    expect(g?.ramas).toEqual(["lobatos", "rovers"]);
  });

  it("acepta reunión sin hora de fin", () => {
    expect(() =>
      parseGrupos([grupo({ reunion: { dia: "sabado", inicio: "14:30", fin: null } })]),
    ).not.toThrow();
  });

  it("rechaza campos extra como datos personales, identificando el grupo", () => {
    const msg = errorOf([grupo({ jefe: "Nombre Apellido" })]);
    expect(msg).toContain("grupo 815 (Fénix Escarlata)");
    expect(msg).toContain("jefe");
  });

  it("rechaza campos extra dentro de contacto", () => {
    expect(
      errorOf([grupo({ contacto: { ...grupo().contacto, telefonoAlt: "3000000000" } })]),
    ).toContain("telefonoAlt");
  });

  it("rechaza coordenadas fuera del Valle", () => {
    const msg = errorOf([grupo({ ubicacion: { lat: 4.711, lng: -74.072 } })]);
    expect(msg).toContain("ubicacion.lng");
  });

  it("rechaza municipios que no son del Valle", () => {
    expect(errorOf([grupo({ municipio: "Bogotá" })])).toContain("municipio");
  });

  it("rechaza correos que no son institucionales", () => {
    const msg = errorOf([grupo({ contacto: { ...grupo().contacto, email: "persona@gmail.com" } })]);
    expect(msg).toContain("contacto.email");
  });

  it("rechaza WhatsApp que no sea colombiano en formato 57XXXXXXXXXX", () => {
    expect(
      errorOf([grupo({ contacto: { ...grupo().contacto, whatsapp: "3001234567" } })]),
    ).toContain("contacto.whatsapp");
  });

  it("rechaza URLs sin https", () => {
    expect(
      errorOf([grupo({ contacto: { ...grupo().contacto, web: "http://ejemplo.org" } })]),
    ).toContain("contacto.web");
  });

  it("rechaza hora de fin anterior al inicio", () => {
    expect(
      errorOf([grupo({ reunion: { dia: "sabado", inicio: "18:00", fin: "14:00" } })]),
    ).toContain("reunion.fin");
  });

  it("rechaza ramas vacías, repetidas o desconocidas", () => {
    expect(errorOf([grupo({ ramas: [] })])).toContain("ramas");
    expect(errorOf([grupo({ ramas: ["scouts", "scouts"] })])).toContain("ramas");
    expect(errorOf([grupo({ ramas: ["tropa"] })])).toContain("ramas");
  });

  it("rechaza ids repetidos", () => {
    expect(errorOf([grupo(), grupo({ nombre: "Otro" })])).toContain("id 815 repetido");
  });

  it("rechaza actualizado con formato inválido", () => {
    expect(errorOf([grupo({ actualizado: "2025-13" })])).toContain("actualizado");
  });

  it("lista todos los errores, no solo el primero", () => {
    const msg = errorOf([grupo({ municipio: "Bogotá", actualizado: "x" })]);
    expect(msg).toContain("municipio");
    expect(msg).toContain("actualizado");
  });
});
