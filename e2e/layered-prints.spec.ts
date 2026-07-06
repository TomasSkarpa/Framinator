import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { E2E_FIXTURE_DIR } from "./ensure-fixture";
import { gotoBuilder, dragSortable, selectTemplate } from "./helpers";

const FIXTURE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

function writeNamedFixtures(count: number): string[] {
  mkdirSync(E2E_FIXTURE_DIR, { recursive: true });
  return Array.from({ length: count }, (_, i) => {
    const filePath = path.join(E2E_FIXTURE_DIR, `layered-${i + 1}.png`);
    writeFileSync(filePath, FIXTURE_PNG);
    return filePath;
  });
}

async function uploadPhotos(page: import("@playwright/test").Page, paths: string[]) {
  await page.locator('input[type="file"]').setInputFiles(paths);
  await expect(page.getByText(`${paths.length} selected`)).toBeVisible({ timeout: 15_000 });
}

test.describe("Layered prints", () => {
  test("opens four slides and sticky slide reorder keeps assignments", async ({ page }) => {
    const fixtures = writeNamedFixtures(4);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "layered-prints");

    await expect(page.getByRole("button", { name: /Drag slide 4/ })).toBeVisible();
    await expect(page.getByText(/Drag photos to set fill order/)).toBeVisible();
    await expect(page.getByText(/Photos stay on each slide/)).toBeVisible();

    const slides = page.locator("[data-assigned-names]");
    await expect(slides.nth(1)).toHaveAttribute("data-slide-role", "caption");
    const before = await slides.nth(1).getAttribute("data-assigned-names");

    await dragSortable(
      page,
      page.getByRole("button", { name: "Drag slide 2" }),
      slides.nth(0),
    );

    await expect(slides.nth(0)).toHaveAttribute("data-slide-role", "caption");
    await expect(slides.nth(0)).toHaveAttribute("data-assigned-names", before ?? "");
  });

  test("photo tray reorder reflows fill order", async ({ page }) => {
    const fixtures = writeNamedFixtures(2);
    await gotoBuilder(page);
    await uploadPhotos(page, fixtures);
    await selectTemplate(page, "layered-prints");

    const heroBefore = await page
      .locator("[data-assigned-names]")
      .first()
      .getAttribute("data-assigned-names");

    await dragSortable(
      page,
      page.getByRole("button", { name: /Drag photo 2/ }),
      page.getByRole("button", { name: /Drag photo 1/ }),
    );

    await expect(page.locator("[data-assigned-names]").first()).not.toHaveAttribute(
      "data-assigned-names",
      heroBefore ?? "",
    );
  });
});
