import { E2E_FIXTURE_PATH } from "./ensure-fixture";
import { expect, test } from "@playwright/test";
import { gotoBuilder, selectTemplate, uploadPhoto } from "./helpers";

const FIXTURE = E2E_FIXTURE_PATH;

async function openExport(page: import("@playwright/test").Page) {
  await page.getByTestId("export-button").click();
  await expect(page.getByTestId("export-overlay")).toBeVisible();
}

test.describe("Export overlay", () => {
  test("button disabled before template selection", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await expect(page.getByTestId("export-button")).toBeDisabled();
  });

  test("button enabled after template selection", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await expect(page.getByTestId("export-button")).toBeEnabled();
  });

  test("opens overlay with rendered slide", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openExport(page);

    const slide = page.getByTestId("export-slide-1").locator("img");
    await expect(slide).toBeVisible({ timeout: 15_000 });
    await expect(slide).toHaveAttribute("src", /^blob:/);
    await expect(page.getByTestId("export-download-zip")).toBeVisible();
  });

  test("close with X", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openExport(page);
    await page.getByTestId("export-overlay-close").click();
    await expect(page.getByTestId("export-overlay")).toHaveCount(0);
  });

  test("close with Escape", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openExport(page);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("export-overlay")).toHaveCount(0);
  });
});
