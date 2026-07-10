import { expect, test } from "@playwright/test";
import { E2E_FIXTURE_PATH } from "./ensure-fixture";
import {
  clearSavedProject,
  gotoBuilder,
  reopenTemplatePicker,
  selectTemplate,
  uploadPhoto,
} from "./helpers";

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

  test("brand route uses generic templates with render-time MDC overlay", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await expect(page.getByText("Carousel builder")).toBeVisible();

    await clearSavedProject(page);
    await page.goto("/brand/mdc");
    await uploadPhoto(page, FIXTURE);

    await expect(page.getByText("MDC branding")).toBeVisible();
    await expect(page.getByTestId("template-framed-polaroid")).toBeVisible();
    await expect(page.getByTestId("template-kodak-strip")).toBeVisible();
    await expect(page.getByTestId("template-soft-focus")).toBeVisible();

    const preview = page.getByTestId("template-framed-polaroid").locator("img");
    await expect(preview).toHaveAttribute("src", /^data:image\/jpeg/);

    const bottomCenter = await preview.evaluate(async (img) => {
      const image = img as HTMLImageElement;
      if (!image.complete) {
        await new Promise((resolve) => image.addEventListener("load", resolve, { once: true }));
      }
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(image, 0, 0);
      return Array.from(
        ctx.getImageData(Math.floor(canvas.width / 2), canvas.height - 8, 1, 1).data,
      );
    });

    expect(bottomCenter[0]).toBeGreaterThan(180);
    expect(bottomCenter[1]).toBeLessThan(60);
    expect(bottomCenter[2]).toBeLessThan(60);
  });
});
