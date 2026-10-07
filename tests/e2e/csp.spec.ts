import { expect, test } from "@playwright/test";
import { gotoHydrated } from "./helpers";

const PAGES = [
  { path: "/", openMap: true },
  { path: "/en/", openMap: true },
  { path: "/grupos/815-fenix-escarlata/", openMap: false },
  { path: "/que-es-ser-scout/", openMap: false },
];

declare global {
  interface Window {
    __csp: string[];
  }
}

for (const { path, openMap } of PAGES) {
  test(`CSP estricta y sin violaciones: ${path}`, async ({ page, isMobile }) => {
    const consola: string[] = [];
    page.on("console", (msg) => {
      if (/Content Security Policy|Refused to/i.test(msg.text())) consola.push(msg.text());
    });
    await page.addInitScript(() => {
      window.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    await gotoHydrated(page, path);

    const metas = page.locator('meta[http-equiv="content-security-policy" i]');
    await expect(metas).toHaveCount(1);
    const policy = (await metas.getAttribute("content")) ?? "";
    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("tile.openstreetmap.org");
    expect(policy).not.toContain("'unsafe-inline'");

    if (openMap && isMobile) {
      await page.getByRole("button", { name: /Ver mapa|Show map/ }).click();
    }
    if (openMap) {
      await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
    } else if (path.includes("/grupos/")) {
      await page.locator(".leaflet-container").scrollIntoViewIfNeeded();
      await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
    }
    await page.waitForLoadState("networkidle");

    expect(await page.evaluate(() => window.__csp)).toEqual([]);
    expect(consola).toEqual([]);
  });
}
