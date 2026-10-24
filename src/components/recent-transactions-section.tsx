"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Filter,
  FilterX,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  Trash2,
} from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_BADGE_STYLES,
  type Category,
} from "@/lib/categories";
import { formatINR } from "@/lib/money";
import type { Transaction } from "@/lib/types";

interface RecentTransactionsSectionProps {
  transactions: Transaction[];
  deleteTransactionAction: (formData: FormData) => Promise<void>;
  initialCategory?: string;
}

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function RecentTransactionsSection({
  transactions,
  deleteTransactionAction,
  initialCategory,
}: RecentTransactionsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (initialCategory && (initialCategory in CATEGORY_LABELS)) {
      return initialCategory;
    }
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Count transactions per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length };
    for (const cat of CATEGORIES) {
      counts[cat.value] = 0;
    }
    for (const t of transactions) {
      if (t.category in counts) {
        counts[t.category] = (counts[t.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [transactions]);

  // Filter transactions based on category and search query
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Category filter
      if (selectedCategory !== "all" && t.category !== selectedCategory) {
        return false;
      }
      // Search query filter (matches description, source, or amount)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesSource = t.source.toLowerCase().includes(query);
        const matchesCategory = (CATEGORY_LABELS[t.category] ?? "").toLowerCase().includes(query);
        const matchesAmount = (t.amount_paise / 100).toString().includes(query);
        if (!matchesDesc && !matchesSource && !matchesCategory && !matchesAmount) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, selectedCategory, searchQuery]);

  // Sort filtered transactions
  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    list.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.transaction_date.localeCompare(b.transaction_date);
        case "date-desc":
          return b.transaction_date.localeCompare(a.transaction_date);
        case "amount-desc":
          return b.amount_paise - a.amount_paise;
        case "amount-asc":
          return a.amount_paise - b.amount_paise;
        default:
          return 0;
      }
    });
    return list;
  }, [filteredTransactions, sortBy]);

  // Calculate totals for filtered items
  const filteredStats = useMemo(() => {
    let expenseTotal = 0;
    let incomeTotal = 0;
    for (const t of filteredTransactions) {
      if (t.kind === "expense") {
        expenseTotal += Number(t.amount_paise);
      } else {
        incomeTotal += Number(t.amount_paise);
      }
    }
    return { expenseTotal, incomeTotal, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const isFiltered = selectedCategory !== "all" || searchQuery.trim() !== "";
  const activeCategoryObj = CATEGORIES.find((c) => c.value === selectedCategory);

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
  };

  return (
    <section
      id="recent-transactions"
      className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Recent transactions</h2>
            {isFiltered && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                Filtered
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isFiltered
              ? `Showing ${sortedTransactions.length} of ${transactions.length} records for this month.`
              : "Showing up to 100 records for this month."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/imports"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Import transactions
          </Link>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="border-b border-slate-100 bg-slate-50/70 p-4 space-y-3">
          {/* Controls Bar: Category Dropdown, Search Input, and Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Dropdown */}
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <label htmlFor="category-filter-select" className="sr-only">
                Filter by Category
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Filter size={16} />
              </div>
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm font-medium text-slate-800 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors cursor-pointer"
              >
                <option value="all">
                  All categories ({categoryCounts["all"] ?? 0})
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({categoryCounts[cat.value] ?? 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <label htmlFor="transaction-search-input" className="sr-only">
                Search transactions
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={15} />
              </div>
              <input
                id="transaction-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, amount..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[150px]">
              <label htmlFor="transaction-sort-select" className="sr-only">
                Sort transactions
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <ArrowUpDown size={14} />
              </div>
              <select
                id="transaction-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-7 text-xs font-medium text-slate-700 shadow-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors cursor-pointer"
              >
                <option value="date-desc">Date (Newest first)</option>
                <option value="date-asc">Date (Oldest first)</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="amount-asc">Amount (Low to High)</option>
              </select>
            </div>

            {/* Clear All Filters button if filtered */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-xs hover:border-slate-300 hover:text-slate-900 transition-colors"
              >
                <RotateCcwIcon size={12} />
                Reset filters
              </button>
            )}
          </div>

          {/* Category Filter Pills (Quick 1-Click Access) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Tag size={12} /> Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  selectedCategory === "all"
                    ? "bg-emerald-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {categoryCounts["all"] ?? 0}
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.value] ?? 0;
              const isSelected = selectedCategory === cat.value;
              const badgeStyle = CATEGORY_BADGE_STYLES[cat.value];
              const dotColor = CATEGORY_COLORS[cat.value];

              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? "ring-2 ring-emerald-700 bg-white font-bold shadow-xs text-slate-900"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: dotColor }
                      : undefined
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      isSelected
                        ? "bg-slate-900 text-white"
                        : count > 0
                        ? "bg-slate-100 text-slate-700 font-bold"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Subtotal Strip */}
          {selectedCategory !== "all" && activeCategoryObj && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-emerald-950">Active category filter:</span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-0.5 font-bold text-slate-800 border border-emerald-200 shadow-2xs">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: CATEGORY_COLORS[selectedCategory as Category] }}
                  />
                  {activeCategoryObj.label}
                </span>
                <span className="text-slate-600">
                  · {filteredStats.count} {filteredStats.count === 1 ? "record" : "records"}
                </span>
                {filteredStats.expenseTotal > 0 && (
                  <span className="font-semibold text-slate-900">
                    · Total spent: {formatINR(filteredStats.expenseTotal)}
                  </span>
                )}
                {filteredStats.incomeTotal > 0 && (
                  <span className="font-semibold text-emerald-800">
                    · Total income: +{formatINR(filteredStats.incomeTotal)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline hover:no-underline"
              >
                <X size={12} /> Clear category filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Table / Empty States */}
      {transactions.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-semibold text-slate-800">No transactions yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add your first transaction to see your spending here.
          </p>
        </div>
      ) : sortedTransactions.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 mb-3">
            <FilterX size={24} />
          </div>
          <p className="font-bold text-slate-800 text-base">
            No transactions found
          </p>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {selectedCategory !== "all"
              ? `No transactions recorded under "${
                  CATEGORY_LABELS[selectedCategory as Category] ?? selectedCategory
                }" for this month${searchQuery ? ` matching "${searchQuery}"` : ""}.`
              : `No transactions match your search "${searchQuery}".`}
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition-colors"
            >
              Show all transactions
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTransactions.map((transaction) => {
                const badge = CATEGORY_BADGE_STYLES[transaction.category] ?? {
                  bg: "bg-slate-100",
                  text: "text-slate-700",
                  border: "border-slate-200",
                  dot: "bg-slate-400",
                };
                const dotColor = CATEGORY_COLORS[transaction.category] ?? "#64748b";

                return (
                  <tr
                    key={transaction.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500 text-xs font-medium">
                      {transaction.transaction_date}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {transaction.description}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(transaction.category)}
                        title={`Filter by ${CATEGORY_LABELS[transaction.category] ?? transaction.category}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-transform hover:scale-105 cursor-pointer ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: dotColor }}
                        />
                        {CATEGORY_LABELS[transaction.category] ?? transaction.category}
                      </button>
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                        transaction.kind === "income"
                          ? "text-emerald-800"
                          : "text-slate-900"
                      }`}
                    >
                      {transaction.kind === "income" ? "+" : "-"}
                      {formatINR(transaction.amount_paise)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize">
                        {transaction.source}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <form
                        action={deleteTransactionAction}
                        onSubmit={(e) => {
                          if (
                            !window.confirm(
                              `Delete transaction "${transaction.description}"?`
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input
                          type="hidden"
                          name="transactionId"
                          value={transaction.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count indicator if filtered */}
      {isFiltered && sortedTransactions.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          <span>
            Showing <strong>{sortedTransactions.length}</strong> of{" "}
            <strong>{transactions.length}</strong> transactions
            {selectedCategory !== "all" && (
              <> in <strong>{CATEGORY_LABELS[selectedCategory as Category] ?? selectedCategory}</strong></>
            )}
          </span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="font-medium text-emerald-800 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}

function RotateCcwIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
