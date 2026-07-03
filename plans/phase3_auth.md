# Phase 3: Authentication & Security

This phase covers configuring Google Sign-On using NextAuth.js (Auth.js) and protecting application routes using Next.js Middleware.

## Checklist

- [ ] Create a Google Cloud Console project.
- [ ] Configure the OAuth Consent Screen and generate client ID/secret.
- [ ] Add Google redirect URIs:
  - Local: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://<your-vercel-domain>.vercel.app/api/auth/callback/google`
- [ ] Create NextAuth configuration at `src/app/api/auth/[...nextauth]/route.ts`.
- [ ] Add middleware at `src/middleware.ts` to protect app routes.
- [ ] Create SessionProvider wrapper for client-side authentication states.

## Step-by-Step Instructions

### 1. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Configure the **OAuth Consent Screen** (User type: External, add your email address and developer details).
4. Go to **Credentials**, click **Create Credentials** -> **OAuth Client ID**.
5. Application type: **Web Application**.
6. Under **Authorized redirect URIs**, add `http://localhost:3000/api/auth/callback/google`.
7. Download or copy the **Client ID** and **Client Secret**.

### 2. Configure Environment Variables
Add to `.env.local`:
```env
NEXTAUTH_SECRET=generate_a_random_32_character_string
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 3. Implement NextAuth Route Handler
Create `src/app/api/auth/[...nextauth]/route.ts` using the Google Provider:
- Ensure the `session` callbacks are configured to write the Google user ID (or email) into the session context, so we have a reliable identifier for Redis key naming.

### 4. Create Next.js Middleware
Create `src/middleware.ts` at the root of the `src` directory (or workspace root if not using `src`):
```typescript
import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/food/:path*', '/api/analytics/:path*'],
};
```

### 5. Create Session Provider
Create a wrapper client component `src/components/SessionProviderWrapper.tsx` and integrate it into the root `src/app/layout.tsx` file.
