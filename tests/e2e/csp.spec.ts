import { expect, test } from "@playwright/test";
import { gotoHydrated } from "./helpers";

for (const path of ["/", "/grupos/815-fenix-escarlata/", "/que-es-ser-scout/", "/en/"]) {
  test(`sin violaciones de CSP: ${path}`, async ({ page, isMobile }) => {
    const violaciones: string[] = [];
    page.on("console", (msg) => {
      if (/Content Security Policy|Refused to/i.test(msg.text())) violaciones.push(msg.text());
    });
    await gotoHydrated(page, path);
    if (isMobile && path.endsWith("/") && !path.includes("grupos")) {
      const btn = page.getByRole("button", { name: /Ver mapa|Show map/ });
      if (await btn.count()) await btn.click();
    }
    await page.waitForLoadState("networkidle");
    expect(violaciones).toEqual([]);
  });
}
