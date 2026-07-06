import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { E2E_FIXTURE_DIR } from "./ensure-fixture";
import { gotoBuilder, selectTemplate } from "./helpers";

const FIXTURE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

function writeNamedFixtures(count: number): string[] {
  mkdirSync(E2E_FIXTURE_DIR, { recursive: true });
  return Array.from({ length: count }, (_, i) => {
    const filePath = path.join(E2E_FIXTURE_DIR, `crop-${i + 1}.png`);
    writeFileSync(filePath, FIXTURE_PNG);
    return filePath;
  });
}

async function uploadPhotos(page: import("@playwright/test").Page, paths: string[]) {
  await page.locator('input[type="file"]').setInputFiles(paths);
  await expect(page.getByText(`${paths.length} selected`)).toBeVisible({ timeout: 15_000 });
}

test.describe("Photo crop", () => {
  test("layered hero slide crops each photo independently", async ({ page }) => {
    const fixtures = writeNamedFixtures(3);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "layered-prints");

    const picker = page.getByTestId("slide-crop-photo-picker");
    await expect(picker).toBeVisible();
    await expect(picker.getByTestId("crop-target-bg")).toBeVisible();
    await expect(picker.getByTestId("crop-target-print-0")).toBeVisible();

    await picker.getByTestId("crop-target-bg").click();
    const display = page.getByTestId("crop-offset-display");
    await expect(display).toHaveAttribute("data-offset-x", "0");

    await page.getByTestId("crop-slider-horizontal").locator('[role="slider"]').click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const bgOffset = await display.getAttribute("data-offset-x");
    expect(Number(bgOffset)).not.toBe(0);

    await picker.getByTestId("crop-target-print-0").click();
    await expect(display).toHaveAttribute("data-offset-x", "0");

    await page.getByTestId("crop-slider-vertical").locator('[role="slider"]').click();
    await page.keyboard.press("ArrowUp");
    const printOffsetY = await display.getAttribute("data-offset-y");
    expect(Number(printOffsetY)).not.toBe(0);

    await picker.getByTestId("crop-target-bg").click();
    await expect(display).toHaveAttribute("data-offset-x", bgOffset ?? "");
  });

  test("tap preview enters crop mode and drag updates sliders", async ({ page }) => {
    const fixtures = writeNamedFixtures(2);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "clean-carousel");

    await page.getByTestId("feed-preview-crop-tap").click();
    await expect(page.getByTestId("crop-overlay")).toBeVisible();

    const display = page.getByTestId("crop-offset-display");
    const beforeX = await display.getAttribute("data-offset-x");

    const canvas = page.getByTestId("crop-overlay").locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("crop canvas missing");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();

    const afterX = await display.getAttribute("data-offset-x");
    expect(afterX).not.toBe(beforeX);

    await page.getByTestId("crop-done").click();
    await expect(page.getByTestId("crop-overlay")).not.toBeVisible();
  });

  test("tray Adjust opens crop for photo slide", async ({ page }) => {
    const fixtures = writeNamedFixtures(2);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "clean-carousel");

    await page.getByTestId("photo-tray-adjust-1").click({ force: true });
    await expect(page.getByTestId("crop-overlay")).toBeVisible();
  });

  test("reset crop returns to default", async ({ page }) => {
    const fixtures = writeNamedFixtures(1);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "clean-carousel");

    await page.getByTestId("crop-slider-zoom").locator('[role="slider"]').click();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("crop-reset")).toBeEnabled();

    await page.getByTestId("crop-reset").click();
    await expect(page.getByTestId("crop-offset-display")).toHaveAttribute("data-scale", "1");
  });
});
