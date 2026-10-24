"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export interface CategoryDonutChartProps {
  label: string;
  categoryKey: string;
  plannedPaise: number;
  spentPaise: number;
}

// Accessible palette consistent with RupeePilot emerald-green theme
const COLOR_SPENT = "#047857";     // emerald-700
const COLOR_REMAINING = "#a7f3d0"; // emerald-200
const COLOR_OVERSPENT = "#dc2626"; // rose-600
const COLOR_EMPTY = "#e2e8f0";     // slate-200

export function CategoryDonutChart({
  label,
  categoryKey,
  plannedPaise,
  spentPaise,
}: CategoryDonutChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fmt = (p: number) => inrFmt.format(p / 100);

  const hasAllocation = plannedPaise > 0;
  const isOverspent = hasAllocation && spentPaise > plannedPaise;
  const isFullySpent = hasAllocation && spentPaise === plannedPaise;
  const remainingPaise = hasAllocation ? Math.max(0, plannedPaise - spentPaise) : 0;
  const excessPaise = isOverspent ? spentPaise - plannedPaise : 0;

  // Percentage calculations
  const spentPct = hasAllocation
    ? Math.min(100, Math.round((spentPaise / plannedPaise) * 100))
    : 0;
  const remainingPct = hasAllocation ? Math.max(0, 100 - spentPct) : 0;

  // Chart data preparation
  let chartData: Array<{ name: string; value: number; fill: string }> = [];

  if (!hasAllocation) {
    chartData = [{ name: "No allocation", value: 1, fill: COLOR_EMPTY }];
  } else if (isOverspent) {
    // For overspent: Show planned allocation as 100% fully used, do not distort with negative slice
    chartData = [{ name: "Allocated (Exceeded)", value: plannedPaise, fill: COLOR_OVERSPENT }];
  } else if (isFullySpent) {
    chartData = [{ name: "Spent (100%)", value: plannedPaise, fill: COLOR_SPENT }];
  } else if (spentPaise === 0) {
    // 0% spent, 100% remaining
    chartData = [{ name: "Remaining", value: plannedPaise, fill: COLOR_REMAINING }];
  } else {
    // Partially spent
    chartData = [
      { name: "Spent", value: spentPaise, fill: COLOR_SPENT },
      { name: "Remaining", value: remainingPaise, fill: COLOR_REMAINING },
    ];
  }

  return (
    <div
      id={`category-chart-${categoryKey}`}
      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:shadow-sm"
    >
      {/* Category Card Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
          <span className="text-[11px] text-slate-500">
            {hasAllocation
              ? isOverspent
                ? "Budget exceeded"
                : isFullySpent
                ? "Budget exhausted"
                : "Active budget"
              : "No allocation set"}
          </span>
        </div>
        {isOverspent && (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-rose-700"
            title="Category spending has exceeded the planned allocation"
          >
            <AlertTriangle size={12} className="text-rose-600" />
            Overspent
          </span>
        )}
        {isFullySpent && !isOverspent && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
            <CheckCircle2 size={12} className="text-slate-600" />
            100% Used
          </span>
        )}
      </div>

      {/* Donut Chart Visual */}
      <div className="relative my-3 flex h-[150px] w-full items-center justify-center">
        {!mounted ? (
          <div className="h-[130px] w-[130px] animate-pulse rounded-full border-4 border-slate-100 bg-slate-50" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={62}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  isAnimationActive={true}
                  animationDuration={400}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                {hasAllocation && (
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const val = Number(item.value ?? 0);
                      const pct =
                        plannedPaise > 0
                          ? Math.round((val / plannedPaise) * 100)
                          : 0;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md">
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-slate-600">
                            {fmt(val)} ({pct}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {!hasAllocation ? (
                <div className="px-2">
                  <span className="block text-[11px] font-semibold text-amber-700">
                    No
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    allocation
                  </span>
                </div>
              ) : isOverspent ? (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Over
                  </span>
                  <span className="block text-xs font-extrabold text-rose-700">
                    +{fmt(excessPaise)}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="block text-base font-extrabold text-slate-900 leading-tight">
                    {spentPct}%
                  </span>
                  <span className="block text-[10px] font-medium text-slate-500 leading-none">
                    spent
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Numeric Details & Legend */}
      <div className="space-y-1.5 rounded-lg bg-slate-50 p-2.5 text-xs">
        {hasAllocation ? (
          <>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Allocation:
              </span>
              <strong className="font-semibold text-slate-900">
                {fmt(plannedPaise)}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isOverspent ? COLOR_OVERSPENT : COLOR_SPENT,
                  }}
                />
                Spent ({spentPct}%):
              </span>
              <strong
                className={
                  isOverspent ? "font-bold text-rose-700" : "font-semibold text-slate-900"
                }
              >
                {fmt(spentPaise)}
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLOR_REMAINING }}
                />
                Remaining ({remainingPct}%):
              </span>
              <strong
                className={
                  isOverspent
                    ? "font-medium text-slate-400"
                    : "font-semibold text-emerald-800"
                }
              >
                {isOverspent ? fmt(0) : fmt(remainingPaise)}
              </strong>
            </div>

            {isOverspent && (
              <div className="mt-1 border-t border-rose-200 pt-1 text-center font-semibold text-rose-700 text-[11px]">
                Overspent by {fmt(excessPaise)}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-1">
            <p className="text-[11px] font-medium text-slate-600">
              No allocation planned
            </p>
            {spentPaise > 0 ? (
              <p className="mt-0.5 text-xs font-semibold text-rose-700">
                Spent without budget: {fmt(spentPaise)}
              </p>
            ) : (
              <p className="mt-0.5 text-[10px] text-slate-400">
                ₹0 spent in this category
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
