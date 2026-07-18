// ─── USDA FoodData Central – Types & Normalizer ───────────────────────────────

/**
 * Raw shape returned by FDC /foods/search for a single food item.
 * Only the fields we actually use are typed here; the rest are ignored.
 */
export interface FdcFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FdcNutrient[];
}

export interface FdcNutrient {
  nutrientName: string;
  unitName: string;
  value: number;
}

export interface FdcSearchResponse {
  foods: FdcFood[];
  totalHits: number;
}

// ─── App-facing shape ────────────────────────────────────────────────────────

export interface NormalizedFood {
  fdcId: number;
  name: string;
  brand: string | null;
  /** Human-readable serving size label, e.g. "1 tbsp (14g)" or "100 g" */
  servingLabel: string;
  /** Grams per serving – used to scale nutrient values. */
  servingGrams: number;
  /** All nutrient values are expressed *per servingGrams* of food. */
  calories: number;
  totalFat: number;
  saturatedFat: number;
  carbs: number;
  protein: number;
}

// ─── Nutrient extraction helpers ─────────────────────────────────────────────

/**
 * Find the value of a nutrient by matching against its name (case-insensitive).
 * Returns 0 when not found.
 */
function findNutrient(
  nutrients: FdcNutrient[],
  namePredicate: (name: string) => boolean,
  unitPredicate?: (unit: string) => boolean,
): number {
  const match = nutrients.find(
    (n) =>
      namePredicate(n.nutrientName.toLowerCase()) &&
      (unitPredicate ? unitPredicate(n.unitName.toLowerCase()) : true),
  );
  return match?.value ?? 0;
}

/**
 * Scale a per-100g nutrient value to the food's actual serving size.
 *
 * FDC records nutrients per 100 g (or per 100 ml) by convention for most
 * databases. We multiply by servingGrams / 100 to get per-serving values.
 */
function scaleToServing(per100g: number, servingGrams: number): number {
  return Math.round((per100g * servingGrams) / 100 * 100) / 100;
}

// ─── Main normalizer ─────────────────────────────────────────────────────────

/**
 * Convert a raw FDC food object into the clean NormalizedFood shape used
 * throughout the application.
 */
export function normalizeFood(food: FdcFood): NormalizedFood {
  const nutrients = food.foodNutrients ?? [];

  // ── Serving size ────────────────────────────────────────────────────────
  // FDC records nutrients per 100 g. If a brand serving size is provided,
  // scale nutrients to that serving; otherwise fall back to 100 g.
  let servingGrams = 100;
  let servingLabel = "100 g";

  if (food.servingSize && food.servingSizeUnit) {
    const unit = food.servingSizeUnit.toLowerCase();
    // FDC typically uses "g" or "ml"; treat ml ≈ g for water-based foods.
    if (unit === "g" || unit === "ml") {
      servingGrams = food.servingSize;
      servingLabel = `${food.servingSize} ${food.servingSizeUnit}`;
    }
  }

  // ── Nutrient extraction (values are per 100 g in FDC) ───────────────────
  const calories100g = findNutrient(
    nutrients,
    (n) => n.includes("energy"),
    (u) => u === "kcal",
  );

  const protein100g = findNutrient(nutrients, (n) => n.includes("protein"));

  const totalFat100g = findNutrient(
    nutrients,
    (n) => n.includes("total lipid") || (n.includes("fat") && !n.includes("saturated") && !n.includes("trans")),
  );

  const saturatedFat100g = findNutrient(
    nutrients,
    (n) => n.includes("saturated") && !n.includes("trans"),
  );

  const carbs100g = findNutrient(
    nutrients,
    (n) => n.includes("carbohydrate"),
  );

  // ── Scale to serving ─────────────────────────────────────────────────────
  return {
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner ?? food.brandName ?? null,
    servingLabel,
    servingGrams,
    calories: scaleToServing(calories100g, servingGrams),
    totalFat: scaleToServing(totalFat100g, servingGrams),
    saturatedFat: scaleToServing(saturatedFat100g, servingGrams),
    carbs: scaleToServing(carbs100g, servingGrams),
    protein: scaleToServing(protein100g, servingGrams),
  };
}

/**
 * Normalize an entire FDC search response, filtering out any items where
 * all key macros are zero (typically indicates a data-sparse record).
 */
export function normalizeSearchResults(response: FdcSearchResponse): NormalizedFood[] {
  return response.foods
    .map(normalizeFood)
    .filter(
      (f) =>
        f.calories > 0 ||
        f.protein > 0 ||
        f.totalFat > 0 ||
        f.carbs > 0,
    );
}
