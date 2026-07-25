/**
 * scripts/seed-mock-data.ts
 *
 * Seeds mock food log data for a given user across the last 365 days.
 * 
 * Usage:
 *   npx tsx scripts/seed-mock-data.ts <userId>
 * 
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { logFoodItem } from "../src/lib/db";

const args = process.argv.slice(2);
const userId = args[0];

if (!userId) {
  console.error("❌ Error: Missing userId.");
  console.error("Usage: npx tsx scripts/seed-mock-data.ts <userId>");
  process.exit(1);
}

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function seedData() {
  console.log(`\n🌱 Seeding mock data for user: ${userId} over the last 365 days...`);
  
  const today = new Date();
  let daysSeeded = 0;
  let itemsLogged = 0;

  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // ~70% chance to log on any given day
    if (Math.random() > 0.7) continue;

    daysSeeded++;
    
    const dateStr = getLocalDateString(d);
    
    // Generate 2-3 mock meals
    const mealCount = Math.floor(Math.random() * 2) + 2; 
    
    for (let m = 0; m < mealCount; m++) {
      // Vary around means: Calories ~ 800, Saturated Fat ~ 6g, Protein ~ 30g, Total Fat ~ 25g, Carbs ~ 90g
      const cal = Math.round((Math.random() * 0.4 + 0.8) * 800); // 640 - 960
      const satFat = Math.round((Math.random() * 0.4 + 0.8) * 6 * 10) / 10;
      const prot = Math.round((Math.random() * 0.4 + 0.8) * 30 * 10) / 10;
      const tFat = Math.round((Math.random() * 0.4 + 0.8) * 25 * 10) / 10;
      const carbs = Math.round((Math.random() * 0.4 + 0.8) * 90 * 10) / 10;
      
      await logFoodItem(userId, dateStr, {
        name: `Mock Meal ${m + 1}`,
        servingSize: "1 serving",
        quantity: 1,
        calories: cal,
        saturatedFat: satFat,
        totalFat: tFat,
        protein: prot,
        carbs: carbs,
      });
      itemsLogged++;
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`Logged ${itemsLogged} items across ${daysSeeded} days.`);
}

seedData().catch((err) => {
  console.error("\n💥 Seeding script crashed:\n", err);
  process.exit(1);
});
