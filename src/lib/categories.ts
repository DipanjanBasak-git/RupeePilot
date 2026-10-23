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
