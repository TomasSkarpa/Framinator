import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { E2E_FIXTURE_DIR } from "./ensure-fixture";
import { gotoBuilder, selectTemplate } from "./helpers";

const FIXTURE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

function writeNamedFixtures(count: number): string[] {
  mkdirSync(E2E_FIXTURE_DIR, { recursive: true });
  return Array.from({ length: count }, (_, i) => {
    const filePath = path.join(E2E_FIXTURE_DIR, `panorama-${i + 1}.png`);
    writeFileSync(filePath, FIXTURE_PNG);
    return filePath;
  });
}

async function uploadPhotos(page: import("@playwright/test").Page, paths: string[]) {
  await page.locator('input[type="file"]').setInputFiles(paths);
  await expect(page.getByText(`${paths.length} selected`)).toBeVisible({ timeout: 15_000 });
}

test.describe("Panorama spread", () => {
  test("assigns overlay before backgrounds across two slides", async ({ page }) => {
    const fixtures = writeNamedFixtures(3);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "layered-prints-panorama");

    await expect(page.getByRole("button", { name: /Drag slide 2/ })).toBeVisible();
    await expect(page.getByText(/Drag slides to change carousel order/)).toBeVisible();

    const slides = page.locator("[data-assigned-names]");
    await expect(slides).toHaveCount(2);
    await expect(slides.nth(0)).toHaveAttribute("data-slide-role", "panorama-left");
    await expect(slides.nth(1)).toHaveAttribute("data-slide-role", "panorama-right");

    const left = await slides.nth(0).getAttribute("data-assigned-names");
    const right = await slides.nth(1).getAttribute("data-assigned-names");
    expect(left).toContain("panorama-1.png");
    expect(left).toContain("panorama-2.png");
    expect(right).toContain("panorama-1.png");
    expect(right).toContain("panorama-3.png");
  });

  test("fills a cross-slide print before either background", async ({ page }) => {
    const fixtures = writeNamedFixtures(1);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "layered-spread-scatter");

    const slides = page.locator("[data-assigned-names]");
    await expect(slides).toHaveCount(2);
    await expect(slides.nth(0)).toHaveAttribute("data-assigned-names", "panorama-1.png");
    await expect(slides.nth(1)).toHaveAttribute("data-assigned-names", "panorama-1.png");
  });

  test("grows to four slides for four photos", async ({ page }) => {
    const fixtures = writeNamedFixtures(4);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "layered-prints-panorama");

    await expect(page.getByRole("button", { name: /Drag slide 4/ })).toBeVisible();
    await expect(page.locator("[data-assigned-names]")).toHaveCount(4);
  });
});
