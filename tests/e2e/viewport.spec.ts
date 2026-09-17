import { expect, type Page, test } from "@playwright/test";

const viewportWidths = [320, 390, 430, 640, 768] as const;

async function expectDocumentInsideViewport(page: Page, screen: string) {
  const width = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));

  expect(
    width.document,
    `${screen} widened the document beyond the viewport`,
  ).toBeLessThanOrEqual(width.viewport);
}

for (const width of viewportWidths) {
  test(`keeps core screens inside a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 932 });
    await page.goto("/");

    const jakeCard = page.getByRole("article").filter({ hasText: "Jake" });
    await expect(jakeCard).toBeVisible();
    await expectDocumentInsideViewport(page, "Pets");

    await jakeCard.getByRole("button", { name: "View journal" }).click();
    await expect(page.getByRole("heading", { name: "Jake" })).toBeVisible();
    await expectDocumentInsideViewport(page, "Pet journal");

    await page.getByRole("button", { name: "Add measurement" }).click();
    await expect(
      page.getByRole("dialog", { name: "Add measurement" }),
    ).toBeVisible();
    await expectDocumentInsideViewport(page, "Add measurement");

    await page.locator('button[aria-label="Cancel"]').click();
    await page.getByRole("button", { name: "Add vaccination" }).click();
    await expect(
      page.getByRole("dialog", { name: "Add vaccination" }),
    ).toBeVisible();
    await expectDocumentInsideViewport(page, "Add vaccination");

    await page.locator('button[aria-label="Cancel"]').click();
    await page.getByRole("button", { name: "Data", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Your data" }),
    ).toBeVisible();
    await expectDocumentInsideViewport(page, "Data");
  });
}
