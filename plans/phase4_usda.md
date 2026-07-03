# Phase 4: USDA API Integration

This phase covers building the server-side API proxy to query the USDA FoodData Central API securely and normalize nutrition responses for the client.

## Checklist

- [ ] Obtain a USDA FDC API Key (fallback to `DEMO_KEY`).
- [ ] Configure `USDA_API_KEY` in environment variables.
- [ ] Implement Next.js API route `src/app/api/food/search/route.ts`.
- [ ] Write normalizer utility to parse nutrients from USDA search output:
  - Match "Energy" (unit "kcal") for Calories.
  - Match "Protein" for Protein.
  - Match "Total lipid (fat)" for Total Fat.
  - Match "Carbohydrate, by difference" for Carbs.
  - Match "Fatty acids, total saturated" for Saturated Fat.
- [ ] Format serving size options (standardizing 100g and brand serving size descriptions).
- [ ] Implement search error handling and rate-limiting gracefully on the frontend.

## Step-by-Step Instructions

### 1. USDA FDC API Key Signup
1. Visit [USDA FoodData Central API Signup](https://fdc.nal.usda.gov/api-key-signup).
2. Register your details to receive an API Key.
3. Update `.env.local` with the new key:
   ```env
   USDA_API_KEY=your_usda_api_key_here
   ```

### 2. Implement API Search Route
Create [route.ts](file:///Users/Tayler/workspace/nutrition/src/app/api/food/search/route.ts):
- Fetch search term from query parameters: `/api/food/search?q=butter`.
- Forward request to USDA search endpoint: `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${query}&pageSize=15`.
- Map the JSON response containing the matching foods list.

### 3. Normalize Nutrient Data
For each food item returned, parse `foodNutrients` list by matching the following names (case-insensitive):
- **Calories**: Name contains `"energy"` and unit is `"kcal"`.
- **Protein**: Name contains `"protein"`.
- **Total Fat**: Name contains `"total lipid"` or `"fat"`.
- **Carbs**: Name contains `"carbohydrate"`.
- **Saturated Fat**: Name contains `"saturated"`.

Standardize all values as **per 100g** or **per standard serving size** (which is how FDC records them) so that when a user logs `X` quantity, we multiply `X * value`.

### 4. Format Serving Sizes
Extract brand details, default serving size, and serving size unit (e.g. `14g`, `1 tbsp`):
- If `servingSize` and `servingSizeUnit` are provided in the search response, use them to compute the nutrients per serving size.
- Otherwise, fallback to a standard unit like `100g`.
- Return a clean array of food items containing name, brand, FDC ID, serving size details, and standard nutrients.
