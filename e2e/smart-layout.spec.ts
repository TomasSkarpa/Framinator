/**
 * E2E tests generated from docs/features/smart-layout.feature
 */
import { expect, test } from "@playwright/test";
import {
  E2E_CHECKER_FIXTURE_PATH,
  E2E_FIXTURE_PATH,
  ensureCheckerFixture,
  ensureE2eFixture,
  ensurePortraitRightSubjectFixture,
} from "./ensure-fixture";
import {
  confirmSmartLayout,
  DEFAULT_SMART_LAYOUT_PAYLOAD,
  gotoBuilder,
  mockSmartLayout,
  mockSmartLayoutError,
  openSmartLayout,
  readCropOffset,
  selectTemplate,
  uploadPhoto,
  uploadPhotos,
  nudgeCropHorizontal,
} from "./helpers";

test.describe("Smart layout", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    ensureE2eFixture();
    await ensureCheckerFixture();
    await ensurePortraitRightSubjectFixture();
  });

  test("Smart layout hidden with fewer than two photos", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, E2E_FIXTURE_PATH);
    await expect(page.getByTestId("smart-layout-button")).toHaveCount(0);
  });

  test("Smart layout available with two or more photos", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await expect(page.getByTestId("smart-layout-button")).toBeVisible();
    await expect(page.getByTestId("smart-layout-button")).toBeEnabled();
  });

  test("Confirm before sending thumbnails to Gemini", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await openSmartLayout(page);
    await expect(page.getByText(/Google Gemini/)).toBeVisible();
    await expect(page.getByText(/stay on your device/)).toBeVisible();
  });

  test("Apply a smart layout suggestion", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await selectTemplate(page, "kodak-strip");
    await mockSmartLayout(page, DEFAULT_SMART_LAYOUT_PAYLOAD);

    await openSmartLayout(page);
    await confirmSmartLayout(page);

    await expect(page.getByTestId("smart-layout-undo")).toBeVisible({ timeout: 15_000 });
    const crop = await readCropOffset(page);
    expect(crop.offsetX).toBe(80);
    expect(crop.offsetY).toBe(-20);
    expect(crop.scale).toBeCloseTo(1.12, 2);
  });

  test("Undo smart layout", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await selectTemplate(page, "kodak-strip");
    await mockSmartLayout(page, DEFAULT_SMART_LAYOUT_PAYLOAD);

    const before = await readCropOffset(page);
    await openSmartLayout(page);
    await confirmSmartLayout(page);
    await expect(page.getByTestId("smart-layout-undo")).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => readCropOffset(page)).not.toEqual(before);

    await page.getByTestId("smart-layout-undo").click();
    await expect.poll(async () => readCropOffset(page)).toEqual(before);
    await expect(page.getByTestId("smart-layout-undo")).toHaveCount(0);
  });

  test("Smart layout failure is recoverable", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await mockSmartLayoutError(page, 503, "Smart layout is not configured");

    await openSmartLayout(page);
    await confirmSmartLayout(page);

    await expect(page.getByText(/not configured|failed|Something went wrong/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  });

  test("Override smart layout crops manually", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await selectTemplate(page, "kodak-strip");
    await mockSmartLayout(page, DEFAULT_SMART_LAYOUT_PAYLOAD);

    await openSmartLayout(page);
    await confirmSmartLayout(page);
    await expect(page.getByTestId("smart-layout-undo")).toBeVisible({ timeout: 15_000 });

    const afterLayout = await readCropOffset(page);
    await nudgeCropHorizontal(page, 25);
    const afterNudge = await readCropOffset(page);
    expect(afterNudge.offsetX).toBeGreaterThan(afterLayout.offsetX);
  });

  test("Smart layout reframes off-center portrait on Kodak strip", async ({ page }) => {
    const portrait = await ensurePortraitRightSubjectFixture();
    await gotoBuilder(page);
    await uploadPhotos(page, [portrait, E2E_CHECKER_FIXTURE_PATH]);
    await selectTemplate(page, "kodak-strip");

    await mockSmartLayout(page, {
      photoOrder: [0, 1],
      crops: [{ photoIndex: 0, offsetX: 110, offsetY: -15, scale: 1.18 }],
      postDescription: "Portrait-led carousel.",
      whyArranged: "Lead with the person, then context shots.",
    });

    await openSmartLayout(page);
    await confirmSmartLayout(page);
    await expect(page.getByTestId("smart-layout-undo")).toBeVisible({ timeout: 15_000 });

    const crop = await readCropOffset(page);
    expect(crop.offsetX).toBeGreaterThan(50);
    expect(crop.scale).toBeGreaterThan(1);
  });

  test("Smart layout request includes template frame context", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
    await selectTemplate(page, "kodak-strip");

    let requestBody: Record<string, unknown> | null = null;
    await mockSmartLayout(page, DEFAULT_SMART_LAYOUT_PAYLOAD, (body) => {
      requestBody = body;
    });

    await openSmartLayout(page);
    await confirmSmartLayout(page);
    await expect(page.getByTestId("smart-layout-undo")).toBeVisible({ timeout: 15_000 });

    expect(requestBody?.templateId).toBe("kodak-strip");
    expect(requestBody?.aspectRatio).toBe("4:5");
    expect(Array.isArray(requestBody?.photos)).toBe(true);
  });
});
