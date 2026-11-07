// Run with: npx tsx scripts/password.test.ts
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password";

async function main() {
  const stored = await hashPassword("correct horse");
  assert.ok(!stored.includes("correct horse"));
  assert.equal(await verifyPassword("correct horse", stored), true);
  assert.equal(await verifyPassword("wrong horse", stored), false);
  assert.notEqual(stored, await hashPassword("correct horse")); // salted
  console.log("password ok");
}
main();
