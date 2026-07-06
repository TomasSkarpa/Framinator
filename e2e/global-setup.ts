import { ensureCheckerFixture, ensureE2eFixture } from "./ensure-fixture";

export default async function globalSetup() {
  ensureE2eFixture();
  await ensureCheckerFixture();
}
