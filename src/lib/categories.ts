export const CATEGORIES = [
  { value: "home", label: "Home contribution" },
  { value: "sip", label: "SIP commitment" },
  { value: "savings", label: "Savings" },
  { value: "bills", label: "Rent and bills" },
  { value: "personal", label: "Personal spending" },
  { value: "buffer", label: "Buffer" },
  { value: "other", label: "Other" }
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.label])
) as Record<Category, string>;

export const CATEGORY_COLORS: Record<Category, string> = {
  home: "#059669",      // emerald-600
  sip: "#0284c7",       // sky-600
  savings: "#0d9488",   // teal-600
  bills: "#6366f1",     // indigo-500
  personal: "#f59e0b",  // amber-500
  buffer: "#8b5cf6",    // purple-500
  other: "#64748b",     // slate-500
};

export const CATEGORY_BADGE_STYLES: Record<Category, { bg: string; text: string; border: string; dot: string }> = {
  home: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  sip: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-500" },
  savings: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  bills: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  personal: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  buffer: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  other: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" },
};
