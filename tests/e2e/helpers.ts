import { expect, type Page } from "@playwright/test";

/** Espera a que todas las islas de Astro estén hidratadas antes de interactuar. */
export async function waitHydrated(page: Page) {
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}

export async function gotoHydrated(page: Page, url: string) {
  await page.goto(url);
  await waitHydrated(page);
}

export async function reloadHydrated(page: Page) {
  await page.reload();
  await waitHydrated(page);
}

/** Interfaz visible del buscador: el panel (escritorio) o la hoja (móvil). Hasta Task 5 es la única. */
export const ui = (page: Page) => page.locator("[data-finder-ui]:visible");
export const cards = (page: Page) => ui(page).locator("li[data-grupo-id]");
