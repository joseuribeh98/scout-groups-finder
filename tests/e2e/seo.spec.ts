import { expect, test } from "@playwright/test";

test("sitemap: 48 URL con hreflang y lastmod de las fichas", async ({ request }) => {
  const res = await request.get("/sitemap-0.xml");
  expect(res.ok()).toBe(true);
  const xml = await res.text();
  const urls = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  expect(urls).toHaveLength(48);
  for (const u of urls) {
    expect(u).toContain('hreflang="es-CO"');
    expect(u).toContain('hreflang="en"');
    expect(u).toContain('hreflang="x-default"');
  }
  const fenix = urls.filter((u) => u.includes("815-fenix-escarlata"));
  expect(fenix).toHaveLength(2);
  for (const u of fenix) expect(u).toContain("<lastmod>2025-05-01");
  const home = urls.find((u) => /<loc>[^<]*\.org\.co\/<\/loc>/.test(u)) ?? "";
  expect(home).not.toContain("<lastmod>");
});
