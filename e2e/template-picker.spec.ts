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

  test("brand route uses MDC-specific templates", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await expect(page.getByText("Carousel builder")).toBeVisible();

    await clearSavedProject(page);
    await page.goto("/brand/mdc");
    await uploadPhoto(page, FIXTURE);

    await expect(page.getByText("MDC branding")).toBeVisible();
    await expect(page.getByTestId("template-mdc-editorial-poster-frame")).toBeVisible();
    await expect(page.getByTestId("template-mdc-red-bracket-system")).toBeVisible();
    await expect(page.getByTestId("template-mdc-floating-caption-bar")).toBeVisible();
    await expect(page.getByTestId("template-mdc-white-logo-red-shadow")).toBeVisible();
    await expect(page.getByTestId("template-mdc-repeating-logo-texture")).toBeVisible();
    await expect(page.getByTestId("template-framed-polaroid")).toHaveCount(0);
    await expect(page.getByTestId("template-clean-carousel")).toHaveCount(0);
    await expect(page.getByTestId("template-kodak-strip")).toHaveCount(0);
    await expect(page.getByTestId("template-soft-focus")).toHaveCount(0);
    await expect(page.getByTestId("template-layered-spread-scatter")).toBeVisible();
    await expect(page.getByTestId("template-layered-prints-panorama")).toBeVisible();
    await expect(page.getByTestId("template-layered-prints")).toHaveCount(0);
    await expect(page.getByTestId("template-layered-spread-cascade")).toHaveCount(0);

    const preview = page.getByTestId("template-mdc-editorial-poster-frame").locator("img");
    await expect(preview).toHaveAttribute("src", /^data:image\/jpeg/);

    const posterFrameRed = await preview.evaluate(async (img) => {
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
        ctx.getImageData(Math.floor(canvas.width * 0.08), Math.floor(canvas.height * 0.5), 1, 1)
          .data,
      );
    });

    expect(posterFrameRed[0]).toBeGreaterThan(180);
    expect(posterFrameRed[1]).toBeLessThan(70);
    expect(posterFrameRed[2]).toBeLessThan(70);
  });
});
