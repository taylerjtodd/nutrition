/**
 * scripts/verify-db.ts
 *
 * Verifies that all database operations in src/lib/db.ts work correctly
 * against your Upstash Redis instance.
 *
 * Usage:
 *   npx tsx scripts/verify-db.ts
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local.
 */

// Load .env.local before any other imports that touch process.env
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import {
  deleteFoodItem,
  getDailyLog,
  getLoggedDatesInRange,
  getUserSettings,
  logFoodItem,
  saveUserSettings,
} from "../src/lib/db";

const TEST_USER_ID = "test-user-verify-script";
const TEST_DATE = "2026-07-04";

function pass(msg: string) {
  console.log(`  ✅ PASS  ${msg}`);
}
function fail(msg: string, detail?: unknown) {
  console.error(`  ❌ FAIL  ${msg}`, detail ?? "");
}

async function runVerification() {
  console.log("\n🔍 Phase 2 – Database Verification\n");

  // ─── 1. User Settings ───────────────────────────────────────────────────────
  console.log("1️⃣  User Settings");

  await saveUserSettings(TEST_USER_ID, {
    focusMacro: "saturatedFat",
    targetSaturatedFat: 20,
    targetCalories: 2000,
    targetProtein: 150,
    targetTotalFat: 65,
    targetCarbs: 250,
  });
  pass("saveUserSettings()");

  const settings = await getUserSettings(TEST_USER_ID);
  if (
    settings &&
    settings.focusMacro === "saturatedFat" &&
    settings.targetSaturatedFat === 20 &&
    settings.targetProtein === 150
  ) {
    pass("getUserSettings() – correct values returned");
  } else {
    fail("getUserSettings() – unexpected values", settings);
  }

  // Partial update
  await saveUserSettings(TEST_USER_ID, { targetCalories: 1800 });
  const updated = await getUserSettings(TEST_USER_ID);
  if (updated?.targetCalories === 1800 && updated?.targetProtein === 150) {
    pass("saveUserSettings() – partial update preserves other fields");
  } else {
    fail("saveUserSettings() – partial update failed", updated);
  }

  // ─── 2. Log Food Item ───────────────────────────────────────────────────────
  console.log("\n2️⃣  Logging Food Items");

  const item1 = await logFoodItem(TEST_USER_ID, TEST_DATE, {
    name: "Greek Yogurt",
    servingSize: "1 cup (245g)",
    quantity: 1,
    calories: 130,
    saturatedFat: 0,
    totalFat: 0,
    protein: 22,
    carbs: 9,
  });
  if (item1.id && item1.loggedAt) {
    pass(`logFoodItem() – item logged with id: ${item1.id}`);
  } else {
    fail("logFoodItem() – missing id or loggedAt", item1);
  }

  const item2 = await logFoodItem(TEST_USER_ID, TEST_DATE, {
    name: "Almonds",
    servingSize: "1 oz (28g)",
    quantity: 1.5,
    calories: 246,
    saturatedFat: 1.5,
    totalFat: 22.5,
    protein: 10.5,
    carbs: 10.5,
  });
  pass(`logFoodItem() – second item logged with id: ${item2.id}`);

  // ─── 3. Get Daily Log ───────────────────────────────────────────────────────
  console.log("\n3️⃣  Retrieve Daily Log");

  const log = await getDailyLog(TEST_USER_ID, TEST_DATE);
  if (log.length === 2) {
    pass(`getDailyLog() – retrieved ${log.length} items`);
  } else {
    fail(`getDailyLog() – expected 2 items, got ${log.length}`, log);
  }

  const found1 = log.find((i) => i.id === item1.id);
  if (found1?.name === "Greek Yogurt") {
    pass("getDailyLog() – item1 data is correct");
  } else {
    fail("getDailyLog() – item1 not found or incorrect", found1);
  }

  // ─── 4. Delete Food Item ────────────────────────────────────────────────────
  console.log("\n4️⃣  Delete Food Item");

  await deleteFoodItem(TEST_USER_ID, TEST_DATE, item1.id);
  pass("deleteFoodItem() – called without error");

  const afterDelete = await getDailyLog(TEST_USER_ID, TEST_DATE);
  if (
    afterDelete.length === 1 &&
    afterDelete[0].id === item2.id
  ) {
    pass("getDailyLog() – only item2 remains after deletion");
  } else {
    fail("getDailyLog() – unexpected state after deletion", afterDelete);
  }

  // ─── 5. Logged Dates Index ──────────────────────────────────────────────────
  console.log("\n5️⃣  Logged Dates Range Query");

  const dates = await getLoggedDatesInRange(
    TEST_USER_ID,
    "2026-07-01",
    "2026-07-31",
  );
  if (dates.includes(TEST_DATE)) {
    pass(`getLoggedDatesInRange() – "${TEST_DATE}" found in range`);
  } else {
    fail("getLoggedDatesInRange() – expected date not in results", dates);
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  console.log("\n🧹 Cleanup");
  await deleteFoodItem(TEST_USER_ID, TEST_DATE, item2.id);
  pass("Cleaned up remaining food log item");
  console.log("\n✨ Verification complete!\n");
}

runVerification().catch((err) => {
  console.error("\n💥 Verification script crashed:\n", err);
  process.exit(1);
});
