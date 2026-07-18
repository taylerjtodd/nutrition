import { NextRequest, NextResponse } from "next/server";
import {
  type FdcSearchResponse,
  normalizeSearchResults,
} from "@/lib/usda";

// ─── Constants ───────────────────────────────────────────────────────────────

const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const DEFAULT_PAGE_SIZE = 15;

// ─── GET /api/food/search?q=<query>&pageSize=<n> ─────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 },
    );
  }

  const pageSize = Math.min(
    Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE),
    25, // hard cap to avoid runaway requests
  );

  const apiKey = process.env.USDA_API_KEY ?? "DEMO_KEY";

  // ── Forward request to FDC ───────────────────────────────────────────────
  let fdcResponse: Response;
  try {
    const url = new URL(`${FDC_BASE_URL}/foods/search`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("pageSize", String(pageSize));
    // Prefer branded + SR Legacy databases for best nutrient coverage
    url.searchParams.set("dataType", "Branded,SR Legacy,Foundation");

    fdcResponse = await fetch(url.toString(), {
      // Cache for 1 hour – FDC data changes infrequently
      next: { revalidate: 3600 },
    });
  } catch (err) {
    console.error("[/api/food/search] Network error reaching FDC:", err);
    return NextResponse.json(
      { error: "Failed to reach USDA FoodData Central. Please try again." },
      { status: 502 },
    );
  }

  // ── Handle non-OK FDC responses ──────────────────────────────────────────
  if (!fdcResponse.ok) {
    if (fdcResponse.status === 429) {
      return NextResponse.json(
        { error: "USDA API rate limit reached. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    console.error(
      `[/api/food/search] FDC returned ${fdcResponse.status}: ${fdcResponse.statusText}`,
    );
    return NextResponse.json(
      { error: "Unexpected error from USDA FoodData Central." },
      { status: 502 },
    );
  }

  // ── Parse & normalize ────────────────────────────────────────────────────
  let raw: FdcSearchResponse;
  try {
    raw = (await fdcResponse.json()) as FdcSearchResponse;
  } catch (err) {
    console.error("[/api/food/search] Failed to parse FDC JSON:", err);
    return NextResponse.json(
      { error: "Received malformed data from USDA FoodData Central." },
      { status: 502 },
    );
  }

  const foods = normalizeSearchResults(raw);

  return NextResponse.json(
    { foods, totalHits: raw.totalHits ?? foods.length },
    {
      headers: {
        // Allow the browser/CDN to cache this response for 60 s
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
