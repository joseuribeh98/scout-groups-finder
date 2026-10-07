import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { grupos } from "@/data/grupos";

const raw = readFileSync("src/data/grupos.json", "utf8");

describe("datos de grupos", () => {
  it("contiene los 22 grupos validados", () => {
    expect(grupos).toHaveLength(22);
  });

  it("no contiene campos ni correos personales", () => {
    for (const campo of ['"jefe"', '"telefono"', '"telefonoAlt"']) expect(raw).not.toContain(campo);
    for (const dominio of ["@gmail.", "@hotmail.", "@yahoo."]) expect(raw).not.toContain(dominio);
  });

  it("Rozo es localidad de Palmira", () => {
    const g = grupos.find((x) => x.id === 607);
    expect(g?.municipio).toBe("Palmira");
    expect(g?.localidad).toBe("Rozo");
  });

  it("migra ramas a los nombres nacionales", () => {
    expect(grupos.find((x) => x.id === 840)?.ramas).toEqual([
      "cachorros",
      "lobatos",
      "scouts",
      "nomadas",
      "rovers",
    ]);
  });

  it("migra el horario del domingo", () => {
    expect(grupos.find((x) => x.id === 909)?.reunion).toEqual({
      dia: "domingo",
      inicio: "10:00",
      fin: "12:30",
    });
  });
});
