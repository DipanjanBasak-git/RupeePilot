import { z } from "zod";

export const budgetSchema = z.object({
  budgetMonth: z.string().regex(/^\d{4}-\d{2}-01$/, "Choose a valid budget month."),
  incomeRupees: z.coerce.number().finite().min(0).max(100000000)
});

export const allocationsSchema = z.object({
  budgetId: z.string().uuid(),
  allocations: z.array(z.object({
    category: z.enum(["home", "sip", "savings", "bills", "personal", "buffer", "other"]),
    amountRupees: z.coerce.number().finite().min(0).max(100000000)
  })).max(7)
});

export const transactionSchema = z.object({
  kind: z.enum(["income", "expense"]),
  amountRupees: z.coerce.number().finite().positive().max(100000000),
  category: z.enum(["home", "sip", "savings", "bills", "personal", "buffer", "other"]),
  description: z.string().trim().min(1).max(180),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budgetId: z.string().uuid().nullable().optional()
});
