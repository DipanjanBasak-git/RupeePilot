import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  budgetId: z.string().uuid(),
  allocations: z.array(z.object({
    category: z.enum(["home", "sip", "savings", "bills", "personal", "buffer", "other"]),
    amountRupees: z.number().finite().min(0).max(100000000)
  })).max(7)
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid allocation data." }, { status: 400 });

  const { data: budget, error: budgetError } = await supabase
    .from("monthly_budgets")
    .select("id,income_paise")
    .eq("id", parsed.data.budgetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (budgetError || !budget) return NextResponse.json({ error: "Budget not found." }, { status: 404 });

  const rows = parsed.data.allocations.map((item) => ({
    user_id: user.id,
    budget_id: budget.id,
    category: item.category,
    planned_paise: Math.round(item.amountRupees * 100),
    updated_at: new Date().toISOString()
  }));
  const total = rows.reduce((sum, row) => sum + row.planned_paise, 0);
  if (total > Number(budget.income_paise)) {
    return NextResponse.json({ error: "Allocations exceed monthly income." }, { status: 400 });
  }

  const { error } = await supabase.from("budget_allocations").upsert(rows, { onConflict: "budget_id,category" });
  if (error) return NextResponse.json({ error: "Could not save allocations." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
