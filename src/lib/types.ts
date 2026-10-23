import type { Category } from "@/lib/categories";

export type Budget = {
  id: string;
  user_id: string;
  budget_month: string;
  income_paise: number;
};

export type Allocation = {
  id: string;
  budget_id: string;
  category: Category;
  planned_paise: number;
};

export type Transaction = {
  id: string;
  kind: "income" | "expense";
  amount_paise: number;
  category: Category;
  description: string;
  transaction_date: string;
  source: "manual" | "csv" | "account_aggregator";
};

export type BudgetSummary = {
  incomePaise: number;
  plannedPaise: number;
  expensesPaise: number;
  incomeTransactionsPaise: number;
  unallocatedPaise: number;
  discretionaryRemainingPaise: number;
};
