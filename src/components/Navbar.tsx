"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

/**
 * Top navigation bar.
 * Shows branding on the left and user info + sign-out on the right when
 * the user is authenticated.
 */
export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header
      id="main-navbar"
      className="
        sticky top-0 z-50
        glass-card-dark
        border-b border-white/[0.06]
        rounded-none
      "
      style={{ borderRadius: 0 }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* ── Brand ────────────────────────────────────────── */}
        <Link
          href="/"
          id="navbar-brand"
          className="flex items-center gap-2.5 focus-ring rounded-lg"
          aria-label="MacroTrack home"
        >
          {/* Simple SVG icon – a radial chart */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="14" cy="14" r="13" stroke="#0ea5e9" strokeWidth="2" />
            <path
              d="M14 14 L14 3"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M14 14 L23.5 19.5"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M14 14 L4.5 19.5"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="14" cy="14" r="2.5" fill="#e2e8f0" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-slate-100">
            Macro<span className="gradient-text-brand">Track</span>
          </span>
        </Link>

        {/* ── User section ─────────────────────────────────── */}
        {session?.user && (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User avatar"}
                width={32}
                height={32}
                className="rounded-full ring-2 ring-brand-500/40"
                id="navbar-user-avatar"
              />
            ) : (
              <div
                id="navbar-user-avatar"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white ring-2 ring-brand-500/40"
                aria-hidden="true"
              >
                {session.user.name?.[0] ?? "?"}
              </div>
            )}

            {/* Name – hidden on small screens */}
            <span
              id="navbar-user-name"
              className="hidden text-sm font-medium text-slate-300 sm:block"
            >
              {session.user.name}
            </span>

            {/* Sign-out button */}
            <button
              id="navbar-signout-btn"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="
                focus-ring
                flex items-center gap-1.5
                rounded-lg
                border border-white/10
                bg-white/5
                px-3 py-1.5
                text-xs font-medium text-slate-400
                transition-colors duration-150
                hover:border-white/20 hover:bg-white/10 hover:text-slate-200
              "
              aria-label="Sign out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
