import { expect, test } from "@playwright/test";
import { gotoHydrated, reloadHydrated } from "./helpers";

const cards = (page: import("@playwright/test").Page) => page.locator("li[data-grupo-id]");

test.describe("buscador", () => {
  test("lista los 22 grupos sin filtros", async ({ page }) => {
    await gotoHydrated(page, "/");
    await expect(cards(page)).toHaveCount(22);
    await expect(page.locator("[data-count]")).toHaveText("22 grupos");
  });

  test("busca sin tildes y actualiza la URL", async ({ page }) => {
    await gotoHydrated(page, "/");
    await page.getByLabel("Buscar grupo").fill("fenix");
    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/\?q=fenix$/);
  });

  test("filtra por municipio y ramas; el estado sobrevive a recargar", async ({ page }) => {
    await gotoHydrated(page, "/");
    await page.getByLabel("Municipio").selectOption("palmira");
    await page.getByRole("button", { name: /Rovers/ }).click();
    const n = await cards(page).count();
    expect(n).toBeGreaterThan(0);
    await reloadHydrated(page);
    await expect(cards(page)).toHaveCount(n);
    await expect(page.getByLabel("Municipio")).toHaveValue("palmira");
    await expect(page.getByRole("button", { name: /Rovers/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("ignora parámetros inválidos y no inyecta HTML", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await gotoHydrated(
      page,
      "/?municipio=bogota&rama=foo&q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
    );
    await expect(page.getByLabel("Buscar grupo")).toHaveValue("<img src=x onerror=alert(1)>");
    await expect(page.locator("img[src='x']")).toHaveCount(0);
    await expect(page.getByLabel("Municipio")).toHaveValue("");
    expect(errores).toEqual([]);
  });

  test("estado vacío con acción de limpiar", async ({ page }) => {
    await gotoHydrated(page, "/?q=zzzz");
    await expect(page.getByText("No encontramos grupos con esos filtros")).toBeVisible();
    await page.getByRole("button", { name: "Limpiar filtros" }).first().click();
    await expect(cards(page)).toHaveCount(22);
    await expect(page).toHaveURL(/\/$/);
  });

  test("cerca de mí ordena por distancia cuando hay permiso", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 3.9, longitude: -76.3 }); // Buga
    await gotoHydrated(page, "/");
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await expect(cards(page).first()).toHaveAttribute("data-grupo-id", "315");
    await expect(cards(page).first()).toContainText(/\d+(,\d)? (k)?m/);
  });

  test("cerca de mí sin permiso muestra aviso y conserva el orden", async ({ page, context }) => {
    await context.clearPermissions();
    await gotoHydrated(page, "/");
    const primero = await cards(page).first().getAttribute("data-grupo-id");
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await expect(page.getByText("No pudimos obtener tu ubicación")).toBeVisible();
    await expect(cards(page).first()).toHaveAttribute("data-grupo-id", primero ?? "");
  });

  test("cerca de mí lejos del Valle avisa y conserva el orden", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 4.71, longitude: -74.07 }); // Bogotá
    await gotoHydrated(page, "/");
    const primero = await cards(page).first().getAttribute("data-grupo-id");
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await expect(page.getByText("Parece que estás lejos del Valle del Cauca")).toBeVisible();
    await expect(cards(page).first()).toHaveAttribute("data-grupo-id", primero ?? "");
  });

  test("la tarjeta lleva a la ficha del grupo", async ({ page }) => {
    await gotoHydrated(page, "/?q=815");
    await page.getByRole("link", { name: "Fénix Escarlata" }).click();
    await expect(page).toHaveURL(/\/grupos\/815-fenix-escarlata\/$/);
  });

  test("portada en inglés", async ({ page }) => {
    await gotoHydrated(page, "/en/");
    await expect(page.locator("[data-count]")).toHaveText("22 groups");
    await expect(page.getByRole("link", { name: "Fénix Escarlata" })).toHaveAttribute(
      "href",
      "/en/groups/815-fenix-escarlata/",
    );
  });
});
