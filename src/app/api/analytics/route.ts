import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLoggedDatesInRange } from "@/lib/db";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  return getLocalDateString(monday);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setDate(today.getDate() - 365);

    const startDate = getLocalDateString(oneYearAgo);
    const endDate = getLocalDateString(today);

    const loggedDates = await getLoggedDatesInRange(userId, startDate, endDate);

    // Initialize 52 weeks
    const weeks: Record<string, {
      totalCalories: number;
      totalSaturatedFat: number;
      totalProtein: number;
      totalTotalFat: number;
      totalCarbs: number;
      loggedDaysCount: number;
    }> = {};

    const currentMonday = new Date(today);
    const currentDay = currentMonday.getDay();
    const diff = currentMonday.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    currentMonday.setDate(diff);

    for (let i = 0; i < 52; i++) {
      const wDate = new Date(currentMonday);
      wDate.setDate(wDate.getDate() - i * 7);
      const weekStartStr = getLocalDateString(wDate);
      weeks[weekStartStr] = {
        totalCalories: 0,
        totalSaturatedFat: 0,
        totalProtein: 0,
        totalTotalFat: 0,
        totalCarbs: 0,
        loggedDaysCount: 0,
      };
    }

    if (loggedDates.length > 0) {
      // Use Redis pipeline to fetch all daily logs
      const pipeline = redis.pipeline();
      for (const date of loggedDates) {
        pipeline.hvals(`user:${userId}:log:${date}`);
      }
      
      const results = await pipeline.exec();

      for (let i = 0; i < loggedDates.length; i++) {
        const date = loggedDates[i];
        const monday = getMonday(date);
        
        // We only care about the last 52 weeks that are in our initialized map
        if (!weeks[monday]) continue;

        const rawDayItems = results[i] as any[];
        if (!rawDayItems || rawDayItems.length === 0) continue;
        
        const dayItems = rawDayItems.map(entry => {
          if (typeof entry === "string") return JSON.parse(entry);
          return entry;
        });

        if (dayItems.length === 0) continue;

        let dailyCal = 0;
        let dailySatFat = 0;
        let dailyProt = 0;
        let dailyFat = 0;
        let dailyCarbs = 0;

        for (const item of dayItems) {
          const qty = item.quantity || 1;
          dailyCal += (item.calories || 0) * qty;
          dailySatFat += (item.saturatedFat || 0) * qty;
          dailyProt += (item.protein || 0) * qty;
          dailyFat += (item.totalFat || 0) * qty;
          dailyCarbs += (item.carbs || 0) * qty;
        }

        weeks[monday].totalCalories += dailyCal;
        weeks[monday].totalSaturatedFat += dailySatFat;
        weeks[monday].totalProtein += dailyProt;
        weeks[monday].totalTotalFat += dailyFat;
        weeks[monday].totalCarbs += dailyCarbs;
        weeks[monday].loggedDaysCount += 1;
      }
    }

    const result = Object.entries(weeks).map(([weekStart, data]) => {
      const count = data.loggedDaysCount;
      return {
        weekStart,
        loggedDaysCount: count,
        calories: count > 0 ? Math.round((data.totalCalories / count) * 10) / 10 : 0,
        saturatedFat: count > 0 ? Math.round((data.totalSaturatedFat / count) * 10) / 10 : 0,
        protein: count > 0 ? Math.round((data.totalProtein / count) * 10) / 10 : 0,
        totalFat: count > 0 ? Math.round((data.totalTotalFat / count) * 10) / 10 : 0,
        carbs: count > 0 ? Math.round((data.totalCarbs / count) * 10) / 10 : 0,
      };
    }).sort((a, b) => a.weekStart.localeCompare(b.weekStart)); // sort chronologically

    return NextResponse.json({ analytics: result });

  } catch (error) {
    console.error(`[GET /api/analytics] Error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
