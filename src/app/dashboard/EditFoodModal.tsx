"use client";

import { useState, useEffect } from "react";
import type { LoggedItem } from "@/lib/db";

interface EditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  item: LoggedItem | null;
  onUpdated: () => void;
}

export default function EditFoodModal({
  isOpen,
  onClose,
  date,
  item,
  onUpdated,
}: EditFoodModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // When opened with an item, initialize state
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(item.quantity || 1);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Base values computed by dividing current values by current quantity
  const currentQ = item.quantity || 1;
  const baseCalories = item.calories / currentQ;
  const baseSatFat = item.saturatedFat / currentQ;
  const baseTotalFat = item.totalFat / currentQ;
  const baseProtein = item.protein / currentQ;
  const baseCarbs = item.carbs / currentQ;

  // New computed values based on new quantity
  const newCalories = Math.round(baseCalories * quantity);
  const newSatFat = Math.round(baseSatFat * quantity * 10) / 10;
  const newTotalFat = Math.round(baseTotalFat * quantity * 10) / 10;
  const newProtein = Math.round(baseProtein * quantity * 10) / 10;
  const newCarbs = Math.round(baseCarbs * quantity * 10) / 10;

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/log`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          id: item.id,
          item: {
            quantity,
            calories: newCalories,
            saturatedFat: newSatFat,
            totalFat: newTotalFat,
            protein: newProtein,
            carbs: newCarbs,
          },
        }),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        console.error("Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-white/10 shadow-2xl">
        <div className="p-6">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Edit Item
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Adjust serving multiplier to update macros
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 p-4 border border-white/5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Base Serving: {item.servingSize}
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
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.1, Number(e.target.value)))}
                className="w-24 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-center text-sm font-semibold text-white focus:outline-none focus:border-brand-500"
              />
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
                    {newCalories}
                  </span>
                  <span className="text-[8px] text-slate-500 block">kcal</span>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                  <span className="text-[9px] text-slate-500 font-medium block">Sat Fat</span>
                  <span className="text-xs font-bold text-rose-400 block mt-0.5">
                    {newSatFat}
                  </span>
                  <span className="text-[8px] text-slate-500 block">g</span>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                  <span className="text-[9px] text-slate-500 font-medium block">Protein</span>
                  <span className="text-xs font-bold text-violet-400 block mt-0.5">
                    {newProtein}
                  </span>
                  <span className="text-[8px] text-slate-500 block">g</span>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                  <span className="text-[9px] text-slate-500 font-medium block">Carbs</span>
                  <span className="text-xs font-bold text-amber-400 block mt-0.5">
                    {newCarbs}
                  </span>
                  <span className="text-[8px] text-slate-500 block">g</span>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 border border-white/5">
                  <span className="text-[9px] text-slate-500 font-medium block">Total Fat</span>
                  <span className="text-xs font-bold text-indigo-400 block mt-0.5">
                    {newTotalFat}
                  </span>
                  <span className="text-[8px] text-slate-500 block">g</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-800 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-[2] rounded-xl bg-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-400 hover:shadow-brand-500/40 transition-all disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
