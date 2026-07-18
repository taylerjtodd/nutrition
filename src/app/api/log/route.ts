import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDailyLog, logFoodItem, deleteFoodItem } from "@/lib/db";

// GET /api/log?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid or missing 'date' parameter. Expected format: YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const items = await getDailyLog(session.user.id, date);
    return NextResponse.json({ items });
  } catch (error) {
    console.error(`[GET /api/log] Error fetching daily log for user ${session.user.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/log
// Body format: { date: "YYYY-MM-DD", item: { name, servingSize, quantity, calories, saturatedFat, totalFat, protein, carbs } }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, item } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid or missing 'date'" }, { status: 400 });
    }

    if (!item || typeof item !== "object") {
      return NextResponse.json({ error: "Missing 'item' object" }, { status: 400 });
    }

    const {
      name,
      servingSize,
      quantity,
      calories,
      saturatedFat,
      totalFat,
      protein,
      carbs,
    } = item;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Food 'name' must be a non-empty string" }, { status: 400 });
    }

    const formattedItem = {
      name: name.trim(),
      servingSize: typeof servingSize === "string" ? servingSize.trim() : "1 serving",
      quantity: Number(quantity ?? 1),
      calories: Number(calories ?? 0),
      saturatedFat: Number(saturatedFat ?? 0),
      totalFat: Number(totalFat ?? 0),
      protein: Number(protein ?? 0),
      carbs: Number(carbs ?? 0),
    };

    const loggedItem = await logFoodItem(session.user.id, date, formattedItem);
    return NextResponse.json({ success: true, item: loggedItem });
  } catch (error) {
    console.error(`[POST /api/log] Error logging food item for user ${session.user.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/log?date=YYYY-MM-DD&id=UUID
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const id = searchParams.get("id");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid or missing 'date' parameter" }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
  }

  try {
    await deleteFoodItem(session.user.id, date, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/log] Error deleting log entry ${id} for user ${session.user.id}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
