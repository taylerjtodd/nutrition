import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserSettings, saveUserSettings, type UserSettings } from "@/lib/db";

const DEFAULT_SETTINGS: UserSettings = {
  focusMacro: "saturatedFat",
  targetSaturatedFat: 20,
  targetCalories: 2000,
  targetProtein: 50,
  targetTotalFat: 65,
  targetCarbs: 260,
};

// GET /api/settings
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getUserSettings(session.user.id);
    return NextResponse.json({ settings: settings ?? DEFAULT_SETTINGS });
  } catch (error) {
    console.error(`[GET /api/settings] Error fetching settings for user ${session.user.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Missing 'settings' object in request body" }, { status: 400 });
    }

    // Sanitize targets and ensure they are valid numbers/strings
    const updatedSettings: Partial<UserSettings> = {};

    if (settings.focusMacro !== undefined) {
      const val = settings.focusMacro;
      if (["saturatedFat", "calories", "protein", "totalFat", "carbs"].includes(val)) {
        updatedSettings.focusMacro = val;
      } else {
        return NextResponse.json({ error: `Invalid focusMacro: ${val}` }, { status: 400 });
      }
    }

    const numericFields: Array<keyof Omit<UserSettings, "focusMacro">> = [
      "targetSaturatedFat",
      "targetCalories",
      "targetProtein",
      "targetTotalFat",
      "targetCarbs",
    ];

    for (const field of numericFields) {
      if (settings[field] !== undefined) {
        const val = Number(settings[field]);
        if (Number.isNaN(val) || val < 0) {
          return NextResponse.json({ error: `Invalid value for ${field}: must be a non-negative number` }, { status: 400 });
        }
        updatedSettings[field] = val;
      }
    }

    await saveUserSettings(session.user.id, updatedSettings);

    // Return the merged settings
    const current = await getUserSettings(session.user.id);
    return NextResponse.json({ success: true, settings: current ?? DEFAULT_SETTINGS });
  } catch (error) {
    console.error(`[POST /api/settings] Error saving settings for user ${session.user.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
