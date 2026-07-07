import { expect, type Page } from "@playwright/test";
import type { SmartLayoutApiPayload } from "../src/lib/smart-layout";

export async function clearSavedProject(page: Page) {
  await page.addInitScript(() => {
    void new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("framinator");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

export async function gotoBuilder(page: Page) {
  await clearSavedProject(page);
  await page.goto("/");
  const startFresh = page.getByRole("button", { name: "Start fresh" });
  if (await startFresh.isVisible().catch(() => false)) {
    await startFresh.click();
  }
}

export async function uploadPhoto(page: Page, fixturePath: string) {
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await expect(page.getByText(/1 selected/)).toBeVisible({ timeout: 15_000 });
}

export async function uploadPhotos(page: Page, fixturePaths: string[]) {
  await page.locator('input[type="file"]').setInputFiles(fixturePaths);
  await expect(page.getByText(new RegExp(`${fixturePaths.length} selected`))).toBeVisible({
    timeout: 15_000,
  });
}

export async function selectTemplate(page: Page, id = "clean-carousel") {
  await page.getByTestId(`template-${id}`).click();
  await expect(page.getByTestId("customization-panel")).toBeVisible({ timeout: 10_000 });
}

export async function reopenTemplatePicker(page: Page) {
  await page.getByRole("button", { name: "Change" }).click();
  await expect(page.getByTestId("template-picker-done")).toBeVisible();
}

export async function openSmartLayout(page: Page) {
  await page.getByTestId("smart-layout-button").click();
  await expect(page.getByRole("heading", { name: "Smart layout" })).toBeVisible();
}

export async function confirmSmartLayout(page: Page) {
  await page.getByTestId("smart-layout-arrange").click();
}

export async function mockSmartLayout(
  page: Page,
  payload: SmartLayoutApiPayload,
  onRequest?: (body: Record<string, unknown>) => void,
) {
  await page.route("**/api/smart-layout", async (route) => {
    if (onRequest) {
      onRequest(route.request().postDataJSON() as Record<string, unknown>);
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

export async function mockSmartLayoutError(page: Page, status: number, error: string) {
  await page.route("**/api/smart-layout", async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error }),
    });
  });
}

export type CropOffset = { offsetX: number; offsetY: number; scale: number };

export async function readCropOffset(page: Page): Promise<CropOffset> {
  const display = page.getByTestId("crop-offset-display");
  await expect(display).toBeVisible();
  return {
    offsetX: Number(await display.getAttribute("data-offset-x")),
    offsetY: Number(await display.getAttribute("data-offset-y")),
    scale: Number(await display.getAttribute("data-scale")),
  };
}

export async function setCropHorizontal(page: Page, offsetX: number) {
  const clamped = Math.max(-200, Math.min(200, Math.round(offsetX)));
  const thumb = page.getByTestId("crop-slider-horizontal").getByRole("slider");
  await thumb.scrollIntoViewIfNeeded();
  await thumb.focus();
  await thumb.press("Home");
  const steps = clamped + 200;
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("ArrowRight");
  }
}

export async function nudgeCropHorizontal(page: Page, steps = 20) {
  const thumb = page.getByTestId("crop-slider-horizontal").getByRole("slider");
  await thumb.scrollIntoViewIfNeeded();
  await thumb.focus();
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("ArrowRight");
  }
}

export type PreviewColorStats = {
  count: number;
  ratio: number;
  centerX: number;
  centerY: number;
};

export async function readFeedPreviewRedStats(page: Page): Promise<PreviewColorStats> {
  const image = page.getByTestId("feed-preview-image");
  await expect(image).toBeVisible();
  return image.evaluate(async (img) => {
    const el = img as HTMLImageElement;
    if (!el.complete) {
      await new Promise<void>((resolve, reject) => {
        el.onload = () => resolve();
        el.onerror = () => reject(new Error("Preview image failed to load"));
      });
    }

    const probe = document.createElement("img");
    probe.crossOrigin = "anonymous";
    probe.src = el.currentSrc || el.src;
    await new Promise<void>((resolve, reject) => {
      probe.onload = () => resolve();
      probe.onerror = () => reject(new Error("Preview probe failed to load"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = probe.naturalWidth;
    canvas.height = probe.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(probe, 0, 0);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const r = pixels[i] ?? 0;
        const g = pixels[i + 1] ?? 0;
        const b = pixels[i + 2] ?? 0;
        if (r > 150 && g < 80 && b < 80) {
          count++;
          sumX += x;
          sumY += y;
        }
      }
    }

    if (count === 0) {
      return { count: 0, ratio: 0, centerX: Number.NaN, centerY: Number.NaN };
    }

    return {
      count,
      ratio: count / (canvas.width * canvas.height),
      centerX: sumX / count / canvas.width,
      centerY: sumY / count / canvas.height,
    };
  });
}

/** dnd-kit needs a pointer move past activation distance (6px). */
export async function dragSortable(
  page: Page,
  source: import("@playwright/test").Locator,
  target: import("@playwright/test").Locator,
) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("dragSortable: missing bounding box");

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + to.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 12, startY, { steps: 4 });
  await page.mouse.move(endX, endY, { steps: 24 });
  await page.mouse.up();
}

export const DEFAULT_SMART_LAYOUT_PAYLOAD = {
  photoOrder: [0, 1],
  crops: [
    { photoIndex: 0, offsetX: 80, offsetY: -20, scale: 1.12 },
    { photoIndex: 1, offsetX: 0, offsetY: 0, scale: 1 },
  ],
  postDescription: "A warm carousel from your event photos.",
  whyArranged: "Opened with the strongest portrait, then supporting detail shots.",
} satisfies SmartLayoutApiPayload;
