import { expect, test } from "@playwright/test";
import { emulateSafeArea } from "./helpers";

test("¿Qué es ser scout? lista las cinco ramas con edades oficiales", async ({ page }) => {
  await page.goto("/que-es-ser-scout/");
  await expect(page.getByRole("heading", { level: 1, name: "¿Qué es ser scout?" })).toBeVisible();
  for (const texto of ["Cachorros", "Lobatos", "Scouts", "Nómadas Scout", "Rovers"]) {
    await expect(page.getByRole("heading", { level: 3, name: texto, exact: true })).toBeVisible();
  }
  await expect(page.getByText("15–17 años")).toBeVisible();
  await expect(page.getByText(/scout\.org\.co y vallescout\.org\.co/)).toBeVisible();
});

test("What is Scouting? en inglés", async ({ page }) => {
  await page.goto("/en/what-is-scouting/");
  await expect(page.getByRole("heading", { level: 1, name: "What is Scouting?" })).toBeVisible();
  await expect(page.getByText(/scout\.org\.co and vallescout\.org\.co/)).toBeVisible();
});

test("la cabecera deja libre la barra de estado del iPhone (inset superior)", async ({ page }) => {
  await emulateSafeArea(page, { top: "59px" });
  await page.goto("/que-es-ser-scout/");
  const header = page.getByRole("banner");
  const box = (await header.boundingBox())!;
  // El fondo de la cabecera cubre la barra de estado y su fila queda debajo de ella.
  expect(box.y).toBe(0);
  const home = (await header.getByRole("link", { name: "Inicio" }).boundingBox())!;
  expect(home.y).toBeGreaterThanOrEqual(59);
});

test("404 bilingüe con enlace al buscador", async ({ page }) => {
  const res = await page.goto("/no-existe/");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Página no encontrada")).toBeVisible();
  await expect(page.getByText("Page not found")).toBeVisible();
  await page.getByRole("link", { name: "Ir al buscador" }).click();
  await expect(page).toHaveURL(/\/$/);
});
