import { E2E_CHECKER_FIXTURE_PATH } from "./ensure-fixture";
import { expect, test } from "@playwright/test";
import { gotoBuilder, reopenTemplatePicker, selectTemplate, uploadPhoto } from "./helpers";

async function backdropSharpness(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    function laplacianVar(dataUrl: string, sx: number, sy: number, sw: number, sh: number) {
      return new Promise<number>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = sw;
          c.height = sh;
          const ctx = c.getContext("2d");
          if (!ctx) {
            resolve(0);
            return;
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
          const d = ctx.getImageData(0, 0, sw, sh).data;
          let sum = 0;
          let sumSq = 0;
          let n = 0;
          for (let y = 1; y < sh - 1; y++) {
            for (let x = 1; x < sw - 1; x++) {
              const i = (y * sw + x) * 4;
              const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
              const gL = 0.299 * d[i - 4] + 0.587 * d[i - 3] + 0.114 * d[i - 2];
              const gR = 0.299 * d[i + 4] + 0.587 * d[i + 5] + 0.114 * d[i + 6];
              const lap = gL + gR - 2 * g;
              sum += lap;
              sumSq += lap * lap;
              n++;
            }
          }
          const mean = sum / n;
          resolve(sumSq / n - mean * mean);
        };
        img.src = dataUrl;
      });
    }

    const imgs = [...document.querySelectorAll("img")].filter((i) =>
      i.src.startsWith("data:image/jpeg"),
    );
    const main = imgs.sort(
      (a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight,
    )[0];
    if (!main) return 0;
    const w = main.naturalWidth;
    const h = main.naturalHeight;
    return laplacianVar(main.src, 5, 5, Math.round(w * 0.14), Math.round(h * 0.14));
  });
}

test.describe("Soft focus", () => {
  test("blurs backdrop outside print frame", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, E2E_CHECKER_FIXTURE_PATH);
    await selectTemplate(page, "soft-focus");
    await expect(page.getByText(/Slide 1 of 1/)).toBeVisible();
    await expect
      .poll(() => backdropSharpness(page), { timeout: 15_000 })
      .toBeGreaterThan(0);

    const softCorner = await backdropSharpness(page);

    await reopenTemplatePicker(page);
    await selectTemplate(page, "clean-carousel");
    await expect
      .poll(() => backdropSharpness(page), { timeout: 15_000 })
      .toBeGreaterThan(softCorner * 2);
  });
});
