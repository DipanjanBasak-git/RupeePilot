"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

type ExistingAllocation = { category: string; planned_paise: number };

export function AllocationEditor({
  budgetId,
  incomePaise,
  existing
}: {
  budgetId: string;
  incomePaise: number;
  existing: ExistingAllocation[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [
      c.value,
      String((existing.find((item) => item.category === c.value)?.planned_paise ?? 0) / 100)
    ]))
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const total = CATEGORIES.reduce((sum, c) => sum + Math.round(Math.max(0, Number(values[c.value] || 0)) * 100), 0);

  async function save() {
    setError("");
    setSuccess("");
    if (!budgetId) {
      setError("Save your income before saving allocations.");
      return;
    }
    if (total > incomePaise) {
      setError("Allocations exceed your monthly income. Reduce one or more amounts.");
      return;
    }
    const allocations = CATEGORIES.map((c) => ({
      category: c.value,
      amountRupees: Number(values[c.value] || 0)
    }));
    setSaving(true);
    try {
      const response = await fetch("/api/budget/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetId, allocations })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save allocations.");
      setSuccess("Allocations saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save allocations.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mt-4">
    <div className="space-y-3">
      {CATEGORIES.map((category) => (
        <label key={category.value} className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{category.label}</span>
          <span className="flex items-center gap-1 text-sm text-slate-500">₹
            <input
              type="number"
              min="0"
              step="0.01"
              value={values[category.value]}
              onChange={(e) => setValues((old) => ({ ...old, [category.value]: e.target.value }))}
              className="w-28 rounded-lg border border-slate-300 px-2.5 py-2 text-right text-slate-900"
              aria-label={`${category.label} allocation in rupees`}
            />
          </span>
        </label>
      ))}
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
      <span className="text-slate-600">Total allocated</span>
      <strong className={total > incomePaise ? "text-rose-700" : "text-slate-900"}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(total / 100)}</strong>
    </div>
    {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {success && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
    <button type="button" onClick={save} disabled={saving || !budgetId} className="mt-4 w-full rounded-xl border border-emerald-800 px-4 py-2.5 font-semibold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
      {saving ? "Saving..." : "Save allocations"}
    </button>
    <p className="mt-2 text-xs text-slate-500">SIP and savings are planned commitments. This app does not transfer money.</p>
  </div>;
}
