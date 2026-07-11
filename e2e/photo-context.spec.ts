import { expect, test } from "@playwright/test";
import {
  E2E_CHECKER_FIXTURE_PATH,
  E2E_FIXTURE_PATH,
  ensureCheckerFixture,
  ensureE2eFixture,
} from "./ensure-fixture";
import { gotoBuilder, selectTemplate, uploadPhotos } from "./helpers";

test.describe("Photo context", () => {
  test.beforeAll(async () => {
    ensureE2eFixture();
    await ensureCheckerFixture();
  });

  test.beforeEach(async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhotos(page, [E2E_FIXTURE_PATH, E2E_CHECKER_FIXTURE_PATH]);
  });

  test("names the photo sequence and its direction", async ({ page }) => {
    const sequence = page.getByTestId("photo-order-sequence");
    await expect(sequence.getByTestId("photo-order-name")).toHaveText([
      "test-photo.png",
      "checker-photo.png",
    ]);
    await expect(sequence.getByText("Starts here")).toBeVisible();
    await expect(sequence.getByText("Ends here")).toBeVisible();
    await page.screenshot({ path: "/tmp/framinator-photo-sequence.png", fullPage: true });
  });

  test("shows the exact photo being customized", async ({ page }) => {
    await selectTemplate(page, "kodak-strip");
    await page.getByTestId("slide-thumb-2").click();

    const summary = page.getByTestId("editing-photo-summary");
    await expect(summary).toContainText("Editing this photo");
    await expect(summary).toContainText("checker-photo.png");
    await expect(summary).toContainText("Slide 2 · Photo");
    await expect(summary.locator("img")).toHaveAttribute(
      "alt",
      "Currently editing checker-photo.png",
    );
    await page.screenshot({ path: "/tmp/framinator-editing-card.png", fullPage: true });
  });
});
