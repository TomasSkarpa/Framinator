import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/** 1×1 PNG; generated locally, never committed. */
const FIXTURE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

export const E2E_FIXTURE_DIR = path.join(__dirname, "fixtures");
export const E2E_FIXTURE_PATH = path.join(E2E_FIXTURE_DIR, "test-photo.png");

export function ensureE2eFixture(): string {
  mkdirSync(E2E_FIXTURE_DIR, { recursive: true });
  writeFileSync(E2E_FIXTURE_PATH, FIXTURE_PNG);
  return E2E_FIXTURE_PATH;
}
