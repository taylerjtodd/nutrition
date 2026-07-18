import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

/**
 * Root page — redirects authenticated users to /dashboard,
 * otherwise shows a polished marketing / sign-in landing.
 */
export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main
        id="home-hero"
        className="
          relative flex min-h-[calc(100dvh-4rem)] flex-col
          items-center justify-center overflow-hidden px-4 py-20
        "
      >
        {/* Background radial glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div
            className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, #0ea5e9 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full opacity-15"
            style={{
              background:
                "radial-gradient(circle, #f43f5e 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute left-1/4 bottom-1/3 h-48 w-48 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
            }}
          />
        </div>

        {/* ── Copy ─────────────────────────────────────────── */}
        <div className="mx-auto max-w-2xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-400">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse"
              aria-hidden="true"
            />
            Powered by USDA FoodData Central
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Know your{" "}
            <span className="gradient-text-rose">saturated fat.</span>
            <br />
            Know your macros.
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-slate-400">
            MacroTrack helps you log meals, monitor key nutrients, and stay on
            top of your daily targets — with real food data and a beautifully
            simple interface.
          </p>

          {/* CTA */}
          <Link
            id="home-signin-btn"
            href="/api/auth/signin"
            className="
              focus-ring
              inline-flex items-center gap-2.5
              rounded-xl
              bg-brand-500 px-7 py-3.5
              text-base font-semibold text-white
              shadow-lg shadow-brand-500/25
              transition-all duration-200
              hover:bg-brand-600 hover:shadow-brand-500/40 hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            {/* Google icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#fff"
                fillOpacity="0.9"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#fff"
                fillOpacity="0.9"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#fff"
                fillOpacity="0.9"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#fff"
                fillOpacity="0.9"
              />
            </svg>
            Sign in with Google
          </Link>
        </div>

        {/* ── Feature cards ───────────────────────────────── */}
        <div
          id="home-features"
          className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-3"
        >
          {[
            {
              id: "feature-satfat",
              emoji: "🥩",
              title: "Saturated Fat Focus",
              desc: "Track the macro most linked to cardiovascular health with a dedicated radial progress gauge.",
              accent: "#f43f5e",
            },
            {
              id: "feature-usda",
              emoji: "🔍",
              title: "USDA Food Search",
              desc: "Search 400,000+ foods from FoodData Central. Get accurate nutrient data instantly.",
              accent: "#0ea5e9",
            },
            {
              id: "feature-daily",
              emoji: "📊",
              title: "Daily Log",
              desc: "Log meals in seconds and review everything you've eaten today in a clean, swipeable list.",
              accent: "#8b5cf6",
            },
          ].map(({ id, emoji, title, desc, accent }) => (
            <div
              key={id}
              id={id}
              className="glass-card hover-lift p-6"
            >
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
                style={{ background: `${accent}18` }}
                aria-hidden="true"
              >
                {emoji}
              </div>
              <h2 className="mb-2 text-base font-semibold text-slate-100">
                {title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
