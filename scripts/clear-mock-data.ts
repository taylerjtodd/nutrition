/**
 * scripts/clear-mock-data.ts
 *
 * Removes mock food log data (items starting with "Mock Meal") for a given user
 * across the last 365 days.
 * 
 * Usage:
 *   npx tsx scripts/clear-mock-data.ts <userId>
 * 
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getLoggedDatesInRange, getDailyLog, deleteFoodItem } from "../src/lib/db";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const args = process.argv.slice(2);
const userId = args[0];

if (!userId) {
  console.error("❌ Error: Missing userId.");
  console.error("Usage: npx tsx scripts/clear-mock-data.ts <userId>");
  process.exit(1);
}

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function clearData() {
  console.log(`\n🧹 Clearing mock data for user: ${userId} over the last 365 days...`);
  
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 365);

  const startDate = getLocalDateString(oneYearAgo);
  const endDate = getLocalDateString(today);

  const loggedDates = await getLoggedDatesInRange(userId, startDate, endDate);
  
  if (loggedDates.length === 0) {
    console.log("No logged dates found for this user in the last year.");
    return;
  }

  let itemsDeleted = 0;
  let daysCleaned = 0;

  for (const date of loggedDates) {
    const items = await getDailyLog(userId, date);
    let dayHadMockItems = false;

    for (const item of items) {
      if (item.name.startsWith("Mock Meal")) {
        await deleteFoodItem(userId, date, item.id);
        itemsDeleted++;
        dayHadMockItems = true;
      }
    }

    if (dayHadMockItems) {
      daysCleaned++;
      
      // Optionally, check if the day is now completely empty
      // and remove it from the sorted set to keep the DB perfectly clean
      const remainingItems = await getDailyLog(userId, date);
      if (remainingItems.length === 0) {
        // Remove from the sorted set
        // The score is the date as an integer (e.g. 20260704)
        await redis.zrem(`user:${userId}:logged_dates`, date);
      }
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`Deleted ${itemsDeleted} mock items across ${daysCleaned} days.`);
}

clearData().catch((err) => {
  console.error("\n💥 Cleanup script crashed:\n", err);
  process.exit(1);
});
