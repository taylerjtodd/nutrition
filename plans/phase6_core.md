# Phase 6: Core Features (Dashboard & Logging)

This phase details how to build the user interface and logic for the daily dashboard, macro progress visualization, and food logging actions.

## Checklist

- [ ] Create the Dashboard Page (`src/app/dashboard/page.tsx`).
- [ ] Implement the circular/radial SVG progress tracker for the primary focus macro.
- [ ] Build secondary horizontal progress bars for remaining macros.
- [ ] Create a "Target Settings Drawer" to customize manual macro limits and change the primary focus macro.
- [ ] Build the "Log Food Modal" (`src/app/dashboard/LogFoodModal.tsx`) with two tabs:
  - **FDC Search**: Query USDA API, display results, configure serving count, and log.
  - **Quick Add**: Manually enter food name, weight, and key macros, and log.
- [ ] Create the "Today's Consumption List" featuring details per food, delete actions, and animations.
- [ ] Build API endpoints `/api/log` to support creating, reading, and deleting daily food entries in Upstash Redis.

## Step-by-Step Instructions

### 1. Daily Log API Endpoints
Create `src/app/api/log/route.ts`:
- **GET**: Read daily items for a selected date.
- **POST**: Add a new logged item.
- **DELETE**: Remove an item by ID from the date's list.

### 2. Settings API Endpoint
Create `src/app/api/settings/route.ts`:
- **GET**: Read user targets and focus macro.
- **POST**: Save modified user targets and focus macro.

### 3. Circular SVG Progress Indicator
For the focus macro (e.g. Saturated Fat), design an interactive, glowing radial progress chart:
```typescript
const radius = 50;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = circumference - (percent / 100) * circumference;
```
Render it using a responsive `<svg>` element with modern transition styles (`transition-all duration-500 ease-out`).

### 4. Search and Logging Modal
Inside the logging modal:
- Maintain a search input that debounces typing, then queries `/api/food/search`.
- List matching results with details (e.g. "Butter, salted - 100g, 51.4g Saturated Fat").
- Clicking a result shows a quantity multiplier input (default `1.0`) and calculates the adjusted macros in real-time.
- Clicking "Log Item" calls `POST /api/log` and refetches the daily state.
- Include a "Quick Add" form with inputs for Name, Calories, Saturated Fat, Total Fat, Protein, and Carbs for easy custom logging.
