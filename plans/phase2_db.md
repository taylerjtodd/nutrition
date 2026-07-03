# Phase 2: Database Layer & Client

This phase details how to set up the connection to Upstash Redis and design the data schemas for storing user settings and daily food consumption.

## Checklist

- [ ] Obtain Upstash Redis REST URL and Token from Upstash console.
- [ ] Configure environment variables in `.env.local` for local development.
- [ ] Create database client library at `src/lib/db.ts`.
- [ ] Implement data types for food log entries and user settings.
- [ ] Write helper functions to:
  - Save and fetch User Settings.
  - Add, delete, and fetch Daily Food Logs.
  - Maintain an index of active log dates to enable fast range fetching.
- [ ] Write a verification script to test Redis operations.

## Database Schemas

### 1. User Settings (Hash)
- **Key**: `user:{userId}:settings`
- **Fields**:
  - `focusMacro`: String (e.g., `"saturatedFat"`, `"calories"`, `"protein"`, `"fat"`, `"carbs"`)
  - `targetSaturatedFat`: Number (g)
  - `targetCalories`: Number (kcal)
  - `targetProtein`: Number (g)
  - `targetFat`: Number (g)
  - `targetCarbs`: Number (g)

### 2. Daily Log (List)
- **Key**: `user:{userId}:log:{YYYY-MM-DD}`
- **Element**: JSON string of:
  ```typescript
  interface LoggedItem {
    id: string; // Unique ID for deletion/modification
    name: string;
    servingSize: string; // e.g., "100g", "1 serving (14g)"
    quantity: number; // multiplier, e.g., 1.5
    calories: number;
    saturatedFat: number;
    totalFat: number;
    protein: number;
    carbs: number;
    loggedAt: string; // ISO string
  }
  ```

### 3. Logged Dates Index (Sorted Set)
To make tracking weekly averages over the past year fast, we will maintain a sorted set of logged dates.
- **Key**: `user:{userId}:logged_dates`
- **Member**: `YYYY-MM-DD`
- **Score**: Unix timestamp representing that day (or an integer representation of the date like `20260703` for easy sorting/filtering).

---

## Step-by-Step Instructions

### 1. Environment Config
Ensure the following variables are defined in `.env.local`:
```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Implement Client and CRUD Logic
Create [db.ts](file:///Users/Tayler/workspace/nutrition/src/lib/db.ts):
- Initialize Redis client from `@upstash/redis`.
- Implement `getUserSettings(userId)`, `saveUserSettings(userId, settings)`.
- Implement `logFoodItem(userId, date, item)` (this will append to the day's list and add the date to `user:{userId}:logged_dates`).
- Implement `getDailyLog(userId, date)`.
- Implement `deleteFoodItem(userId, date, itemId)`.
- Implement `getLoggedDatesInRange(userId, startDate, endDate)` using `zrange` on the sorted set.
