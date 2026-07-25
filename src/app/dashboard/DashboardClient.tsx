"use client";

import { useState, useEffect, useCallback } from "react";
import type { Session } from "next-auth";
import type { UserSettings, LoggedItem, FocusMacro } from "@/lib/db";
import LogFoodModal from "@/app/dashboard/LogFoodModal";
import EditFoodModal from "@/app/dashboard/EditFoodModal";
import TrendsChart from "@/app/dashboard/TrendsChart";

interface DashboardClientProps {
  session: Session;
  initialSettings: UserSettings;
}

const MACRO_INFO: Record<
  FocusMacro,
  { label: string; unit: string; colorClass: string; hexColor: string; emoji: string }
> = {
  saturatedFat: {
    label: "Saturated Fat",
    unit: "g",
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    hexColor: "#f43f5e",
    emoji: "🥩",
  },
  calories: {
    label: "Calories",
    unit: "kcal",
    colorClass: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    hexColor: "#0ea5e9",
    emoji: "🔥",
  },
  protein: {
    label: "Protein",
    unit: "g",
    colorClass: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    hexColor: "#8b5cf6",
    emoji: "💪",
  },
  carbs: {
    label: "Carbohydrates",
    unit: "g",
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    hexColor: "#f59e0b",
    emoji: "🌾",
  },
  totalFat: {
    label: "Total Fat",
    unit: "g",
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    hexColor: "#6366f1",
    emoji: "🥑",
  },
};

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DashboardClient({
  session,
  initialSettings,
}: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState("");
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [items, setItems] = useState<LoggedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers Visibility
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LoggedItem | null>(null);

  // Tabs & Analytics
  const [activeTab, setActiveTab] = useState<"daily" | "trends">("daily");
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Settings Form State
  const [focusMacro, setFocusMacro] = useState<FocusMacro>(initialSettings.focusMacro);
  const [targetSaturatedFat, setTargetSaturatedFat] = useState(initialSettings.targetSaturatedFat);
  const [targetCalories, setTargetCalories] = useState(initialSettings.targetCalories);
  const [targetProtein, setTargetProtein] = useState(initialSettings.targetProtein);
  const [targetTotalFat, setTargetTotalFat] = useState(initialSettings.targetTotalFat);
  const [targetCarbs, setTargetCarbs] = useState(initialSettings.targetCarbs);
  const [savingSettings, setSavingSettings] = useState(false);

  // Hydration sync
  useEffect(() => {
    setMounted(true);
    setDate(getLocalDateString(new Date()));
  }, []);

  // Fetch daily items
  const fetchDailyLog = useCallback(async (targetDate: string) => {
    if (!targetDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/log?date=${targetDate}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error loading daily log:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync log on date change
  useEffect(() => {
    if (date) {
      fetchDailyLog(date);
    }
  }, [date, fetchDailyLog]);

  // Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    if (analyticsData.length > 0) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data.analytics || []);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsData.length]);

  useEffect(() => {
    if (activeTab === "trends") {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            focusMacro,
            targetSaturatedFat,
            targetCalories,
            targetProtein,
            targetTotalFat,
            targetCarbs,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSettingsOpen(false);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Delete Food Item
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    // Optimistic UI update
    const previousItems = [...items];
    setItems((prev) => prev.filter((item) => item.id !== itemId));

    try {
      const res = await fetch(`/api/log?date=${date}&id=${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setItems(previousItems);
        alert("Failed to delete the item. Please try again.");
      }
    } catch (error) {
      setItems(previousItems);
      console.error("Error deleting item:", error);
    }
  };

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    if (!date) return;
    const [y, m, d] = date.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setDate(getLocalDateString(dateObj));
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const todayStr = getLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (dateStr === todayStr) {
      return `Today, ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    if (dateStr === yesterdayStr) {
      return `Yesterday, ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Sum consumed macros
  const consumed = items.reduce(
    (acc, item) => {
      const qty = item.quantity || 1;
      acc.calories += (item.calories || 0) * qty;
      acc.saturatedFat += (item.saturatedFat || 0) * qty;
      acc.protein += (item.protein || 0) * qty;
      acc.totalFat += (item.totalFat || 0) * qty;
      acc.carbs += (item.carbs || 0) * qty;
      return acc;
    },
    { calories: 0, saturatedFat: 0, protein: 0, totalFat: 0, carbs: 0 }
  );

  // Precision rounding helper
  const round = (val: number) => Math.round(val * 10) / 10;

  // Selected Focus Macro details
  const currentFocus = settings.focusMacro || "saturatedFat";
  const focusTarget = settings[`target${currentFocus.charAt(0).toUpperCase() + currentFocus.slice(1)}` as keyof UserSettings] as number;
  const focusConsumed = consumed[currentFocus as keyof typeof consumed];
  const focusPercent = focusTarget > 0 ? (focusConsumed / focusTarget) * 100 : 0;
  const focusInfo = MACRO_INFO[currentFocus];

  // Secondary macros list
  const secondaryMacros = (Object.keys(MACRO_INFO) as FocusMacro[]).filter(
    (key) => key !== currentFocus
  );

  if (!mounted) {
    // Initial SSR and mount loading state to prevent hydration flashes
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="glass-card mb-8 h-28 w-full shimmer rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-card lg:col-span-1 h-96 shimmer" />
          <div className="glass-card lg:col-span-2 h-96 shimmer" />
        </div>
      </main>
    );
  }

  // Circular progress SVG values
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(focusPercent, 100);
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <main
      id="dashboard-main"
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12"
    >
      {/* ─── Header Navigation ────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nutrition Dashboard
          </p>
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            Welcome back, {session.user.name ?? "User"}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "daily"
                ? "bg-brand-500/20 text-brand-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            Daily Log
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "trends"
                ? "bg-brand-500/20 text-brand-400 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            Trends
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/50 p-1.5 border border-white/5">
          <button
            onClick={() => shiftDate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Previous Day"
            aria-label="Previous day"
          >
            &larr;
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-slate-200">
            {formatDisplayDate(date)}
          </span>
          <button
            onClick={() => shiftDate(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Next Day"
            aria-label="Next day"
          >
            &rarr;
          </button>
          <button
            onClick={() => setDate(getLocalDateString(new Date()))}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors border-l border-white/5 pl-3"
          >
            Today
          </button>
        </div>
      </div>

      {/* ─── Content ───────────────────────────────────────────────────────── */}
      {activeTab === "trends" ? (
        <div className="glass-card p-6 h-[550px]">
          {analyticsLoading ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500" />
              <span className="text-sm text-slate-500">Loading yearly trends...</span>
            </div>
          ) : (
            <TrendsChart analytics={analyticsData} settings={settings} />
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Progress Visualization */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Focus Progress Card */}
          <div className="glass-card glow-brand p-6 flex flex-col items-center relative overflow-hidden">
            {/* Header / Focus Title */}
            <div className="mb-4 flex w-full items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">
                Primary Target
              </span>
              <button
                onClick={() => setSettingsOpen(true)}
                className="rounded-lg p-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/10 transition-colors"
              >
                Configure ⚙️
              </button>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative flex items-center justify-center w-48 h-48 my-3">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  className="stroke-slate-800/80 fill-transparent"
                  strokeWidth="10"
                />
                {/* Progress Ring */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  className="fill-transparent transition-all duration-500 ease-out"
                  stroke={focusInfo.hexColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 6px ${focusInfo.hexColor}60)`,
                  }}
                />
              </svg>

              {/* Inner Circle Information */}
              <div className="absolute text-center">
                <span className="text-3xl" role="img" aria-label={focusInfo.label}>
                  {focusInfo.emoji}
                </span>
                <div className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {round(focusConsumed)}
                </div>
                <div className="text-xs text-slate-400">
                  of {focusTarget} {focusInfo.unit}
                </div>
              </div>
            </div>

            {/* Visual Indicators & Label */}
            <div className="mt-4 text-center">
              <h2 className="text-lg font-bold text-slate-100">
                {focusInfo.label}
              </h2>
              <p
                className={`text-sm font-medium mt-1 ${
                  focusPercent > 100 ? "text-rose-400 font-semibold animate-pulse" : "text-slate-400"
                }`}
              >
                {focusPercent > 100
                  ? `Exceeded limit by ${round(focusConsumed - focusTarget)} ${focusInfo.unit}!`
                  : `${round(focusPercent)}% Completed`}
              </p>
            </div>
          </div>

          {/* Secondary Horizontal Progress Cards */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-slate-400">
              Other Targets
            </h3>
            <div className="space-y-4">
              {secondaryMacros.map((key) => {
                const info = MACRO_INFO[key];
                const target = settings[
                  `target${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof UserSettings
                ] as number;
                const value = consumed[key as keyof typeof consumed];
                const pct = target > 0 ? (value / target) * 100 : 0;

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        <span>{info.emoji}</span>
                        {info.label}
                      </span>
                      <span className="font-semibold text-slate-400">
                        {round(value)} / {target} {info.unit}
                      </span>
                    </div>
                    {/* Progress Bar Track */}
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: info.hexColor,
                          boxShadow: `0 0 8px ${info.hexColor}40`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Consumption List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 flex flex-col min-h-[480px]">
            {/* Header actions */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Consumption Log
                </h2>
                <p className="text-xs text-slate-500">
                  {items.length} items logged for this date
                </p>
              </div>
              <button
                onClick={() => setLogModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 active:scale-95 transition-all shadow-lg shadow-brand-500/20"
              >
                <span>➕</span> Log Food
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500" />
                <span className="text-sm text-slate-500">Loading daily log...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center py-20 px-4 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                <span className="text-4xl mb-3">🥗</span>
                <h3 className="text-md font-bold text-slate-300">
                  No food logged yet
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  Log a meal via the USDA Search or Quick Add to track your macros.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {items.map((item) => {
                  const qty = item.quantity || 1;
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/5 transition-all hover:border-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-200 truncate text-sm">
                            {item.name}
                          </h4>
                          {qty !== 1 && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400 border border-white/5">
                              x{qty}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.servingSize} • {round(item.calories * qty)} kcal
                        </p>
                        {/* Macro details grid */}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-slate-400">
                          <span className="text-rose-400/90">
                            Sat Fat: {round(item.saturatedFat * qty)}g
                          </span>
                          <span className="text-violet-400/90">
                            Protein: {round(item.protein * qty)}g
                          </span>
                          <span className="text-amber-400/90">
                            Carbs: {round(item.carbs * qty)}g
                          </span>
                          <span className="text-indigo-400/90">
                            Fat: {round(item.totalFat * qty)}g
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-4">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-brand-500/10 hover:text-brand-400 transition-all"
                          title="Edit Entry"
                          aria-label={`Edit ${item.name}`}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                          title="Delete Entry"
                          aria-label={`Delete ${item.name}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ─── Target Settings Slide-Over Drawer ───────────────────────────────── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
          {/* Overlay backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSettingsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800/80 shadow-2xl relative">
                {/* Close Button */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSaveSettings}
                  className="flex-1 flex flex-col justify-between p-6 overflow-y-auto"
                >
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">
                        Target Configuration
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Customize daily nutrition boundaries and highlight options.
                      </p>
                    </div>

                    {/* Focus Macro selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Primary Focus Macro
                      </label>
                      <select
                        value={focusMacro}
                        onChange={(e) => setFocusMacro(e.target.value as FocusMacro)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                      >
                        <option value="saturatedFat">Saturated Fat (🥩)</option>
                        <option value="calories">Calories (🔥)</option>
                        <option value="protein">Protein (💪)</option>
                        <option value="carbs">Carbohydrates (🌾)</option>
                        <option value="totalFat">Total Fat (🥑)</option>
                      </select>
                    </div>

                    <div className="border-t border-slate-900 my-4" />

                    {/* Numeric targets */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Macro Target Goals
                      </h3>

                      {/* Calories */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex justify-between">
                          <span>Calories</span>
                          <span className="text-slate-500">kcal</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={targetCalories}
                          onChange={(e) => setTargetCalories(Number(e.target.value))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      {/* Saturated Fat */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex justify-between">
                          <span>Saturated Fat</span>
                          <span className="text-slate-500">grams</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={targetSaturatedFat}
                          onChange={(e) => setTargetSaturatedFat(Number(e.target.value))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      {/* Total Fat */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex justify-between">
                          <span>Total Fat</span>
                          <span className="text-slate-500">grams</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={targetTotalFat}
                          onChange={(e) => setTargetTotalFat(Number(e.target.value))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      {/* Protein */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex justify-between">
                          <span>Protein</span>
                          <span className="text-slate-500">grams</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={targetProtein}
                          onChange={(e) => setTargetProtein(Number(e.target.value))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>

                      {/* Carbohydrates */}
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 flex justify-between">
                          <span>Carbohydrates</span>
                          <span className="text-slate-500">grams</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={targetCarbs}
                          onChange={(e) => setTargetCarbs(Number(e.target.value))}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="flex-1 rounded-xl border border-slate-800 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {savingSettings ? "Saving..." : "Save Config"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Log Food Dialog Modal ───────────────────────────────────────────── */}
      <LogFoodModal
        isOpen={isLogModalOpen}
        onClose={() => setLogModalOpen(false)}
        date={date}
        onLogged={() => fetchDailyLog(date)}
      />

      {/* ─── Edit Food Modal ─────────────────────────────────────────────────── */}
      <EditFoodModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        date={date}
        item={editingItem}
        onUpdated={() => fetchDailyLog(date)}
      />
    </main>
  );
}
