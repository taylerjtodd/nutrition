"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { NormalizedFood } from "@/lib/usda";

interface LogFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onLogged: () => void;
}

type Tab = "search" | "quickAdd";

export default function LogFoodModal({
  isOpen,
  onClose,
  date,
  onLogged,
}: LogFoodModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("search");

  // Search Tab State
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NormalizedFood[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<NormalizedFood | null>(null);

  const searchFormik = useFormik({
    initialValues: { multiplier: 1 },
    validationSchema: Yup.object({
      multiplier: Yup.number()
        .typeError("Must be a number")
        .positive("Must be > 0")
        .required("Required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      if (!selectedFood) return;
      try {
        const displayName = selectedFood.brand
          ? `${selectedFood.name} (${selectedFood.brand})`
          : selectedFood.name;
        
        const q = Number(values.multiplier);

        const res = await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            item: {
              name: displayName,
              servingSize: selectedFood.servingLabel,
              quantity: q,
              calories: selectedFood.calories,
              saturatedFat: selectedFood.saturatedFat,
              totalFat: selectedFood.totalFat,
              protein: selectedFood.protein,
              carbs: selectedFood.carbs,
            },
          }),
        });

        if (res.ok) {
          onLogged();
          onClose();
        }
      } catch (error) {
        console.error("Error logging search food:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const quickAddFormik = useFormik({
    initialValues: {
      name: "",
      servingSize: "1 serving",
      quantity: 1,
      calories: "",
      saturatedFat: "",
      totalFat: "",
      protein: "",
      carbs: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      servingSize: Yup.string(),
      quantity: Yup.number().typeError("Must be a number").positive("Must be > 0").required("Required"),
      calories: Yup.number().typeError("Number").min(0, ">= 0").required("Required"),
      saturatedFat: Yup.number().typeError("Number").min(0, ">= 0").required("Required"),
      totalFat: Yup.number().typeError("Number").min(0, ">= 0").required("Required"),
      protein: Yup.number().typeError("Number").min(0, ">= 0").required("Required"),
      carbs: Yup.number().typeError("Number").min(0, ">= 0").required("Required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            item: {
              name: values.name.trim(),
              servingSize: values.servingSize.trim() || "1 serving",
              quantity: Number(values.quantity),
              calories: Number(values.calories || 0),
              saturatedFat: Number(values.saturatedFat || 0),
              totalFat: Number(values.totalFat || 0),
              protein: Number(values.protein || 0),
              carbs: Number(values.carbs || 0),
            },
          }),
        });

        if (res.ok) {
          onLogged();
          onClose();
        }
      } catch (error) {
        console.error("Error with quick log:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Reset modal state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSearchResults([]);
      setSelectedFood(null);
      searchFormik.resetForm();
      quickAddFormik.resetForm();
      setActiveTab("search");
    }
  }, [isOpen]);

  // Query Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchFood = async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/food/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.foods || []);
        }
      } catch (error) {
        console.error("USDA Search error:", error);
      } finally {
        setSearchLoading(false);
      }
    };

    searchFood();
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const displayMultiplier = Number(searchFormik.values.multiplier) || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="glass-card-dark relative w-full max-w-lg overflow-hidden shadow-2xl transition-all border border-slate-800">
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors"
          title="Close Modal"
        >
          ✕
        </button>

        {/* Modal Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>🥗</span> Log Food Item
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Log foods for <span className="font-semibold text-slate-400">{date}</span>
          </p>

          {/* Tab Navigation */}
          <div className="mt-5 flex rounded-xl bg-slate-950 p-1 border border-white/5">
            <button
              onClick={() => {
                setActiveTab("search");
                setSelectedFood(null);
                searchFormik.resetForm();
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                activeTab === "search"
                  ? "bg-slate-900 text-white border border-white/5"
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              USDA Search
            </button>
            <button
              onClick={() => setActiveTab("quickAdd")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                activeTab === "quickAdd"
                  ? "bg-slate-900 text-white border border-white/5"
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              Quick Add
            </button>
          </div>

          {/* ─── TAB 1: SEARCH ────────────────────────────────────────────────── */}
          {activeTab === "search" && (
            <div className="mt-5 space-y-4">
              {!selectedFood ? (
                <>
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search foods (e.g. egg, greek yogurt, butter)..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors pr-10"
                      autoFocus
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-3.5 text-xs text-slate-500 hover:text-slate-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Results List */}
                  <div className="h-64 overflow-y-auto rounded-xl bg-slate-950/40 border border-white/5 p-2 space-y-1.5 scrollbar-thin">
                    {searchLoading ? (
                      <div className="flex h-full flex-col items-center justify-center py-6 space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
                        <span className="text-xs text-slate-500">
                          Fetching results...
                        </span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center p-6">
                        <span className="text-2xl mb-1.5">🔍</span>
                        <p className="text-xs font-medium text-slate-500">
                          {query.trim()
                            ? "No matching foods found."
                            : "Type to search USDA FoodData Central..."}
                        </p>
                      </div>
                    ) : (
                      searchResults.map((food) => (
                        <button
                          key={food.fdcId}
                          onClick={() => {
                            setSelectedFood(food);
                            searchFormik.resetForm();
                          }}
                          className="w-full text-left p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900/80 border border-white/5 transition-all flex justify-between items-start gap-4"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-200 text-xs truncate block">
                              {food.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                              {food.brand ? `${food.brand} • ` : ""}
                              {food.servingLabel}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold text-white block">
                              {food.calories} kcal
                            </span>
                            <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">
                              Sat Fat: {food.saturatedFat}g
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* Detail Configuration View */
                <div className="rounded-xl bg-slate-950 p-4 border border-white/5 space-y-4">
                  <div>
                    <button
                      onClick={() => setSelectedFood(null)}
                      className="text-xs text-slate-500 hover:text-slate-350 flex items-center gap-1 mb-2"
                    >
                      &larr; Back to search results
                    </button>
                    <h3 className="font-bold text-slate-200 text-sm">
                      {selectedFood.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedFood.brand ? `${selectedFood.brand} • ` : ""}
                      Base Serving: {selectedFood.servingLabel} ({selectedFood.servingGrams}g)
                    </p>
                  </div>

                  {/* Quantity adjustment */}
                  <div className="flex items-center gap-4 py-2 border-y border-slate-900">
                    <div className="flex-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Serving Multiplier
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Adjust to scale serving size values
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <input
                        type="number"
                        step="0.1"
                        {...searchFormik.getFieldProps("multiplier")}
                        className={`w-24 rounded-lg bg-slate-900 border px-3 py-1.5 text-center text-sm font-semibold text-white focus:outline-none transition-colors ${
                          searchFormik.touched.multiplier && searchFormik.errors.multiplier
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-slate-800 focus:border-brand-500"
                        }`}
                      />
                      {searchFormik.touched.multiplier && searchFormik.errors.multiplier && (
                        <span className="text-[10px] text-rose-500">{searchFormik.errors.multiplier as string}</span>
                      )}
                    </div>
                  </div>

                  {/* Scaled Macro Totals */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Computed Log Values
                    </label>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 font-medium block">Calories</span>
                        <span className="text-xs font-bold text-white block mt-0.5">
                          {Math.round(selectedFood.calories * displayMultiplier)}
                        </span>
                        <span className="text-[8px] text-slate-500 block">kcal</span>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 font-medium block">Sat Fat</span>
                        <span className="text-xs font-bold text-rose-400 block mt-0.5">
                          {Math.round(selectedFood.saturatedFat * displayMultiplier * 10) / 10}
                        </span>
                        <span className="text-[8px] text-slate-500 block">g</span>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 font-medium block">Protein</span>
                        <span className="text-xs font-bold text-violet-400 block mt-0.5">
                          {Math.round(selectedFood.protein * displayMultiplier * 10) / 10}
                        </span>
                        <span className="text-[8px] text-slate-500 block">g</span>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 font-medium block">Carbs</span>
                        <span className="text-xs font-bold text-amber-400 block mt-0.5">
                          {Math.round(selectedFood.carbs * displayMultiplier * 10) / 10}
                        </span>
                        <span className="text-[8px] text-slate-500 block">g</span>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 font-medium block">Total Fat</span>
                        <span className="text-xs font-bold text-indigo-400 block mt-0.5">
                          {Math.round(selectedFood.totalFat * displayMultiplier * 10) / 10}
                        </span>
                        <span className="text-[8px] text-slate-500 block">g</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFood(null)}
                      className="flex-1 rounded-xl border border-slate-800 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => searchFormik.handleSubmit()}
                      disabled={searchFormik.isSubmitting || !searchFormik.isValid}
                      className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {searchFormik.isSubmitting ? "Logging..." : "Log Item"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 2: QUICK ADD ────────────────────────────────────────────── */}
          {activeTab === "quickAdd" && (
            <form onSubmit={quickAddFormik.handleSubmit} className="mt-5 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Food Name *</span>
                  {quickAddFormik.touched.name && quickAddFormik.errors.name && (
                    <span className="text-rose-500 normal-case">{quickAddFormik.errors.name as string}</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scrambled Eggs, Avocado Toast"
                  {...quickAddFormik.getFieldProps("name")}
                  className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2 text-sm text-slate-200 focus:outline-none transition-colors ${
                    quickAddFormik.touched.name && quickAddFormik.errors.name
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-slate-850 focus:border-brand-500"
                  }`}
                />
              </div>

              {/* Serving details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Serving Description</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 plate, 150g"
                    {...quickAddFormik.getFieldProps("servingSize")}
                    className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 flex justify-between">
                    <span>Quantity Multiplier</span>
                    {quickAddFormik.touched.quantity && quickAddFormik.errors.quantity && (
                      <span className="text-rose-500">{quickAddFormik.errors.quantity as string}</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...quickAddFormik.getFieldProps("quantity")}
                    className={`w-full rounded-xl bg-slate-950 border px-3.5 py-2 text-sm text-slate-200 focus:outline-none transition-colors ${
                      quickAddFormik.touched.quantity && quickAddFormik.errors.quantity
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-slate-850 focus:border-brand-500"
                    }`}
                  />
                </div>
              </div>

              <div className="border-t border-slate-900 my-2" />

              {/* Macro Numeric values */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Nutritional Values (Per Single Serving)
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Calories */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Calories</span>
                      {quickAddFormik.touched.calories && quickAddFormik.errors.calories ? (
                        <span className="text-rose-500">{quickAddFormik.errors.calories as string}</span>
                      ) : (
                        <span className="text-slate-500">kcal</span>
                      )}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      {...quickAddFormik.getFieldProps("calories")}
                      className={`w-full rounded-xl bg-slate-950 border px-3.5 py-1.5 text-sm text-slate-200 focus:outline-none transition-colors ${
                        quickAddFormik.touched.calories && quickAddFormik.errors.calories
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-850 focus:border-brand-500"
                      }`}
                    />
                  </div>

                  {/* Saturated Fat */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Saturated Fat</span>
                      {quickAddFormik.touched.saturatedFat && quickAddFormik.errors.saturatedFat ? (
                        <span className="text-rose-500">{quickAddFormik.errors.saturatedFat as string}</span>
                      ) : (
                        <span className="text-slate-500">g</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...quickAddFormik.getFieldProps("saturatedFat")}
                      className={`w-full rounded-xl bg-slate-950 border px-3.5 py-1.5 text-sm text-slate-200 focus:outline-none transition-colors ${
                        quickAddFormik.touched.saturatedFat && quickAddFormik.errors.saturatedFat
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-850 focus:border-brand-500"
                      }`}
                    />
                  </div>

                  {/* Total Fat */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Total Fat</span>
                      {quickAddFormik.touched.totalFat && quickAddFormik.errors.totalFat ? (
                        <span className="text-rose-500">{quickAddFormik.errors.totalFat as string}</span>
                      ) : (
                        <span className="text-slate-500">g</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...quickAddFormik.getFieldProps("totalFat")}
                      className={`w-full rounded-xl bg-slate-950 border px-3.5 py-1.5 text-sm text-slate-200 focus:outline-none transition-colors ${
                        quickAddFormik.touched.totalFat && quickAddFormik.errors.totalFat
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-850 focus:border-brand-500"
                      }`}
                    />
                  </div>

                  {/* Protein */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Protein</span>
                      {quickAddFormik.touched.protein && quickAddFormik.errors.protein ? (
                        <span className="text-rose-500">{quickAddFormik.errors.protein as string}</span>
                      ) : (
                        <span className="text-slate-500">g</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...quickAddFormik.getFieldProps("protein")}
                      className={`w-full rounded-xl bg-slate-950 border px-3.5 py-1.5 text-sm text-slate-200 focus:outline-none transition-colors ${
                        quickAddFormik.touched.protein && quickAddFormik.errors.protein
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-850 focus:border-brand-500"
                      }`}
                    />
                  </div>

                  {/* Carbohydrates */}
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs text-slate-400 flex justify-between">
                      <span>Carbohydrates</span>
                      {quickAddFormik.touched.carbs && quickAddFormik.errors.carbs ? (
                        <span className="text-rose-500">{quickAddFormik.errors.carbs as string}</span>
                      ) : (
                        <span className="text-slate-500">g</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...quickAddFormik.getFieldProps("carbs")}
                      className={`w-full rounded-xl bg-slate-950 border px-3.5 py-1.5 text-sm text-slate-200 focus:outline-none transition-colors ${
                        quickAddFormik.touched.carbs && quickAddFormik.errors.carbs
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-slate-850 focus:border-brand-500"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-800 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddFormik.isSubmitting || !quickAddFormik.isValid}
                  className="flex-1 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  {quickAddFormik.isSubmitting ? "Logging..." : "Quick Log"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
