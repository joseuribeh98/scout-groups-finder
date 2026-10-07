import { expect, test } from "@playwright/test";

test("¿Qué es ser scout? lista las cinco ramas con edades oficiales", async ({ page }) => {
  await page.goto("/que-es-ser-scout/");
  await expect(page.getByRole("heading", { level: 1, name: "¿Qué es ser scout?" })).toBeVisible();
  for (const texto of ["Cachorros", "Lobatos", "Scouts", "Nómadas Scout", "Rovers"]) {
    await expect(page.getByRole("heading", { level: 3, name: texto, exact: true })).toBeVisible();
  }
  await expect(page.getByText("15–17 años")).toBeVisible();
});

test("What is Scouting? en inglés", async ({ page }) => {
  await page.goto("/en/what-is-scouting/");
  await expect(page.getByRole("heading", { level: 1, name: "What is Scouting?" })).toBeVisible();
});

test("404 bilingüe con enlace al buscador", async ({ page }) => {
  const res = await page.goto("/no-existe/");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Página no encontrada")).toBeVisible();
  await expect(page.getByText("Page not found")).toBeVisible();
  await page.getByRole("link", { name: "Ir al buscador" }).click();
  await expect(page).toHaveURL(/\/$/);
});
