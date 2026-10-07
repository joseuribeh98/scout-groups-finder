import { describe, expect, it } from "vitest";
import { distanceKm, formatDistance } from "@/lib/geo";

describe("geo", () => {
  it("calcula la distancia Cali–Palmira (~27 km)", () => {
    const d = distanceKm({ lat: 3.4516, lng: -76.532 }, { lat: 3.5394, lng: -76.3036 });
    expect(d).toBeGreaterThan(25);
    expect(d).toBeLessThan(28);
  });

  it("distancia cero al mismo punto", () => {
    expect(distanceKm({ lat: 3.4, lng: -76.5 }, { lat: 3.4, lng: -76.5 })).toBe(0);
  });

  it("formatea según idioma y magnitud", () => {
    expect(formatDistance(0.853, "es")).toBe("850 m");
    expect(formatDistance(2.345, "es")).toBe("2,3 km");
    expect(formatDistance(2.345, "en")).toBe("2.3 km");
    expect(formatDistance(23.4, "es")).toBe("23 km");
  });
});
