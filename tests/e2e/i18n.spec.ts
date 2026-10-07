import { expect, test } from "@playwright/test";
import { gotoHydrated, reloadHydrated } from "./helpers";

test("el cambio de idioma conserva la página", async ({ page }) => {
  await page.goto("/grupos/815-fenix-escarlata/");
  await page.getByRole("link", { name: "Ver esta página en inglés" }).click();
  await expect(page).toHaveURL(/\/en\/groups\/815-fenix-escarlata\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "View this page in Spanish" }).click();
  await expect(page).toHaveURL(/\/grupos\/815-fenix-escarlata\/$/);
});

test("hreflang y canonical correctos", async ({ page }) => {
  await page.goto("/en/what-is-scouting/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://buscador.vallescout.org.co/en/what-is-scouting/",
  );
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
    "href",
    "https://buscador.vallescout.org.co/que-es-ser-scout/",
  );
});

test("el tema elegido persiste al recargar", async ({ page }) => {
  await gotoHydrated(page, "/");
  const inicial = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: "Cambiar entre tema claro y oscuro" }).click();
  await reloadHydrated(page);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", inicial ?? "");
});
