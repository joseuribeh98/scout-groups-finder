import { describe, expect, it } from "vitest";
import { renderOg } from "@/lib/og";

describe("renderOg", () => {
  it("genera un PNG de 1200×630", async () => {
    const png = await renderOg({ titulo: "Fénix Escarlata", subtitulo: "Grupo 815 · Cali" });
    expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer, png.byteOffset);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
  }, 20_000);
});
