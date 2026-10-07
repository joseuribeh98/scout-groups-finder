import { describe, expect, it } from "vitest";
import { MUNICIPIOS, VALLE_BOUNDS, VALLE_CENTER } from "@/data/region";

describe("region", () => {
  it("lista los 42 municipios del Valle sin repetidos", () => {
    expect(MUNICIPIOS).toHaveLength(42);
    expect(new Set(MUNICIPIOS).size).toBe(42);
    expect(MUNICIPIOS).toContain("Cali");
    expect(MUNICIPIOS).toContain("Tuluá");
  });

  it("el centro del mapa está dentro de los límites", () => {
    expect(VALLE_CENTER.lat).toBeGreaterThan(VALLE_BOUNDS.latMin);
    expect(VALLE_CENTER.lat).toBeLessThan(VALLE_BOUNDS.latMax);
    expect(VALLE_CENTER.lng).toBeGreaterThan(VALLE_BOUNDS.lngMin);
    expect(VALLE_CENTER.lng).toBeLessThan(VALLE_BOUNDS.lngMax);
  });
});
