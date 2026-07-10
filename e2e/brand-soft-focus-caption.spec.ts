import { expect, test } from "@playwright/test";
import { E2E_CHECKER_FIXTURE_PATH } from "./ensure-fixture";
import { clearSavedProject, uploadPhoto } from "./helpers";

test("MDC soft-focus caption bar renders on both aspect ratios", async ({ page }) => {
  await clearSavedProject(page);
  await page.goto("/brand/mdc");
  await uploadPhoto(page, E2E_CHECKER_FIXTURE_PATH);
  await page.getByTestId("template-soft-focus").click();
  await page.getByTestId("customization-panel").waitFor({ timeout: 10_000 });

  const sampleCaptionBar = async (label: string) => {
    await page.waitForTimeout(1000);
    const preview = page.locator("img[src^='data:image/jpeg']").first();
    await preview.waitFor({ state: "visible", timeout: 15_000 });
    await preview.screenshot({ path: `.tmp/mdc-caption-bar-${label}.png` });

    return preview.evaluate(async (img) => {
      const image = img as HTMLImageElement;
      if (!image.complete) {
        await new Promise((resolve) => image.addEventListener("load", resolve, { once: true }));
      }
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      ctx.drawImage(image, 0, 0);

      const barCenter = ctx.getImageData(
        Math.floor(canvas.width / 2),
        Math.floor(canvas.height * 0.82),
        1,
        1,
      ).data;

      return {
        size: [canvas.width, canvas.height],
        barCenter: [...barCenter],
      };
    });
  };

  const portrait = await sampleCaptionBar("4x5");
  expect(portrait.barCenter[0]).toBeGreaterThan(180);
  expect(portrait.barCenter[1]).toBeLessThan(80);
  expect(portrait.barCenter[2]).toBeLessThan(80);

  await page.getByRole("button", { name: "1080×1080" }).click();
  const square = await sampleCaptionBar("1x1");
  expect(square.barCenter[0]).toBeGreaterThan(180);
  expect(square.barCenter[1]).toBeLessThan(80);
  expect(square.barCenter[2]).toBeLessThan(80);
});
