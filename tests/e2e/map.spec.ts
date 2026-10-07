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

  test("clic en un pin abre el popup con horario y enlace a la ficha", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/?municipio=buga");
    await page.locator(".leaflet-marker-pane .pin").click();
    const popup = page.locator(".leaflet-popup");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Águilas Doradas");
    await expect(
      popup.getByText(/sábado|domingo|lunes|martes|miércoles|jueves|viernes/i),
    ).toBeVisible();
    await expect(popup.getByRole("link", { name: "Ver ficha" })).toHaveAttribute(
      "href",
      "/grupos/315-aguilas-doradas/",
    );
    await expect(page).not.toHaveURL(/\/grupos\//);
  });

  test("clic en la tarjeta muestra el grupo en el mapa sin navegar", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    await page.getByRole("button", { name: "Ver Águilas Doradas en el mapa" }).click();
    const popup = page.locator(".leaflet-popup");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Águilas Doradas");
    await expect(popup.getByRole("link", { name: "Ver ficha" })).toHaveAttribute(
      "href",
      "/grupos/315-aguilas-doradas/",
    );
    await expect(page).not.toHaveURL(/\/grupos\//);
  });

  test("en móvil, clic en la tarjeta cambia al mapa y abre el popup", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/");
    await page.getByRole("button", { name: "Ver Águilas Doradas en el mapa" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    const popup = page.locator(".leaflet-popup");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Águilas Doradas");
    await expect(page).not.toHaveURL(/\/grupos\//);
  });

  test("los clusters centran su número", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    const span = page.locator(".marker-cluster-brand span").first();
    await expect(span).toBeVisible();
    // Se miden ambas cajas en la misma pasada: el mapa puede estar animando.
    const offset = await span.evaluate((el) => {
      const c = el.getBoundingClientRect();
      const p = (el.parentElement as HTMLElement).getBoundingClientRect();
      return {
        dx: Math.abs(c.x + c.width / 2 - (p.x + p.width / 2)),
        dy: Math.abs(c.y + c.height / 2 - (p.y + p.height / 2)),
      };
    });
    expect(offset.dx).toBeLessThanOrEqual(2);
    expect(offset.dy).toBeLessThanOrEqual(2);
  });

  test("los pines son SVG", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/?municipio=buga");
    await expect(page.locator(".leaflet-marker-pane .pin svg")).toBeVisible();
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

  test("en móvil, filtrar con el mapa oculto reajusta la vista al mostrarlo", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/");
    await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await page.getByRole("button", { name: "Ver lista" }).click();
    await page.getByLabel("Municipio").selectOption("buga");
    await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(page.locator(".leaflet-marker-pane .pin")).toHaveCount(1);
    await expect(page.locator(".leaflet-marker-pane .pin")).toBeVisible();
  });

  test("si Leaflet no carga, la lista sigue funcionando y se avisa", async ({ page, isMobile }) => {
    await page.route(/leaflet[^/]*-src\.[^/]*\.js(\?|$)/i, (route) => route.abort());
    await gotoHydrated(page, "/");
    if (isMobile) await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(page.getByText("No se pudo cargar el mapa")).toBeVisible();
    if (isMobile) await page.getByRole("button", { name: "Ver lista" }).click();
    await page.getByLabel("Buscar grupo").fill("fenix");
    await expect(page.locator("li[data-grupo-id]")).toHaveCount(1);
  });
});
