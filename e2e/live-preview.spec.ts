import { E2E_FIXTURE_PATH } from "./ensure-fixture";
import { expect, test } from "@playwright/test";
import { gotoBuilder, selectTemplate, uploadPhoto } from "./helpers";

test("opens live preview from the navbar instead of rendering it on the page", async ({ page }) => {
  await gotoBuilder(page);
  await uploadPhoto(page, E2E_FIXTURE_PATH);
  await selectTemplate(page);

  await expect(page.getByTestId("live-preview-button")).toBeVisible();
  await expect(page.getByTestId("feed-preview-frame")).toHaveCount(0);

  await page.getByTestId("live-preview-button").click();

  await expect(page.getByTestId("live-preview-overlay")).toBeVisible();
  await expect(page.getByTestId("feed-preview-frame")).toBeVisible();
  await expect(page.getByTestId("feed-preview-image")).toHaveAttribute("src", /^data:image\//, {
    timeout: 15_000,
  });
});
