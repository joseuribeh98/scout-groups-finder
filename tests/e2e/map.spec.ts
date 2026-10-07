import { expect, test } from "@playwright/test";
import { cards, gotoHydrated, searchBox, ui } from "./helpers";

test.describe("mapa del buscador", () => {
  test("en escritorio el mapa se muestra junto a la lista", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator(".pin, .marker-cluster-brand").first()).toBeVisible();
  });

  test("el Valle se resalta con una máscara que desatura el exterior", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    await expect(page.locator(".valle-mask")).toBeAttached();
    await expect(page.locator(".valle-outline")).toBeAttached();
    const blend = await page.evaluate(
      () => getComputedStyle(document.querySelector(".leaflet-overlay-pane")!).mixBlendMode,
    );
    expect(blend).toBe("saturation");
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
    await expect(ui(page).locator('li[data-grupo-id="315"]')).toHaveAttribute(
      "data-active",
      "true",
    );
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

  test("en móvil, el pin enfocado queda por encima del centro del mapa", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/");
    await ui(page).getByRole("button", { name: "Ver Águilas Doradas en el mapa" }).click();
    const mapBox = page.locator(".leaflet-container");
    const pin = page.locator(".leaflet-marker-pane .pin--active");
    await expect(mapBox).toBeVisible();
    await expect(pin).toBeVisible();
    await expect(async () => {
      const m = await mapBox.boundingBox();
      const p = await pin.boundingBox();
      expect(m && p).toBeTruthy();
      expect(p!.y + p!.height / 2).toBeLessThan(m!.y + m!.height / 2 - 4);
    }).toPass();
  });

  test("el pin con popup abierto conserva el resaltado tras pasar por otra tarjeta", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    await page.getByRole("button", { name: "Ver Águilas Doradas en el mapa" }).click();
    await expect(page.locator(".leaflet-popup")).toBeVisible();
    await ui(page).locator('li[data-grupo-id="901"]').hover();
    await expect(ui(page).locator('li[data-grupo-id="901"]')).toHaveAttribute(
      "data-active",
      "true",
    );
    await page.mouse.move(5, 5);
    await expect(ui(page).locator('li[data-grupo-id="315"]')).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(ui(page).locator('li[data-grupo-id="901"]')).not.toHaveAttribute(
      "data-active",
      "true",
    );
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

  test("al acercar, los pines muestran el número del grupo", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/?municipio=buga"); // un solo grupo: fitBounds llega a zoom 15
    const label = page.locator(".leaflet-marker-pane .pin .pin__label");
    await expect(label).toHaveText("315");
    await expect(label).toBeVisible();
  });

  test("los controles de zoom están abajo a la derecha y traducidos", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    const zoomIn = page.locator(".leaflet-bottom.leaflet-right .leaflet-control-zoom-in");
    await expect(zoomIn).toHaveAttribute("aria-label", "Acercar");
  });

  test("los pines son SVG", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/?municipio=buga");
    await expect(page.locator(".leaflet-marker-pane .pin svg")).toBeVisible();
  });

  test("escritorio: ningún pin queda bajo el panel", async ({ page, isMobile }) => {
    test.skip(isMobile, "solo escritorio");
    await gotoHydrated(page, "/");
    await expect(
      page.locator(".leaflet-marker-pane .pin, .leaflet-marker-pane .marker-cluster-brand").first(),
    ).toBeVisible();
    await expect(async () => {
      const panel = await ui(page).boundingBox();
      const pins = await page
        .locator(".leaflet-marker-pane .leaflet-marker-icon")
        .evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          }),
        );
      expect(panel).not.toBeNull();
      for (const p of pins) {
        const overlaps =
          p.x < panel!.x + panel!.width &&
          p.x + p.w > panel!.x &&
          p.y < panel!.y + panel!.height &&
          p.y + p.h > panel!.y;
        expect(overlaps, `pin en ${p.x},${p.y} bajo el panel`).toBe(false);
      }
    }).toPass();
  });

  test("móvil: la hoja arranca asomada y el mapa es visible", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(ui(page)).toHaveAttribute("data-snap", "peek");
    await expect(cards(page).first()).toBeVisible();
  });

  test("móvil: la atribución del mapa no queda bajo la hoja", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/");
    const attribution = page.locator(".leaflet-control-attribution");
    await expect(attribution).toBeVisible();
    const clear = async () => {
      const a = await attribution.boundingBox();
      const sheet = await ui(page).boundingBox();
      expect(a && sheet).toBeTruthy();
      expect(a!.y + a!.height).toBeLessThanOrEqual(sheet!.y + 1);
    };
    await expect(clear).toPass();
    await page.getByRole("button", { name: "Expandir lista" }).click();
    await expect(page.getByRole("button", { name: "Contraer lista" })).toBeVisible();
    await expect(clear).toPass();
  });

  test("móvil: tocar un resultado muestra su tarjeta en la hoja", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/");
    await ui(page).getByRole("button", { name: "Ver Águilas Doradas en el mapa" }).click();
    const card = ui(page).locator("[data-selected-card]");
    await expect(card).toContainText("Águilas Doradas");
    await expect(card).toBeFocused();
    await expect(card.getByRole("link", { name: "Ver ficha" })).toHaveAttribute(
      "href",
      "/grupos/315-aguilas-doradas/",
    );
    await expect(ui(page)).toHaveAttribute("data-snap", "half");
    await expect(card.getByRole("link", { name: "Ver ficha" })).toBeInViewport();
    await expect(page).not.toHaveURL(/\/grupos\//);
    await ui(page).getByRole("button", { name: "Volver a la lista" }).click();
    await expect(cards(page)).toHaveCount(22);
    await expect(
      ui(page).getByRole("button", { name: "Ver Águilas Doradas en el mapa" }),
    ).toBeFocused();
  });

  test("móvil: tocar un pin muestra su tarjeta en la hoja", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo móvil");
    await gotoHydrated(page, "/?municipio=buga");
    await page.locator(".leaflet-marker-pane .pin").click();
    await expect(ui(page).locator("[data-selected-card]")).toContainText("Águilas Doradas");
    await expect(page.locator(".leaflet-popup")).toHaveCount(0);
  });

  test("si Leaflet no carga, la lista sigue funcionando y se avisa", async ({ page }) => {
    await page.route(/leaflet-bundle[^/]*\.js(\?|$)/i, (route) => route.abort());
    await gotoHydrated(page, "/");
    await expect(page.getByText("No se pudo cargar el mapa")).toBeVisible();
    await searchBox(page).fill("fenix");
    await expect(cards(page)).toHaveCount(1);
  });
});
