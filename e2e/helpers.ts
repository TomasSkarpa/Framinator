import { expect, type Locator, type Page } from "@playwright/test";

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

export async function selectTemplate(page: Page, id = "clean-carousel") {
  await page.getByTestId(`template-${id}`).click();
}

export async function reopenTemplatePicker(page: Page) {
  await page.getByRole("button", { name: "Change" }).click();
  await expect(page.getByTestId("template-picker-done")).toBeVisible();
}

/** dnd-kit needs a pointer move past activation distance (6px). */
export async function dragSortable(page: Page, source: Locator, target: Locator) {
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
