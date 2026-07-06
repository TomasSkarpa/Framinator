import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

/** 1×1 PNG; generated locally, never committed. */
const FIXTURE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

export const E2E_FIXTURE_DIR = path.join(__dirname, "fixtures");
export const E2E_FIXTURE_PATH = path.join(E2E_FIXTURE_DIR, "test-photo.png");
export const E2E_CHECKER_FIXTURE_PATH = path.join(E2E_FIXTURE_DIR, "checker-photo.png");

export function ensureE2eFixture(): string {
  mkdirSync(E2E_FIXTURE_DIR, { recursive: true });
  writeFileSync(E2E_FIXTURE_PATH, FIXTURE_PNG);
  return E2E_FIXTURE_PATH;
}

export const E2E_PORTRAIT_RIGHT_SUBJECT_PATH = path.join(
  E2E_FIXTURE_DIR,
  "portrait-subject-right.png",
);

export async function ensurePortraitRightSubjectFixture(): Promise<string> {
  mkdirSync(E2E_FIXTURE_DIR, { recursive: true });
  if (existsSync(E2E_PORTRAIT_RIGHT_SUBJECT_PATH)) return E2E_PORTRAIT_RIGHT_SUBJECT_PATH;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const b64 = await page.evaluate(() => {
    const w = 800;
    const h = 1200;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#d0d4dc";
    ctx.fillRect(0, 0, w * 0.62, h);
    ctx.fillStyle = "#8a9199";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(40 + i * 28, 80, 18, h - 160);
    }
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.38, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5cba7";
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.32, 42, 0, Math.PI * 2);
    ctx.fill();
    return c.toDataURL("image/png").split(",")[1] ?? "";
  });
  await browser.close();
  writeFileSync(E2E_PORTRAIT_RIGHT_SUBJECT_PATH, Buffer.from(b64, "base64"));
  return E2E_PORTRAIT_RIGHT_SUBJECT_PATH;
}

export async function ensureCheckerFixture(): Promise<string> {
  mkdirSync(E2E_FIXTURE_DIR, { recursive: true });
  if (existsSync(E2E_CHECKER_FIXTURE_PATH)) return E2E_CHECKER_FIXTURE_PATH;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const b64 = await page.evaluate(() => {
    const w = 400;
    const h = 500;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    for (let y = 0; y < h; y += 20) {
      for (let x = 0; x < w; x += 20) {
        ctx.fillStyle = (x / 20 + y / 20) % 2 ? "#e74c3c" : "#3498db";
        ctx.fillRect(x, y, 20, 20);
      }
    }
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("TEST", 120, 260);
    return c.toDataURL("image/png").split(",")[1] ?? "";
  });
  await browser.close();
  writeFileSync(E2E_CHECKER_FIXTURE_PATH, Buffer.from(b64, "base64"));
  return E2E_CHECKER_FIXTURE_PATH;
}
