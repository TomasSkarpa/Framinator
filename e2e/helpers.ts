import { expect, type Page } from "@playwright/test";

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
