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

/**
 * Emula las zonas seguras del iPhone antes de navegar. Playwright no las emula y la CSP bloquea
 * `addStyleTag`, así que se fijan por CSSOM las variables que global.css deriva de `env()`.
 * El script de inicio corre antes de que exista `<html>`: espera a que aparezca.
 */
export async function emulateSafeArea(
  page: Page,
  insets: Partial<Record<"top" | "right" | "bottom" | "left", string>>,
) {
  await page.addInitScript((insets) => {
    const apply = () => {
      for (const [side, px] of Object.entries(insets)) {
        document.documentElement.style.setProperty(`--safe-${side}`, px);
      }
    };
    if (document.documentElement) return apply();
    new MutationObserver((_, observer) => {
      if (!document.documentElement) return;
      apply();
      observer.disconnect();
    }).observe(document, { childList: true });
  }, insets);
}

/** Interfaz visible del buscador: el panel (escritorio) o la hoja (móvil). */
export const ui = (page: Page) => page.locator("[data-finder-ui]:visible");
export const cards = (page: Page) => ui(page).locator("li[data-grupo-id]");

/** Campo de búsqueda visible: el del panel (escritorio) o el flotante sobre el mapa (móvil). */
export const searchBox = (page: Page) => page.locator('input[type="search"]:visible');
