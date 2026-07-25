# Phase 8: Edit and Delete Logged Food

This phase details how to build the functionality to edit previously logged food items (changing serving size or macros) and completely implement the delete functionality from the user's daily log.

## Checklist

- [ ] Create the "Edit Food Modal" (`src/app/dashboard/EditFoodModal.tsx`) to allow modifying serving sizes or custom macros of already logged items.
- [ ] Add an "Edit" button/icon to each item in the "Today's Consumption List".
- [ ] Ensure the "Delete" action is fully implemented with a clear visual indicator (e.g., a dedicated delete button with confirmation or swipe-to-delete).
- [ ] Update the API endpoint `/api/log` to support a `PUT` or `PATCH` method for updating an existing logged item in Upstash Redis.
- [ ] Ensure state is refetched or optimistically updated upon successful edit/delete so that the macro progress indicators update instantly.

## Step-by-Step Instructions

### 1. Update Daily Log API Endpoints
Update `src/app/api/log/route.ts` to include:
- **PUT / PATCH**: Update an existing logged item. It should accept the item ID and the new values (e.g., update `servingCount` and recalculate its total macros based on the base nutritional data stored, or update custom macros for quick-added foods).
- **DELETE**: Ensure the delete endpoint is robust and correctly removes the specified item ID from the date's list in Redis.
  - **Implementation Note**: Utilize the existing `deleteFoodItem(userId, date, itemId)` utility from `src/lib/db.ts`.
  - **Implementation Note**: Check if the day is empty after deletion. If `getDailyLog(userId, date)` returns an empty array, remove the date from the index using `redis.zrem(\`user:\${userId}:logged_dates\`, date)`.

### 2. Edit Food Modal Component
Create a new component `EditFoodModal`:
- When triggered from a list item, it should populate with the current item's data.
- Allow the user to adjust the `servingCount` (for USDA foods) or raw macros (for quick-added foods).
- Display a real-time preview of the updated macros as they change the inputs.
- Include "Save Changes" and "Cancel" buttons.
- On save, make the `PUT`/`PATCH` request to `/api/log` and update the dashboard state.

### 3. Consumption List UI Updates
- In the "Today's Consumption List" component, add an "Edit" action button (e.g., a pencil icon) and a "Delete" action button (e.g., a trash can icon) to each list item.
- Implement a confirmation dialog or toast notification when an item is deleted to prevent accidental removals.
- Optionally add smooth animations (e.g., using Framer Motion or CSS transitions) for when an item is removed from the list.
