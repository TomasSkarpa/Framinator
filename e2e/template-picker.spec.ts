import { expect, test } from "@playwright/test";
import { E2E_FIXTURE_PATH } from "./ensure-fixture";
import { gotoBuilder, reopenTemplatePicker, selectTemplate, uploadPhoto } from "./helpers";

const FIXTURE = E2E_FIXTURE_PATH;

test.describe("Template picker", () => {
  test("Done button closes expanded picker", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await reopenTemplatePicker(page);
    await page.getByTestId("template-picker-done").click();
    await expect(page.getByRole("button", { name: "Change" })).toBeVisible();
    await expect(page.getByTestId("template-picker-done")).toHaveCount(0);
  });

  test("Done button shows pointer cursor on hover", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await reopenTemplatePicker(page);

    const done = page.getByTestId("template-picker-done");
    const cursor = await done.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe("pointer");
  });
});
