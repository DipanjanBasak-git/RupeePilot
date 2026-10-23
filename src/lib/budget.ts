import type { Allocation, Transaction } from "@/lib/types";

export function calculateBudgetSummary(
  incomePaise: number,
  allocations: Allocation[],
  transactions: Transaction[]
) {
  const plannedPaise = allocations.reduce((sum, item) => sum + Number(item.planned_paise), 0);
  const expensesPaise = transactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + Number(item.amount_paise), 0);
  const incomeTransactionsPaise = transactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + Number(item.amount_paise), 0);

  const flexibleCategories = new Set(["personal", "other"]);
  const flexiblePlanned = allocations
    .filter((item) => flexibleCategories.has(item.category))
    .reduce((sum, item) => sum + Number(item.planned_paise), 0);
  const flexibleSpent = transactions
    .filter((item) => item.kind === "expense" && flexibleCategories.has(item.category))
    .reduce((sum, item) => sum + Number(item.amount_paise), 0);

  return {
    incomePaise,
    plannedPaise,
    expensesPaise,
    incomeTransactionsPaise,
    unallocatedPaise: incomePaise - plannedPaise,
    discretionaryRemainingPaise: flexiblePlanned - flexibleSpent
  };
}
