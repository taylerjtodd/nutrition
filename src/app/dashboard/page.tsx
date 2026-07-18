import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

/**
 * Dashboard page — stub for Phase 6.
 * Protects the route server-side; unauthenticated users are sent to sign-in.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <>
      <Navbar />
      <main
        id="dashboard-main"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
      >
        {/* ── Welcome banner ───────────────────────────── */}
        <div className="glass-card glow-brand mb-8 flex items-center justify-between p-6">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-400">
              Welcome back
            </p>
            <h1 className="text-2xl font-bold text-slate-50">
              {session.user.name ?? "Tracker"}
            </h1>
          </div>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
            style={{ background: "rgba(14,165,233,0.1)" }}
            aria-hidden="true"
          >
            📊
          </div>
        </div>

        {/* ── Coming soon placeholder cards ─────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              id: "card-satfat",
              label: "Saturated Fat",
              color: "#f43f5e",
              emoji: "🥩",
              desc: "Daily radial progress tracker — coming in Phase 6",
            },
            {
              id: "card-protein",
              label: "Protein",
              color: "#8b5cf6",
              emoji: "💪",
              desc: "Protein progress bar — coming in Phase 6",
            },
            {
              id: "card-carbs",
              label: "Carbohydrates",
              color: "#f59e0b",
              emoji: "🌾",
              desc: "Carbs progress bar — coming in Phase 6",
            },
            {
              id: "card-calories",
              label: "Calories",
              color: "#0ea5e9",
              emoji: "🔥",
              desc: "Calorie counter — coming in Phase 6",
            },
            {
              id: "card-log",
              label: "Food Log",
              color: "#10b981",
              emoji: "📝",
              desc: "Log meals via USDA search or quick-add — coming in Phase 6",
            },
            {
              id: "card-settings",
              label: "Targets",
              color: "#64748b",
              emoji: "⚙️",
              desc: "Customise macro targets — coming in Phase 6",
            },
          ].map(({ id, label, color, emoji, desc }) => (
            <div key={id} id={id} className="glass-card hover-lift p-5">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{ background: `${color}18` }}
                  aria-hidden="true"
                >
                  {emoji}
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color }}
                >
                  {label}
                </span>
              </div>
              {/* Shimmer placeholder bar */}
              <div className="shimmer mb-2 h-2.5 w-full rounded-full" />
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
