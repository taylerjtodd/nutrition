import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Protect all dashboard pages and data API routes.
 * Unauthenticated requests are automatically redirected to the sign-in page
 * by next-auth's withAuth wrapper.
 *
 * Note: In Next.js 16, "middleware" was renamed to "proxy". The functionality
 * is identical — this file replaces src/middleware.ts.
 */
export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/food/:path*", "/api/analytics/:path*"],
};
