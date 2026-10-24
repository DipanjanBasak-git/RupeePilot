"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, CircleHelp, AlertCircle, TrendingDown, ArrowDownLeft } from "lucide-react";

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export interface OverviewCategoryItem {
  category: string;
  label: string;
  plannedPaise: number;
  spentPaise: number;
  color: string;
}

export interface OverviewDonutChartProps {
  incomePaise: number;
  plannedPaise: number;
  expensesPaise: number;
  unallocatedPaise: number;
  totalRemainingAllocatedPaise: number;
  categories: OverviewCategoryItem[];
}

export function OverviewDonutChart({
  incomePaise,
  plannedPaise,
  expensesPaise,
  unallocatedPaise,
  totalRemainingAllocatedPaise,
  categories,
}: OverviewDonutChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fmt = (p: number) => inrFmt.format(p / 100);

  // Filter categories with planned allocation > 0
  const allocatedCategories = categories.filter((c) => c.plannedPaise > 0);

  // Build chart slices:
  // Each category slice represents plannedPaise.
  // If unallocatedPaise > 0, include an "Unallocated income" slice so the entire doughnut represents the monthly salary.
  const chartData: Array<{ name: string; value: number; fill: string }> = [];

  for (const cat of allocatedCategories) {
    chartData.push({
      name: cat.label,
      value: cat.plannedPaise,
      fill: cat.color,
    });
  }

  if (unallocatedPaise > 0) {
    chartData.push({
      name: "Unallocated income",
      value: unallocatedPaise,
      fill: "#cbd5e1", // slate-300
    });
  }

  const hasAnyData = incomePaise > 0 || plannedPaise > 0;
  const isOverAllocated = unallocatedPaise < 0;
  const allocationPct =
    incomePaise > 0
      ? Math.min(100, Math.round((plannedPaise / incomePaise) * 100))
      : plannedPaise > 0
      ? 100
      : 0;

  return (
    <div
      id="overall-budget-overview-chart"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Overall budget overview
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Distribution of monthly planned salary across categories and income allocation.
          </p>
        </div>
        {isOverAllocated && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} />
            Allocations exceed salary by {fmt(Math.abs(unallocatedPaise))}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_1fr] lg:items-center">
        {/* Doughnut Chart */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative h-[220px] w-[220px]">
            {!mounted ? (
              <div className="h-full w-full animate-pulse rounded-full border-8 border-slate-100 bg-slate-50" />
            ) : !hasAnyData ? (
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-8 border-dashed border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-400">
                  No budget set
                </span>
                <span className="text-[10px] text-slate-400">
                  Save income to view
                </span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={95}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={500}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0];
                        const val = Number(item.value ?? 0);
                        const base = incomePaise > 0 ? incomePaise : plannedPaise;
                        const pct = base > 0 ? Math.round((val / base) * 100) : 0;
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            <p className="text-slate-600">
                              {fmt(val)} ({pct}% of salary)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center of the Doughnut */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    {allocationPct}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Allocated
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Legend under chart for quick category recognition */}
          {allocatedCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 max-w-[280px]">
              {allocatedCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-1 text-[11px] text-slate-600"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.label}</span>
                </div>
              ))}
              {unallocatedPaise > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span>Unallocated</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5 Required Key Metrics Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {/* 1. Total monthly take-home income */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Monthly take-home income</span>
              <ArrowDownLeft size={16} className="text-emerald-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{fmt(incomePaise)}</p>
            <p className="mt-1 text-[11px] text-slate-500">Planned salary for this month</p>
          </div>

          {/* 2. Total planned allocations */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Total planned allocations</span>
              <Wallet size={16} className="text-emerald-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{fmt(plannedPaise)}</p>
            <p className="mt-1 text-[11px] text-slate-500">Assigned across budget categories</p>
          </div>

          {/* 3. Total recorded expenses */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Total recorded expenses</span>
              <TrendingDown size={16} className="text-slate-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{fmt(expensesPaise)}</p>
            <p className="mt-1 text-[11px] text-slate-500">Actual expenses recorded this month</p>
          </div>

          {/* 4. Unallocated income */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Unallocated income</span>
              <CircleHelp size={16} className="text-slate-500" />
            </div>
            <p
              className={`mt-2 text-xl font-bold ${
                unallocatedPaise < 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {fmt(unallocatedPaise)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Salary unassigned to any category
            </p>
          </div>

          {/* 5. Total remaining allocated budget */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 sm:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between text-emerald-900">
              <span className="text-xs font-semibold">
                Total remaining allocated budget
              </span>
              <span className="rounded bg-emerald-200/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                In Categories
              </span>
            </div>
            <p className="mt-2 text-xl font-extrabold text-emerald-900">
              {fmt(totalRemainingAllocatedPaise)}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800">
              Total unspent money available inside your planned category allocations (distinct from unallocated salary).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
