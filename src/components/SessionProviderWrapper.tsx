"use client";

import { SessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

/**
 * Thin wrapper around next-auth's SessionProvider.
 * Must be a client component since SessionProvider relies on React context.
 * Placed at the root layout so all pages have access to the session.
 */
export default function SessionProviderWrapper({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
