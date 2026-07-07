/**
 * Debug process for AI arrange crop alignment.
 *
 * This spec uses a deterministic image with a red subject placed low and to the
 * right. A mocked smart-layout crop should move that subject toward the center
 * horizontally and vertically, while zooming in enough to increase its footprint.
 */
import { expect, test } from "@playwright/test";
import {
  E2E_CHECKER_FIXTURE_PATH,
  ensureAlignmentFixture,
  ensureCheckerFixture,
} from "./ensure-fixture";
import {
  confirmSmartLayout,
  gotoBuilder,
  mockSmartLayout,
  openSmartLayout,
  readCropOffset,
  readFeedPreviewRedStats,
  selectTemplate,
  uploadPhotos,
} from "./helpers";

test.describe("Smart layout alignment debug", () => {
  test.beforeAll(async () => {
    await ensureCheckerFixture();
    await ensureAlignmentFixture();
  });

  test("AI crop aligns subject horizontally, vertically, and by zoom", async ({ page }) => {
    const alignmentFixture = await ensureAlignmentFixture();
    await gotoBuilder(page);
    await uploadPhotos(page, [alignmentFixture, E2E_CHECKER_FIXTURE_PATH]);
    await selectTemplate(page, "clean-carousel");

    const before = await readFeedPreviewRedStats(page);
    expect(before.count).toBeGreaterThan(100);

    await mockSmartLayout(page, {
      photoOrder: [0, 1],
      crops: [{ photoIndex: 0, offsetX: 200, offsetY: 200, scale: 1.2 }],
      postDescription: "Alignment debug carousel.",
      whyArranged: "The subject is framed closer to center with a tighter crop.",
    });

    await openSmartLayout(page);
    await confirmSmartLayout(page);
    await expect(page.getByTestId("smart-layout-undo")).toBeVisible({ timeout: 15_000 });

    const crop = await readCropOffset(page);
    expect(crop.offsetX).toBe(200);
    expect(crop.offsetY).toBe(200);
    expect(crop.scale).toBeCloseTo(1.2, 2);

    await expect
      .poll(
        async () => {
          const stats = await readFeedPreviewRedStats(page);
          return (
            stats.count > 100 &&
            stats.centerX < before.centerX - 0.1 &&
            stats.centerY < before.centerY - 0.08 &&
            stats.ratio > before.ratio * 1.15
          );
        },
        { timeout: 10_000 },
      )
      .toBe(true);

    const after = await readFeedPreviewRedStats(page);
    expect(after.count).toBeGreaterThan(100);
    expect(after.centerX).toBeLessThan(before.centerX - 0.1);
    expect(after.centerY).toBeLessThan(before.centerY - 0.08);
    expect(after.ratio).toBeGreaterThan(before.ratio * 1.15);
  });
});
