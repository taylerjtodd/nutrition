"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { FocusMacro, UserSettings } from "@/lib/db";

interface TrendsChartProps {
  analytics: Array<{
    weekStart: string;
    loggedDaysCount: number;
    calories: number;
    saturatedFat: number;
    protein: number;
    totalFat: number;
    carbs: number;
  }>;
  settings: UserSettings;
}

const MACRO_INFO: Record<
  FocusMacro,
  { label: string; unit: string; colorClass: string; hexColor: string; emoji: string }
> = {
  saturatedFat: {
    label: "Saturated Fat",
    unit: "g",
    colorClass: "text-rose-500",
    hexColor: "#f43f5e",
    emoji: "🥩",
  },
  calories: {
    label: "Calories",
    unit: "kcal",
    colorClass: "text-sky-500",
    hexColor: "#0ea5e9",
    emoji: "🔥",
  },
  protein: {
    label: "Protein",
    unit: "g",
    colorClass: "text-violet-500",
    hexColor: "#8b5cf6",
    emoji: "💪",
  },
  carbs: {
    label: "Carbohydrates",
    unit: "g",
    colorClass: "text-amber-500",
    hexColor: "#f59e0b",
    emoji: "🌾",
  },
  totalFat: {
    label: "Total Fat",
    unit: "g",
    colorClass: "text-indigo-500",
    hexColor: "#6366f1",
    emoji: "🥑",
  },
};

export default function TrendsChart({ analytics, settings }: TrendsChartProps) {
  const [activeMacro, setActiveMacro] = useState<FocusMacro>(settings.focusMacro);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: height || 400 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const info = MACRO_INFO[activeMacro];
  const targetKey = `target${activeMacro.charAt(0).toUpperCase() + activeMacro.slice(1)}` as keyof UserSettings;
  const targetLimit = settings[targetKey] as number;

  const padding = { top: 40, right: 30, bottom: 40, left: 50 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (analytics.length <= 1) return padding.left;
    return padding.left + (index / (analytics.length - 1)) * chartWidth;
  };

  const maxValue = useMemo(() => {
    const maxData = Math.max(...analytics.map((d) => d[activeMacro]), targetLimit || 0);
    return maxData > 0 ? maxData * 1.15 : 100;
  }, [analytics, activeMacro, targetLimit]);

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxValue) * chartHeight;
  };

  const linePath = useMemo(() => {
    return analytics
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[activeMacro])}`)
      .join(" ");
  }, [analytics, activeMacro, maxValue, chartWidth, chartHeight]);

  const areaPath = useMemo(() => {
    if (analytics.length === 0) return "";
    return `${linePath} L ${getX(analytics.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${
      padding.top + chartHeight
    } Z`;
  }, [linePath, analytics, chartWidth, chartHeight]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (dimensions.width === 0) {
    return <div ref={containerRef} className="w-full h-[400px]" />;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Macro Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {(Object.keys(MACRO_INFO) as FocusMacro[]).map((macro) => {
          const isSelected = activeMacro === macro;
          return (
            <button
              key={macro}
              onClick={() => setActiveMacro(macro)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? `border-[${MACRO_INFO[macro].hexColor}]/50 bg-[${MACRO_INFO[macro].hexColor}]/10 text-white shadow-lg shadow-[${MACRO_INFO[macro].hexColor}]/20`
                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              style={
                isSelected
                  ? {
                      borderColor: `${MACRO_INFO[macro].hexColor}80`,
                      backgroundColor: `${MACRO_INFO[macro].hexColor}1a`,
                      boxShadow: `0 0 15px -3px ${MACRO_INFO[macro].hexColor}40`,
                    }
                  : {}
              }
            >
              <span>{MACRO_INFO[macro].emoji}</span>
              {MACRO_INFO[macro].label}
            </button>
          );
        })}
      </div>

      <div ref={containerRef} className="relative w-full flex-1 min-h-[400px]">
        {/* SVG Chart */}
        <svg width="100%" height="100%" className="absolute inset-0 overflow-visible">
          <defs>
            <linearGradient id={`gradient-${activeMacro}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={info.hexColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={info.hexColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (Y-axis) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight - chartHeight * ratio;
            const val = Math.round(maxValue * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={dimensions.width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="11"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X-axis labels (every ~4 weeks) */}
          {analytics.map((d, i) => {
            if (i % 4 !== 0 && i !== analytics.length - 1) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={dimensions.height - padding.bottom + 20}
                fill="#64748b"
                fontSize="11"
                textAnchor="middle"
              >
                {formatDate(d.weekStart)}
              </text>
            );
          })}

          {/* Target Limit Line */}
          <line
            x1={padding.left}
            y1={getY(targetLimit)}
            x2={dimensions.width - padding.right}
            y2={getY(targetLimit)}
            stroke={info.hexColor}
            strokeWidth="1.5"
            strokeDasharray="6 6"
            opacity="0.8"
          />

          {/* Area and Trend Line */}
          {analytics.length > 0 && (
            <>
              <path d={areaPath} fill={`url(#gradient-${activeMacro})`} />
              <path
                d={linePath}
                fill="none"
                stroke={info.hexColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 6px ${info.hexColor}40)` }}
              />
            </>
          )}

          {/* Hover highlight circle */}
          {hoveredIndex !== null && analytics[hoveredIndex] && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={dimensions.height - padding.bottom}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(analytics[hoveredIndex][activeMacro])}
                r="5"
                fill={info.hexColor}
                stroke="#1e293b"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover overlay bars for interaction */}
        <div className="absolute inset-0 flex" style={{ paddingLeft: padding.left, paddingRight: padding.right }}>
          {analytics.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-full cursor-crosshair z-10"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(i)}
            />
          ))}
        </div>

        {/* HTML Tooltip */}
        {hoveredIndex !== null && analytics[hoveredIndex] && (
          <div
            className="pointer-events-none absolute z-20 glass-card-dark p-3 shadow-2xl transition-all duration-100 ease-out flex flex-col gap-1 min-w-[160px]"
            style={{
              left: Math.min(
                Math.max(getX(hoveredIndex) - 80, 10),
                dimensions.width - 170
              ),
              top: Math.max(getY(analytics[hoveredIndex][activeMacro]) - 100, 10),
            }}
          >
            <div className="text-xs font-semibold text-slate-400 mb-1 border-b border-white/10 pb-1">
              Week of {formatDate(analytics[hoveredIndex].weekStart)}
            </div>
            
            {analytics[hoveredIndex].loggedDaysCount === 0 ? (
              <div className="text-sm text-slate-400 italic">No entries logged</div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-white">
                  <span>Avg {info.label}</span>
                  <span>
                    {analytics[hoveredIndex][activeMacro]} {info.unit}
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>Target</span>
                  <span>{targetLimit} {info.unit}</span>
                </div>
                
                <div
                  className={`text-xs font-semibold mt-1 ${
                    analytics[hoveredIndex][activeMacro] > targetLimit
                      ? "text-rose-400"
                      : "text-emerald-400"
                  }`}
                >
                  {analytics[hoveredIndex][activeMacro] > targetLimit ? (
                    <>+ {Math.round((analytics[hoveredIndex][activeMacro] - targetLimit) * 10) / 10} over target</>
                  ) : (
                    <>- {Math.round((targetLimit - analytics[hoveredIndex][activeMacro]) * 10) / 10} under target</>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
