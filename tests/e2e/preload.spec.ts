import { expect, test } from "@playwright/test";

test.describe("precarga de módulos del buscador", () => {
  test("la portada precarga la isla y el chunk de Leaflet", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const preloads = [...html.matchAll(/<link rel="modulepreload" href="(\/_astro\/[^"]+)"/g)].map(
      (m) => m[1]!,
    );
    expect(preloads.some((h) => /\/Finder\./.test(h))).toBe(true);
    expect(preloads.some((h) => /\/leaflet-bundle\./.test(h))).toBe(true);
    // Cada chunk precargado existe (no hay enlaces rotos a hashes viejos).
    for (const href of preloads) expect((await request.get(href)).status()).toBe(200);
  });

  test("la versión en inglés también precarga", async ({ request }) => {
    const html = await (await request.get("/en/")).text();
    expect(html).toMatch(/<link rel="modulepreload" href="\/_astro\/leaflet-bundle\./);
  });

  test("las fichas no precargan el buscador", async ({ request }) => {
    const html = await (await request.get("/grupos/815-fenix-escarlata/")).text();
    expect(html).not.toContain('rel="modulepreload"');
  });
});
