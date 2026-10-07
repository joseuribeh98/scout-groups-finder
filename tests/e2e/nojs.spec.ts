import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("sin JavaScript, la portada lista todos los grupos con enlaces a sus fichas", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/\bjs\b/);
  const items = page.locator("[data-finder-ui]:visible li[data-grupo-id]");
  await expect(items).toHaveCount(22);
  await expect(items.first().getByRole("link", { name: /^Ver ficha de/ })).toHaveAttribute(
    "href",
    /^\/grupos\//,
  );
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  // La página hace scroll: el último grupo es alcanzable.
  await items.last().scrollIntoViewIfNeeded();
  await expect(items.last()).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});
