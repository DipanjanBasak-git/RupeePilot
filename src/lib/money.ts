export function paiseToRupees(paise: number | string | null | undefined): number {
  return Number(paise ?? 0) / 100;
}

export function rupeesToPaise(input: string | number): number {
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Enter a valid amount.");
  }
  const paise = Math.round(value * 100);
  if (!Number.isSafeInteger(paise)) {
    throw new Error("Amount is too large.");
  }
  return paise;
}

export function formatINR(paise: number | string | null | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(paiseToRupees(paise));
}

export function currentMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
