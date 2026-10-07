import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "@/lib/search";
import { parseFilters, serializeFilters } from "@/lib/url-state";

const SLUGS = ["buga", "cali", "palmira"];
const parse = (qs: string) => parseFilters(new URLSearchParams(qs), SLUGS);

describe("url-state", () => {
  it("lee filtros válidos", () => {
    expect(parse("q=fenix&municipio=cali&rama=rovers&rama=scouts")).toEqual({
      q: "fenix",
      municipio: "cali",
      ramas: ["scouts", "rovers"],
    });
  });

  it("ignora valores inválidos sin fallar", () => {
    expect(parse("municipio=bogota&rama=foo&rama=scouts&rama=scouts")).toEqual({
      q: "",
      municipio: null,
      ramas: ["scouts"],
    });
  });

  it("recorta búsquedas excesivamente largas y conserva texto literal", () => {
    const largo = "<script>".repeat(50);
    const f = parse(`q=${encodeURIComponent(largo)}`);
    expect(f.q.length).toBe(100);
    expect(f.q.startsWith("<script>")).toBe(true);
  });

  it("serializa y vuelve a leer igual", () => {
    const f = { q: "fénix", municipio: "cali", ramas: ["scouts", "rovers"] as const };
    const qs = serializeFilters({ ...f, ramas: [...f.ramas] });
    expect(qs).toBe("?q=f%C3%A9nix&municipio=cali&rama=scouts&rama=rovers");
    expect(parse(qs.slice(1))).toEqual({ ...f, ramas: [...f.ramas] });
  });

  it("sin filtros no agrega query string", () => {
    expect(serializeFilters(EMPTY_FILTERS)).toBe("");
    expect(serializeFilters({ ...EMPTY_FILTERS, q: "   " })).toBe("");
  });
});
