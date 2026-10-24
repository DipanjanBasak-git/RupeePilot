"use client";

import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/categories";
import { CategoryDonutChart } from "@/components/category-donut-chart";
import { OverviewDonutChart, type OverviewCategoryItem } from "@/components/overview-donut-chart";
import { PieChart as PieChartIcon } from "lucide-react";

export { CATEGORY_COLORS };

interface BudgetChartsSectionProps {
  incomePaise: number;
  plannedPaise: number;
  expensesPaise: number;
  unallocatedPaise: number;
  categoryAllocations: Partial<Record<Category, number>>;
  categorySpent: Partial<Record<Category, number>>;
}

export function BudgetChartsSection({
  incomePaise,
  plannedPaise,
  expensesPaise,
  unallocatedPaise,
  categoryAllocations,
  categorySpent,
}: BudgetChartsSectionProps) {
  // Calculate total remaining money within planned allocations
  const totalRemainingAllocatedPaise = CATEGORIES.reduce((sum, cat) => {
    const planned = categoryAllocations[cat.value] ?? 0;
    const spent = categorySpent[cat.value] ?? 0;
    if (planned <= 0) return sum;
    return sum + Math.max(0, planned - spent);
  }, 0);

  // Prepare categories list for the overview chart
  const overviewCategories: OverviewCategoryItem[] = CATEGORIES.map((cat) => ({
    category: cat.value,
    label: cat.label,
    plannedPaise: categoryAllocations[cat.value] ?? 0,
    spentPaise: categorySpent[cat.value] ?? 0,
    color: CATEGORY_COLORS[cat.value],
  }));

  return (
    <section className="mt-8 space-y-6" id="budget-allocation-charts">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-800 text-white shadow-xs">
            <PieChartIcon size={18} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Budget allocation & spending charts
            </h2>
            <p className="text-xs text-slate-500">
              Interactive visual breakdown of category allocations, spent balances, and budget exhaustion.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Overall Budget Overview Doughnut Chart */}
      <OverviewDonutChart
        incomePaise={incomePaise}
        plannedPaise={plannedPaise}
        expensesPaise={expensesPaise}
        unallocatedPaise={unallocatedPaise}
        totalRemainingAllocatedPaise={totalRemainingAllocatedPaise}
        categories={overviewCategories}
      />

      {/* 2. Individual Category Doughnut Charts */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Category allocation & spending
            </h3>
            <p className="text-xs text-slate-500">
              Doughnut charts showing planned allocation, spent amount, and remaining budget for each category.
            </p>
          </div>
          <span className="hidden sm:inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            7 Categories
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((category) => {
            const planned = categoryAllocations[category.value] ?? 0;
            const spent = categorySpent[category.value] ?? 0;
            return (
              <CategoryDonutChart
                key={category.value}
                categoryKey={category.value}
                label={category.label}
                plannedPaise={planned}
                spentPaise={spent}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
