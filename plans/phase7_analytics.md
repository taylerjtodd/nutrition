# Phase 7: Analytics & Rollup (Yearly Trends)

This phase covers aggregating historical consumption data over the last year, calculating weekly averages, and rendering a high-fidelity interactive SVG chart.

## Checklist

- [ ] Create the Analytics aggregation API route (`src/app/api/analytics/route.ts`).
- [ ] Implement date-bucketing logic to calculate weekly macro averages over the last 52 weeks.
- [ ] Build the Trends tab on the dashboard UI.
- [ ] Create the interactive custom SVG chart (`src/app/dashboard/TrendsChart.tsx`):
  - Handle scaling coordinates dynamically to fit container sizes.
  - Draw average lines/bars with smooth transition pathways.
  - Render a horizontal dashed threshold line showing the configured target limit.
  - Implement mouse-hover interactive indicators and tooltips displaying the exact weekly average vs. target.
- [ ] Write a mock data seeding script (`src/scripts/seed-mock-data.ts`) to populate daily logs across the past 52 weeks to verify chart performance and calculations.

## Step-by-Step Instructions

### 1. Analytics Aggregation API
Create `src/app/api/analytics/route.ts`:
- Define a time window from `today - 365 days` to `today`.
- Fetch logged dates within this range using the Redis sorted set `user:{userId}:logged_dates`.
- Retrieve daily log lists for each active date.
- Aggregate total calories, protein, total fat, saturated fat, and carbs consumed per day.
- Bucket dates into calendar weeks (starting Mondays or Sundays).
- Compute the average daily macro intake for each week.
- Exclude weeks with 0 logged days to prevent artificial drag on averages, or calculate averages based on actual logged days.
- Send the array of weekly objects to the client.

### 2. Seeding Script
Create a temporary Node script `src/scripts/seed-mock-data.ts` that:
- Connects to Upstash Redis.
- Loops through dates over the last year.
- With 70% probability per day, logs 2-3 mock meals containing random macro values (varying around a mean of e.g. 15g saturated fat, 2000kcal).
- Populates the date index sorted set.
- (Allows developers to verify chart display without waiting 12 months for manual entries).

### 3. Custom SVG Chart Component
Implement a clean interactive SVG chart in `src/app/dashboard/TrendsChart.tsx`:
- Detect dimensions using React hooks or CSS flexbox.
- Map data values to `x` and `y` coordinates.
- Render SVG elements:
  - `<polyline>` or `<path>` for the trend line.
  - `<rect>` if choosing a bar chart layout.
  - `<line>` (dashed red/rose) at the target macro value.
  - Interactive grid lines and labels for dates (weeks) and values.
  - Hover triggers `<circle>` and tooltip display containing details like: "Week of June 28: Avg 12.3g Saturated Fat (Target: 15g)".
- Allow toggling between macros (Saturated Fat, Calories, Protein, total Fat, Carbs) to update the chart animations.
