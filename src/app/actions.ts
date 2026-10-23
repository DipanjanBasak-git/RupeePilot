"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/money";
import { allocationsSchema, budgetSchema, transactionSchema } from "@/lib/validators";

async function getUserAndClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

export async function signOutAction() {
  const { supabase } = await getUserAndClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveBudgetAction(formData: FormData) {
  const parsed = budgetSchema.safeParse({
    budgetMonth: formData.get("budgetMonth"),
    incomeRupees: formData.get("incomeRupees")
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid budget.");

  const { supabase, user } = await getUserAndClient();
  const incomePaise = Math.round(parsed.data.incomeRupees * 100);
  const { data: budget, error } = await supabase
    .from("monthly_budgets")
    .upsert({
      user_id: user.id,
      budget_month: parsed.data.budgetMonth,
      income_paise: incomePaise,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,budget_month" })
    .select("id")
    .single();

  if (error || !budget) throw new Error(error?.message ?? "Could not save budget.");
  revalidatePath("/dashboard");
}

export async function saveAllocationsAction(formData: FormData) {
  const raw = formData.get("allocations");
  let allocations: unknown;
  try {
    allocations = JSON.parse(String(raw ?? "[]"));
  } catch {
    throw new Error("Invalid allocation data.");
  }

  const parsed = allocationsSchema.safeParse({
    budgetId: formData.get("budgetId"),
    allocations
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid allocations.");

  const { supabase, user } = await getUserAndClient();
  const { data: budget, error: budgetError } = await supabase
    .from("monthly_budgets")
    .select("id,income_paise")
    .eq("id", parsed.data.budgetId)
    .eq("user_id", user.id)
    .single();

  if (budgetError || !budget) throw new Error("Budget not found.");
  const normalized = parsed.data.allocations.map((item) => ({
    user_id: user.id,
    budget_id: budget.id,
    category: item.category,
    planned_paise: Math.round(item.amountRupees * 100),
    updated_at: new Date().toISOString()
  }));
  const plannedTotal = normalized.reduce((sum, item) => sum + item.planned_paise, 0);

  if (plannedTotal > Number(budget.income_paise)) {
    throw new Error("Allocations exceed your monthly income. Reduce one or more amounts.");
  }

  const { error } = await supabase.from("budget_allocations").upsert(normalized, {
    onConflict: "budget_id,category"
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function addTransactionAction(formData: FormData) {
  const budgetIdRaw = String(formData.get("budgetId") ?? "");
  const parsed = transactionSchema.safeParse({
    kind: formData.get("kind"),
    amountRupees: formData.get("amountRupees"),
    category: formData.get("category"),
    description: formData.get("description"),
    transactionDate: formData.get("transactionDate"),
    budgetId: budgetIdRaw || null
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid transaction.");

  const { supabase, user } = await getUserAndClient();
  if (parsed.data.budgetId) {
    const { data: budget } = await supabase
      .from("monthly_budgets")
      .select("id")
      .eq("id", parsed.data.budgetId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!budget) throw new Error("Selected budget does not belong to your account.");
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    budget_id: parsed.data.budgetId ?? null,
    kind: parsed.data.kind,
    amount_paise: rupeesToPaise(parsed.data.amountRupees),
    category: parsed.data.category,
    description: parsed.data.description,
    transaction_date: parsed.data.transactionDate,
    source: "manual"
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteTransactionAction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(transactionId)) throw new Error("Invalid transaction.");
  const { supabase, user } = await getUserAndClient();
  const { error } = await supabase.from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
