/**
 * E2E tests generated from docs/features/photo-crop.feature
 */
import { expect, test } from "@playwright/test";
import {
  E2E_CHECKER_FIXTURE_PATH,
  E2E_FIXTURE_PATH,
  ensureCheckerFixture,
  ensureE2eFixture,
} from "./ensure-fixture";
import {
  confirmSmartLayout,
  DEFAULT_SMART_LAYOUT_PAYLOAD,
  dragCropCanvas,
  gotoBuilder,
  mockSmartLayout,
  openSmartLayout,
  readCropOffset,
  selectTemplate,
  setCropHorizontal,
  uploadPhotos,
  nudgeCropHorizontal,
  zoomCropCanvas,
} from "./helpers";

test.describe("Per-photo crop and zoom", () => {
  test.beforeAll(async () => {
    ensureE2eFixture();
    await ensureCheckerFixture();
  });

  test.beforeEach(async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_CHECKER_FIXTURE_PATH, E2E_FIXTURE_PATH]);
    await selectTemplate(page, "kodak-strip");
  });

  test("Select a slide to crop its photo", async ({ page }) => {
    await page.getByTestId("slide-thumb-2").click();
    await expect(page.getByTestId("crop-sliders")).toBeVisible();
    await expect(page.getByTestId("crop-slider-horizontal")).toBeVisible();
  });

  test("Customize panel adjusts the selected slide photo", async ({ page }) => {
    const before = await readCropOffset(page);
    await setCropHorizontal(page, 55);
    const after = await readCropOffset(page);
    expect(after.offsetX).toBeGreaterThan(before.offsetX);
  });

  test("Reset crop to default from customize panel", async ({ page }) => {
    await setCropHorizontal(page, 90);
    await expect(page.getByTestId("crop-reset")).toBeEnabled();
    await page.getByTestId("crop-reset").click();
    const crop = await readCropOffset(page);
    expect(crop.offsetX).toBe(0);
    expect(crop.offsetY).toBe(0);
    expect(crop.scale).toBe(1);
  });

  test("Smart layout crop is a starting point only", async ({ page }) => {
    await mockSmartLayout(page, DEFAULT_SMART_LAYOUT_PAYLOAD);
    await openSmartLayout(page);
    await confirmSmartLayout(page);
    await expect(page.getByTestId("smart-layout-undo")).toBeVisible({ timeout: 15_000 });

    const suggested = await readCropOffset(page);
    await nudgeCropHorizontal(page, 20);
    const overridden = await readCropOffset(page);
    expect(overridden.offsetX).toBeGreaterThan(suggested.offsetX);

    await page.getByTestId("smart-layout-undo").click();
    const restored = await readCropOffset(page);
    expect(restored.offsetX).toBe(0);
    expect(restored.offsetY).toBe(0);
  });

  test("Tap the feed preview to enter crop mode", async ({ page }) => {
    await page.getByTestId("feed-preview-crop-tap").click();
    await expect(page.getByTestId("crop-overlay")).toBeVisible();
    await expect(page.getByText(/Drag to reposition/)).toBeVisible();
    await expect(page.getByText(/scroll or pinch to zoom/)).toBeVisible();
  });

  test("Drag on preview repositions the photo", async ({ page }) => {
    await page.getByTestId("customize-enter-crop").click();
    const before = await readCropOffset(page);
    await dragCropCanvas(page, -50, 0);
    const after = await readCropOffset(page);
    expect(after.offsetX).not.toBe(before.offsetX);
  });

  test("Zoom on preview updates scale", async ({ page }) => {
    await page.getByTestId("customize-enter-crop").click();
    const before = await readCropOffset(page);
    await zoomCropCanvas(page, -120);
    const after = await readCropOffset(page);
    expect(after.scale).toBeGreaterThan(before.scale);
  });

  test("Crop from photo tray thumbnail", async ({ page }) => {
    await page.getByTestId("photo-tray-adjust-1").click({ force: true });
    await expect(page.getByTestId("crop-overlay")).toBeVisible();
  });

  test("Layered slide picks which photo to crop", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await selectTemplate(page, "layered-prints");

    await expect(page.getByTestId("slide-crop-photo-picker")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("crop-target-bg").click();
    await expect(page.getByTestId("crop-offset-display")).toContainText("offset");

    await page.getByTestId("crop-target-print-0").click();
    await expect(page.getByTestId("crop-sliders")).toBeVisible();
  });
});
