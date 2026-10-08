import { expect, test } from "@playwright/test";

test.describe("ficha de grupo", () => {
  test("muestra datos y acciones de contacto del grupo 815", async ({ page }) => {
    await page.goto("/grupos/815-fenix-escarlata/");
    await expect(page.getByRole("heading", { level: 1, name: "Fénix Escarlata" })).toBeVisible();
    await expect(page.getByText("Sábados, 2:00 p. m. – 6:00 p. m.")).toBeVisible();
    await expect(page.locator('aside [data-action="email"]')).toHaveAttribute(
      "href",
      /^mailto:valle\.grupo815@scout\.org\.co\?subject=/,
    );
    await expect(page.locator('aside [data-action="directions"]')).toHaveAttribute(
      "href",
      /destination=3\.493053/,
    );
    await expect(page.locator('aside [data-action="instagram"]')).toHaveAttribute(
      "href",
      "https://www.instagram.com/fenix_escarlata_815",
    );
  });

  test("no muestra botones vacíos cuando falta un canal", async ({ page }) => {
    await page.goto("/grupos/815-fenix-escarlata/");
    await expect(page.locator('aside [data-action="whatsapp"]')).toHaveCount(0);
    await expect(page.locator('aside [data-action="facebook"]')).toHaveCount(0);
    for (const link of await page.locator("a[href]").all()) {
      expect(await link.getAttribute("href")).not.toBe("");
    }
  });

  test("grupo sin canales directos ofrece contactar a la Región", async ({ page }) => {
    await page.goto("/grupos/816-san-luis-gonzaga/");
    await expect(page.locator('aside [data-action="region"]')).toHaveAttribute(
      "href",
      "https://vallescout.org.co/",
    );
  });

  test("en móvil, el contacto va antes que el mapa y no hay barra fija", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "solo móvil");
    await page.goto("/grupos/815-fenix-escarlata/");
    await expect(page.locator("[data-contact-bar]")).toHaveCount(0);
    const contact = (await page
      .getByRole("heading", { level: 2, name: "Contacto" })
      .boundingBox())!;
    const map = (await page
      .getByRole("region", { name: /Ubicación del Grupo 815/ })
      .boundingBox())!;
    expect(contact.y).toBeLessThan(map.y);
    // Las acciones aparecen una sola vez en la página.
    await expect(page.locator('[data-action="email"]')).toHaveCount(1);
    await expect(page.locator('[data-action="directions"]')).toHaveCount(1);
  });

  test("en escritorio, el contacto va a la derecha y el mapa bajo los datos", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "solo escritorio");
    await page.goto("/grupos/815-fenix-escarlata/");
    const title = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    const contact = (await page
      .getByRole("heading", { level: 2, name: "Contacto" })
      .boundingBox())!;
    const map = (await page
      .getByRole("region", { name: /Ubicación del Grupo 815/ })
      .boundingBox())!;
    expect(contact.x).toBeGreaterThan(title.x + title.width);
    expect(Math.abs(contact.y - title.y)).toBeLessThan(80);
    expect(map.x).toBeCloseTo(title.x, 0);
    expect(map.y).toBeGreaterThan(title.y);
  });

  test("versión en inglés", async ({ page }) => {
    await page.goto("/en/groups/815-fenix-escarlata/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Saturdays, 2:00 PM – 6:00 PM")).toBeVisible();
    await expect(page.getByText("Nómadas Scout · Venturers")).toBeVisible();
  });

  test("carga el mini mapa", async ({ page }) => {
    await page.goto("/grupos/815-fenix-escarlata/");
    await page.getByRole("region", { name: /Ubicación del Grupo 815/ }).scrollIntoViewIfNeeded();
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });
});
