import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { grupos, municipiosConGrupos } from "@/data/grupos";

const raw = readFileSync("src/data/grupos.json", "utf8");

describe("datos de grupos", () => {
  it("contiene los 22 grupos validados", () => {
    expect(grupos).toHaveLength(22);
  });

  it("no contiene campos ni correos personales", () => {
    for (const campo of ['"jefe"', '"telefono"', '"telefonoAlt"']) expect(raw).not.toContain(campo);
    for (const dominio of ["@gmail.", "@hotmail.", "@yahoo."]) expect(raw).not.toContain(dominio);
  });

  it("solo contiene canales de contacto permitidos", () => {
    const emails: string[] = [];
    for (const g of grupos) {
      const c = g.contacto;
      if (c.email !== null) {
        expect(c.email).toMatch(/^[^@\s]+@scout\.org\.co$/i);
        emails.push(c.email);
      }
      for (const url of [c.instagram, c.facebook, c.web]) {
        if (url !== null) expect(url).toMatch(/^https:\/\//);
      }
      if (c.whatsapp !== null) expect(c.whatsapp).toMatch(/^57\d{10}$/);
    }
    const sinCorreos = emails.reduce((acc, e) => acc.replace(e, ""), raw);
    expect(sinCorreos).not.toContain("@");
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

  it("lista los municipios con grupos, ordenados y con conteo", () => {
    expect(municipiosConGrupos).toEqual([
      { slug: "buga", nombre: "Buga", count: 1 },
      { slug: "cali", nombre: "Cali", count: 14 },
      { slug: "candelaria", nombre: "Candelaria", count: 1 },
      { slug: "cartago", nombre: "Cartago", count: 1 },
      { slug: "palmira", nombre: "Palmira", count: 4 },
      { slug: "tulua", nombre: "Tuluá", count: 1 },
    ]);
  });
});
