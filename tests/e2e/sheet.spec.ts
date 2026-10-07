import { expect, test } from "@playwright/test";
import { cards, gotoHydrated, searchBox, ui } from "./helpers";

test.describe("hoja inferior (móvil)", () => {
  test.skip(({ isMobile }) => !isMobile, "solo móvil");

  test("el asa alterna con clic y con teclado", async ({ page }) => {
    await gotoHydrated(page, "/");
    const grip = ui(page).getByRole("button", { name: "Expandir lista" });
    await grip.click();
    await expect(ui(page)).toHaveAttribute("data-snap", "full");
    await expect(ui(page).getByRole("button", { name: "Contraer lista" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
    await page.keyboard.press("ArrowDown");
    await expect(ui(page)).toHaveAttribute("data-snap", "peek");
    await page.keyboard.press("ArrowUp");
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
  });

  test("arrastrar el asa hacia arriba expande la hoja", async ({ page }) => {
    await gotoHydrated(page, "/");
    const grip = ui(page).locator("[data-sheet-grip]");
    const box = (await grip.boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, y - i * 40);
    await page.mouse.up();
    await expect(ui(page)).toHaveAttribute("data-snap", "full");
  });

  test("enfocar la búsqueda sube la hoja a completa", async ({ page }) => {
    await gotoHydrated(page, "/");
    await searchBox(page).focus();
    await expect(ui(page)).toHaveAttribute("data-snap", "full");
    await searchBox(page).fill("fenix");
    await expect(cards(page)).toHaveCount(1);
  });

  test("con la hoja completa, la lista hace scroll y el mapa sigue", async ({ page }) => {
    await gotoHydrated(page, "/");
    await ui(page).getByRole("button", { name: "Expandir lista" }).click();
    await cards(page).last().scrollIntoViewIfNeeded();
    await expect(cards(page).last()).toBeVisible();
    await expect(page.locator(".leaflet-container")).toBeAttached();
  });

  test("ningún pin queda bajo la hoja asomada", async ({ page }) => {
    await gotoHydrated(page, "/");
    await expect(page.locator(".leaflet-marker-pane .leaflet-marker-icon").first()).toBeVisible();
    // El mapa reajusta el encuadre al medir la hoja: espera a que se asiente.
    await expect(async () => {
      const sheet = (await ui(page).boundingBox())!;
      const pins = await page
        .locator(".leaflet-marker-pane .leaflet-marker-icon")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().bottom));
      for (const bottom of pins) expect(bottom).toBeLessThanOrEqual(sheet.y + 1);
    }).toPass();
  });

  test("al soltar un arrastre en media altura, la atribución queda sobre la hoja", async ({
    page,
  }) => {
    await gotoHydrated(page, "/");
    const grip = ui(page).locator("[data-sheet-grip]");
    const box = (await grip.boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const total = page.viewportSize()!.height;
    await page.mouse.move(x, y);
    await page.mouse.down();
    // Sube ~25% del alto (de 30% a ~55%) y suelta.
    const target = y - total * 0.25;
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, y + ((target - y) * i) / 10);
    await page.mouse.up();
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
    const attribution = page.locator(".leaflet-control-attribution");
    await expect(async () => {
      const a = (await attribution.boundingBox())!;
      const sheet = (await ui(page).boundingBox())!;
      expect(a.y + a.height).toBeLessThanOrEqual(sheet.y + 1);
    }).toPass();
  });

  test("soltar un arrastre corto en la misma posición mantiene los controles sobre la hoja", async ({
    page,
  }) => {
    await gotoHydrated(page, "/");
    await ui(page).getByRole("button", { name: "Expandir lista" }).click();
    await page.keyboard.press("ArrowDown");
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
    // Espera a que termine la transición de alto antes de medir el asa.
    await ui(page).evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const box = (await ui(page).locator("[data-sheet-grip]").boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + 6;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 4; i++) await page.mouse.move(x, y - i * 5);
    await page.mouse.up();
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
    const attribution = page.locator(".leaflet-control-attribution");
    await expect(async () => {
      const a = (await attribution.boundingBox())!;
      const sheet = (await ui(page).boundingBox())!;
      expect(a.y + a.height).toBeLessThanOrEqual(sheet.y + 1);
    }).toPass();
  });

  test("tras enfocar la búsqueda, el asa contrae la hoja a asomada y se queda ahí", async ({
    page,
  }) => {
    await gotoHydrated(page, "/");
    await searchBox(page).focus();
    await expect(ui(page)).toHaveAttribute("data-snap", "full");
    await ui(page).getByRole("button", { name: "Contraer lista" }).click();
    await expect(ui(page)).toHaveAttribute("data-snap", "peek");
    await page.waitForTimeout(300);
    await expect(ui(page)).toHaveAttribute("data-snap", "peek");
  });
});
