import { describe, expect, it } from "vitest";
import type { Grupo } from "@/data/schema";
import { EMPTY_FILTERS, buscar, hasActiveFilters, matchesFilters, normalize } from "@/lib/search";

function g(
  id: number,
  nombre: string,
  municipio: Grupo["municipio"],
  extra: Partial<Grupo> = {},
): Grupo {
  return {
    id,
    nombre,
    municipio,
    localidad: null,
    direccion: "Colegio Claret, barrio Pance",
    ubicacion: { lat: 3.45, lng: -76.53 },
    reunion: { dia: "sabado", inicio: "14:00", fin: null },
    ramas: ["lobatos", "scouts"],
    contacto: { email: null, whatsapp: null, instagram: null, facebook: null, web: null },
    actualizado: "2025-05",
    ...extra,
  };
}

const fenix = g(815, "Fénix Escarlata", "Cali", {
  ramas: ["lobatos", "scouts", "nomadas", "rovers"],
});
const rozo = g(607, "Zimbabue", "Palmira", {
  localidad: "Rozo",
  ubicacion: { lat: 3.609, lng: -76.388 },
});
const buga = g(315, "Águilas Doradas", "Buga", { ubicacion: { lat: 3.8918, lng: -76.29 } });
const todos = [fenix, rozo, buga];

describe("normalize", () => {
  it("ignora tildes, mayúsculas y espacios extra", () => {
    expect(normalize("  FÉNIX  ")).toBe("fenix");
  });
});

describe("matchesFilters", () => {
  const f = (over: Partial<typeof EMPTY_FILTERS>) => ({ ...EMPTY_FILTERS, ...over });

  it("encuentra por nombre sin tildes ni mayúsculas", () => {
    expect(matchesFilters(fenix, f({ q: "fenix" }))).toBe(true);
    expect(matchesFilters(fenix, f({ q: "  FÉNIX " }))).toBe(true);
  });

  it("encuentra por número, municipio, localidad y dirección", () => {
    expect(matchesFilters(fenix, f({ q: "815" }))).toBe(true);
    expect(matchesFilters(rozo, f({ q: "rozo" }))).toBe(true);
    expect(matchesFilters(fenix, f({ q: "pance" }))).toBe(true);
  });

  it("exige todas las palabras", () => {
    expect(matchesFilters(fenix, f({ q: "fenix cali" }))).toBe(true);
    expect(matchesFilters(fenix, f({ q: "fenix buga" }))).toBe(false);
  });

  it("filtra por municipio (slug)", () => {
    expect(matchesFilters(buga, f({ municipio: "buga" }))).toBe(true);
    expect(matchesFilters(fenix, f({ municipio: "buga" }))).toBe(false);
  });

  it("exige todas las ramas elegidas", () => {
    expect(matchesFilters(fenix, f({ ramas: ["scouts", "rovers"] }))).toBe(true);
    expect(matchesFilters(rozo, f({ ramas: ["scouts", "rovers"] }))).toBe(false);
  });
});

describe("buscar", () => {
  it("sin ubicación ordena por municipio y nombre, sin distancia", () => {
    const r = buscar(todos, EMPTY_FILTERS, null);
    expect(r.map((x) => x.grupo.id)).toEqual([315, 815, 607]);
    expect(r.every((x) => x.distanciaKm === null)).toBe(true);
  });

  it("con ubicación ordena por distancia", () => {
    const enBuga = { lat: 3.9, lng: -76.3 };
    const r = buscar(todos, EMPTY_FILTERS, enBuga);
    expect(r[0]?.grupo.id).toBe(315);
    expect(r[0]?.distanciaKm).toBeLessThan(2);
  });

  it("devuelve vacío si nada coincide", () => {
    expect(buscar(todos, { ...EMPTY_FILTERS, q: "zzz" }, null)).toEqual([]);
  });
});

describe("hasActiveFilters", () => {
  it("detecta filtros activos", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, q: "  " })).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, ramas: ["scouts"] })).toBe(true);
  });
});
