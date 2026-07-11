import { expect, test } from "@playwright/test";
import {
  E2E_CHECKER_FIXTURE_PATH,
  E2E_FIXTURE_PATH,
  ensureCheckerFixture,
  ensureE2eFixture,
} from "./ensure-fixture";
import { gotoBuilder, selectTemplate, uploadPhotos } from "./helpers";

test("capture linked photo clarity", async ({ page }) => {
  ensureE2eFixture();
  await ensureCheckerFixture();
  await gotoBuilder(page);
  await uploadPhotos(page, [E2E_CHECKER_FIXTURE_PATH, E2E_FIXTURE_PATH]);
  await selectTemplate(page, "layered-prints");
  await page.getByTestId("crop-target-bg").click();
  const feed = page.getByTestId("feed-preview-image");
  await expect(feed).toBeVisible({ timeout: 15_000 });
  await feed.evaluate((image: HTMLImageElement) => image.decode());
  await page.locator("main > section").first().screenshot({ path: "/tmp/framinator-linked-tray.png" });
  await page.getByTestId("slide-thumb-1").locator("xpath=..").screenshot({
    path: "/tmp/framinator-linked-slide.png",
  });
  await page.getByTestId("customization-panel").screenshot({
    path: "/tmp/framinator-linked-customize.png",
  });
});
