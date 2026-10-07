import { describe, expect, it } from "vitest";
import { formatMonth } from "@/i18n/format";
import { alternatePath, grupoPath, langFromPath, pagePath } from "@/i18n/routes";
import { translator, ui } from "@/i18n/ui";

describe("ui", () => {
  it("ambos idiomas tienen exactamente las mismas claves", () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.es).sort());
  });

  it("ningún texto está vacío", () => {
    for (const dict of [ui.es, ui.en])
      for (const v of Object.values(dict)) expect(v.trim()).not.toBe("");
  });

  it("interpola variables", () => {
    expect(translator("es")("grupo.number", { id: 815 })).toBe("Grupo 815");
    expect(translator("en")("grupo.number", { id: 815 })).toBe("Group 815");
  });
});

describe("routes", () => {
  const fenix = { id: 815, nombre: "Fénix Escarlata" };

  it("arma rutas por idioma", () => {
    expect(pagePath("es", "home")).toBe("/");
    expect(pagePath("en", "about")).toBe("/en/what-is-scouting/");
    expect(grupoPath("es", fenix)).toBe("/grupos/815-fenix-escarlata/");
    expect(grupoPath("en", fenix)).toBe("/en/groups/815-fenix-escarlata/");
  });

  it("traduce rutas al otro idioma", () => {
    expect(alternatePath("/grupos/815-fenix-escarlata/", "en")).toBe(
      "/en/groups/815-fenix-escarlata/",
    );
    expect(alternatePath("/en/groups/815-fenix-escarlata/", "es")).toBe(
      "/grupos/815-fenix-escarlata/",
    );
    expect(alternatePath("/que-es-ser-scout/", "en")).toBe("/en/what-is-scouting/");
    expect(alternatePath("/en/", "es")).toBe("/");
    expect(alternatePath("/ruta-desconocida/", "en")).toBe("/en/");
  });

  it("detecta el idioma por la ruta", () => {
    expect(langFromPath("/en/groups/x/")).toBe("en");
    expect(langFromPath("/en/")).toBe("en");
    expect(langFromPath("/grupos/x/")).toBe("es");
    expect(langFromPath("/english/")).toBe("es");
  });
});

describe("formatMonth", () => {
  it("formatea YYYY-MM", () => {
    expect(formatMonth("2025-05", "es")).toBe("mayo de 2025");
    expect(formatMonth("2025-05", "en")).toBe("May 2025");
  });
});
