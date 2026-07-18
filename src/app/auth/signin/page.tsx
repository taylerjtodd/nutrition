"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInCard() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  return (
    <div
      className="glass-card glow-brand w-full max-w-sm p-8"
      style={{ boxShadow: "0 0 60px -12px rgba(14,165,233,0.25)" }}
    >
      {/* Logo mark */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <svg
          width="48"
          height="48"
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

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Macro<span className="gradient-text-brand">Track</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to start tracking your macros
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        className="mb-6 h-px w-full"
        style={{ background: "var(--color-border-subtle)" }}
      />

      {/* Google sign-in button */}
      <button
        id="signin-google-btn"
        onClick={() => signIn("google", { callbackUrl })}
        className="focus-ring hover-lift flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors duration-150 hover:border-white/20 hover:bg-white/10"
      >
        {/* Google logo SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-xs text-slate-500">
        By signing in you agree to track your own nutrition data.
        <br />
        We never share your information.
      </p>
    </div>
  );
}

/**
 * Custom NextAuth sign-in page at /auth/signin.
 * Wraps the interactive card in Suspense because useSearchParams()
 * requires a client-side boundary with a Suspense fallback in Next.js 13+.
 */
export default function SignInPage() {
  return (
    <main
      id="signin-main"
      className="flex min-h-dvh flex-col items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(14,165,233,0.12) 0%, transparent 70%), #080f1a",
      }}
    >
      <Suspense fallback={null}>
        <SignInCard />
      </Suspense>
    </main>
  );
}
