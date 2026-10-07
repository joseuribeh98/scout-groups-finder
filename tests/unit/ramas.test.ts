import { describe, expect, it } from "vitest";
import { RAMA_IDS, RAMAS, isRamaId, ramaLabel, sortRamas } from "@/data/ramas";

describe("ramas", () => {
  it("tiene las cinco ramas en orden oficial", () => {
    expect(RAMA_IDS).toEqual(["cachorros", "lobatos", "scouts", "nomadas", "rovers"]);
  });

  it("usa las edades oficiales de scout.org.co", () => {
    const edades = RAMA_IDS.map((id) => [id, RAMAS[id].edadMin, RAMAS[id].edadMax]);
    expect(edades).toEqual([
      ["cachorros", 5, 6],
      ["lobatos", 7, 10],
      ["scouts", 11, 14],
      ["nomadas", 15, 17],
      ["rovers", 18, 20],
    ]);
  });

  it("usa los nombres nacionales", () => {
    expect(RAMAS.nomadas.nombre).toBe("Nómadas Scout");
    expect(RAMAS.lobatos.nombre).toBe("Lobatos");
  });

  it("ordena según el orden oficial", () => {
    expect(sortRamas(["rovers", "cachorros", "scouts"])).toEqual(["cachorros", "scouts", "rovers"]);
  });

  it("no muta el arreglo original", () => {
    const input = ["rovers", "lobatos"] as const;
    sortRamas(input);
    expect(input).toEqual(["rovers", "lobatos"]);
  });

  it("reconoce ids válidos", () => {
    expect(isRamaId("scouts")).toBe(true);
    expect(isRamaId("tropa")).toBe(false);
    expect(isRamaId("")).toBe(false);
  });

  it("etiqueta en inglés incluye el nombre oficial", () => {
    expect(ramaLabel("nomadas", "es")).toBe("Nómadas Scout");
    expect(ramaLabel("nomadas", "en")).toBe("Nómadas Scout · Venturers");
  });
});
