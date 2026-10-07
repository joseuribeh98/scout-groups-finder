import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { gotoHydrated } from "./helpers";

const PAGES = [
  "/",
  "/grupos/815-fenix-escarlata/",
  "/que-es-ser-scout/",
  "/en/",
  "/en/groups/815-fenix-escarlata/",
  "/en/what-is-scouting/",
  "/no-existe/",
];

for (const theme of ["light", "dark"] as const) {
  for (const path of PAGES) {
    test(`sin violaciones serias de accesibilidad: ${path} (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await gotoHydrated(page, path);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const serias = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        serias,
        JSON.stringify(
          serias.map((v) => [v.id, v.nodes.map((n) => n.target)]),
          null,
          2,
        ),
      ).toEqual([]);
    });
  }
}
