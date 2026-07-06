import { E2E_FIXTURE_PATH } from "./ensure-fixture";
import { expect, test, type Page } from "@playwright/test";
import { gotoBuilder, selectTemplate, uploadPhoto } from "./helpers";

const FIXTURE = E2E_FIXTURE_PATH;

async function openProfilePreview(page: Page) {
  await page.getByTestId("profile-preview-button").click();
  await expect(page.getByTestId("profile-preview-overlay")).toBeVisible();
}

test.describe("Profile preview overlay", () => {
  test("button hidden before template selection", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await expect(page.getByTestId("profile-preview-button")).toHaveCount(0);
  });

  test("button hidden with no photos", async ({ page }) => {
    await gotoBuilder(page);
    await expect(page.getByTestId("profile-preview-button")).toHaveCount(0);
  });

  test("button appears after template selection", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await expect(page.getByTestId("profile-preview-button")).toBeVisible();
  });

  test("opens overlay with profile mockup and rendered first slide", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openProfilePreview(page);

    await expect(page.getByTestId("instagram-profile-preview")).toBeVisible();
    const latestPost = page.getByTestId("profile-preview-latest-post").locator("img");
    await expect(latestPost).toBeVisible({ timeout: 15_000 });
    await expect(latestPost).toHaveAttribute("src", /^data:image\//);
  });

  test("avatar matches first uploaded photo", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openProfilePreview(page);

    const trayAvatar = page.locator('section img[alt="test-photo.png"]').first();
    const previewAvatar = page.getByTestId("profile-preview-avatar");
    await expect(previewAvatar).toHaveAttribute("src", await trayAvatar.getAttribute("src"));
  });

  test("full-page blurred backdrop", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openProfilePreview(page);

    const overlay = page.getByTestId("dialog-overlay");
    await expect(overlay).toBeVisible();
    const box = await overlay.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.width).toBe(viewport?.width);
    expect(box?.height).toBe(viewport?.height);
  });

  test("close with back control", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openProfilePreview(page);
    await page.getByTestId("profile-preview-close").click();
    await expect(page.getByTestId("profile-preview-overlay")).toHaveCount(0);
  });

  test("close by clicking backdrop", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openProfilePreview(page);
    await page.mouse.click(8, 8);
    await expect(page.getByTestId("profile-preview-overlay")).toHaveCount(0);
  });

  test("close with Escape", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await openProfilePreview(page);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("profile-preview-overlay")).toHaveCount(0);
  });

  test("button hidden when all photos removed", async ({ page }) => {
    await gotoBuilder(page);
    await uploadPhoto(page, FIXTURE);
    await selectTemplate(page);
    await expect(page.getByTestId("profile-preview-button")).toBeVisible();
    await page.getByRole("button", { name: "Remove test-photo.png" }).click();
    await expect(page.getByTestId("profile-preview-button")).toHaveCount(0);
  });
});
