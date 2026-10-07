import { describe, expect, it } from "vitest";
import { grupoSlug, slugify } from "@/lib/slug";

describe("slug", () => {
  it("quita tildes, mayúsculas y signos", () => {
    expect(slugify("Fénix Escarlata")).toBe("fenix-escarlata");
    expect(slugify("  Águilas   Doradas! ")).toBe("aguilas-doradas");
    expect(slugify("Tuluá")).toBe("tulua");
    expect(slugify("Orión")).toBe("orion");
  });

  it("antepone el número del grupo", () => {
    expect(grupoSlug({ id: 815, nombre: "Fénix Escarlata" })).toBe("815-fenix-escarlata");
  });
});
