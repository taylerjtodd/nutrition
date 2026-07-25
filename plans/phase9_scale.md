# Phase 9: Scaling & Administration

## Overview
Prepare the application for a broader user base by introducing usage monitoring, administrative analytics, and investigating potential usage limits. This phase focuses on building a dedicated analytics view for the administrator and researching strategies to enforce rate limiting or quotas per user.

## Objectives
1. Create an admin-only Analytics tab.
2. Track and display key metrics: Total Users and Daily Logged Food Items.
3. Restrict access to the Analytics tab to the designated admin email via environment variables.
4. Investigate and document strategies for per-user usage limits.

## Implementation Steps

### 1. Environment Configuration
- Add an `ADMIN_EMAIL` property to `.env.local` and production environment variables.
- This will be used to whitelist access to the Analytics tab.

### 2. Admin Whitelist Authorization
- Utilize NextAuth session data to verify the current user's email.
- Apply Next.js Middleware or server-side checks in the layout/page to protect the `/analytics` route.
- Redirect non-admin users to the dashboard or home page if they attempt to access `/analytics`.
- Ensure the Analytics tab is only rendered in the navigation for the admin user.

### 3. Analytics API & Data Aggregation
- Create an API route or server action to fetch the analytics data securely.
- **Metric 1: Total Users:** Query the database (Upstash) to count unique users.
- **Metric 2: Daily Logged Food Items:** Query to aggregate and count the number of food items logged per day across all users.
- Ensure the API route explicitly checks for the `ADMIN_EMAIL` and returns a `401 Unauthorized` or `403 Forbidden` if the requesting user's session email does not match.

### 4. Admin Analytics UI
- Create a new page `src/app/analytics/page.tsx` (or a dedicated tab component).
- Implement a premium, dynamic layout (following the app's aesthetic) for the analytics dashboard.
- Display "Total Users" and "Daily Logged Food Items" metrics using charts or statistical cards.

### 5. Investigation: Usage Limits per User
- Investigate options for rate limiting and quotas (e.g., using Upstash Redis `@upstash/ratelimit`).
- Outline potential usage limits (e.g., max logs per user per day).
- Document a proposal for implementing these limits, handling edge cases (UI feedback, HTTP 429 status codes), and managing user quotas.
- Place the proposal in `./plans/usage_limits.md` to be reviewed and implemented in a future phase.

## Verification Plan
- **Authentication:** Verify that `ADMIN_EMAIL` can access the Analytics tab and view data.
- **Authorization:** Verify that a normal (non-admin) user cannot see the Analytics tab in the UI or access the `/analytics` route (redirects properly).
- **Data Accuracy:** Log in as admin and verify the counts for users and daily food items are accurate based on current database state.
- **Research:** Review the documented findings on usage limits for feasibility before implementation.
