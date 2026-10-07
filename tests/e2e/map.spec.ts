import { expect, test } from "@playwright/test";
import { gotoHydrated } from "./helpers";

test.describe("mapa del buscador", () => {
  test("en escritorio el mapa se muestra junto a la lista", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator(".pin, .marker-cluster-brand").first()).toBeVisible();
  });

  test("filtrar por municipio deja solo sus pines", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/?municipio=buga");
    await expect(page.locator(".leaflet-marker-pane .pin")).toHaveCount(1);
  });

  test("clic en un pin resalta su tarjeta", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/?municipio=buga");
    await page.locator(".leaflet-marker-pane .pin").click();
    await expect(page.locator('li[data-grupo-id="315"]')).toHaveAttribute("data-active", "true");
  });

  test("en móvil el mapa se abre con el botón y no carga antes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/");
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await page.getByRole("button", { name: "Ver lista" }).click();
    await expect(page.locator("li[data-grupo-id]").first()).toBeVisible();
  });

  test("si Leaflet no carga, la lista sigue funcionando y se avisa", async ({ page, isMobile }) => {
    await page.route(/leaflet/i, (route) => route.abort());
    await gotoHydrated(page, "/");
    if (isMobile) await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(page.getByText("No se pudo cargar el mapa")).toBeVisible();
    if (isMobile) await page.getByRole("button", { name: "Ver lista" }).click();
    await page.getByLabel("Buscar grupo").fill("fenix");
    await expect(page.locator("li[data-grupo-id]")).toHaveCount(1);
  });
});
