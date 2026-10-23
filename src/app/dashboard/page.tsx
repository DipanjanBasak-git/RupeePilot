import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CircleHelp, Plus, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR, currentMonthStart } from "@/lib/money";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/categories";
import { calculateBudgetSummary } from "@/lib/budget";
import { saveBudgetAction, addTransactionAction, deleteTransactionAction, signOutAction } from "@/app/actions";
import { AllocationEditor } from "@/components/allocation-editor";
import type { Allocation, Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const rawMonth = params.month ?? "";
  const month = /^\d{4}-\d{2}-01$/.test(rawMonth)
    ? rawMonth
    : /^\d{4}-\d{2}$/.test(rawMonth)
      ? `${rawMonth}-01`
      : currentMonthStart();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: budget } = await supabase
    .from("monthly_budgets")
    .select("*")
    .eq("user_id", user.id)
    .eq("budget_month", month)
    .maybeSingle();

  const budgetId = budget?.id ?? null;
  const [{ data: allocationsData }, { data: transactionsData }, { data: profile }] = await Promise.all([
    budgetId
      ? supabase.from("budget_allocations").select("*").eq("user_id", user.id).eq("budget_id", budgetId)
      : Promise.resolve({ data: [] as Allocation[] }),
    supabase.from("transactions").select("*").eq("user_id", user.id)
      .gte("transaction_date", month)
      .lt("transaction_date", nextMonth(month))
      .order("transaction_date", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
  ]);

  const allocations = (allocationsData ?? []) as Allocation[];
  const transactions = (transactionsData ?? []) as Transaction[];
  const incomePaise = Number(budget?.income_paise ?? 0);
  const summary = calculateBudgetSummary(incomePaise, allocations, transactions);
  const allocationMap = new Map(allocations.map((item) => [item.category, item]));
  const categorySpent = new Map<Category, number>();
  for (const transaction of transactions) {
    if (transaction.kind === "expense") {
      categorySpent.set(transaction.category, (categorySpent.get(transaction.category) ?? 0) + Number(transaction.amount_paise));
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-white"><Wallet size={20}/></span>RupeePilot</Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{profile?.display_name || user.email}</span>
            <form action={signOutAction}><button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">Sign out</button></form>
          </div>
        </header>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm text-slate-500">Your finances</p><h1 className="mt-1 text-3xl font-bold">Dashboard</h1><p className="mt-2 text-sm text-slate-600">Plan your income and monitor your spending.</p></div>
          <form className="flex items-center gap-2" action="/dashboard">
            <CalendarDays size={18} className="text-slate-500"/>
            <input aria-label="Budget month" type="month" name="month" defaultValue={month.slice(0, 7)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">View</button>
          </form>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat title="Monthly income" value={formatINR(incomePaise)} icon={<ArrowDownLeft size={18}/>} detail="Your planned salary"/>
          <Stat title="Planned allocations" value={formatINR(summary.plannedPaise)} icon={<Wallet size={18}/>} detail="Money assigned a purpose"/>
          <Stat title="Recorded expenses" value={formatINR(summary.expensesPaise)} icon={<ArrowUpRight size={18}/>} detail={`${transactions.length} transactions this month`}/>
          <Stat title="Unallocated income" value={formatINR(summary.unallocatedPaise)} icon={<CircleHelp size={18}/>} detail={summary.unallocatedPaise < 0 ? "Allocations exceed income" : "Income minus allocations"} negative={summary.unallocatedPaise < 0}/>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-lg font-bold">Monthly salary plan</h2><p className="mt-1 text-sm text-slate-500">Set income, then assign each rupee a purpose.</p></div>
            </div>
            <form action={saveBudgetAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-sm font-medium">Budget month
                <input type="hidden" name="budgetMonth" value={month} />
                <input disabled type="month" value={month.slice(0, 7)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-500" />
              </label>
              <label className="text-sm font-medium">Monthly take-home salary (₹)
                <input required min="0" step="0.01" type="number" name="incomeRupees" defaultValue={incomePaise / 100 || ""} placeholder="35000" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </label>
              <button className="rounded-xl bg-emerald-800 px-4 py-2.5 font-semibold text-white hover:bg-emerald-900">Save income</button>
            </form>
            {!budget && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Save your income first. Then set your category allocations below.</p>}

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between"><h3 className="font-semibold">Category allocations</h3><span className="text-xs text-slate-500">INR</span></div>
              <AllocationEditor budgetId={budgetId ?? ""} incomePaise={incomePaise} existing={allocations} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold">Add transaction</h2>
            <p className="mt-1 text-sm text-slate-500">Record an income or expense manually.</p>
            <form action={addTransactionAction} className="mt-5 space-y-4">
              <input type="hidden" name="budgetId" value={budgetId ?? ""}/>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm font-medium">Type
                  <select name="kind" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5">
                    <option value="expense">Expense</option><option value="income">Income</option>
                  </select>
                </label>
                <label className="text-sm font-medium">Amount (₹)
                  <input required type="number" min="0.01" step="0.01" name="amountRupees" placeholder="250" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"/>
                </label>
              </div>
              <label className="block text-sm font-medium">Category
                <select name="category" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5">
                  {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Description
                <input required maxLength={180} name="description" placeholder="Lunch, metro, electricity bill..." className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"/>
              </label>
              <label className="block text-sm font-medium">Transaction date
                <input required type="date" name="transactionDate" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5"/>
              </label>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900"><Plus size={18}/>Save transaction</button>
            </form>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5">
            <div><h2 className="text-lg font-bold">Recent transactions</h2><p className="mt-1 text-sm text-slate-500">Showing up to 100 records for this month.</p></div>
            <Link href="/imports" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Import transactions</Link>
          </div>
          {transactions.length === 0 ? <div className="p-10 text-center"><p className="font-semibold">No transactions yet</p><p className="mt-1 text-sm text-slate-500">Add your first transaction to see your spending here.</p></div> :
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Description</th><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 text-right font-semibold">Amount</th><th className="px-5 py-3">Source</th><th className="px-5 py-3"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">{transaction.transaction_date}</td>
                    <td className="px-5 py-4 font-medium">{transaction.description}</td>
                    <td className="px-5 py-4 text-slate-600">{CATEGORY_LABELS[transaction.category] ?? transaction.category}</td>
                    <td className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${transaction.kind === "income" ? "text-emerald-800" : "text-slate-900"}`}>{transaction.kind === "income" ? "+" : "-"}{formatINR(transaction.amount_paise)}</td>
                    <td className="px-5 py-4 text-slate-500">{transaction.source}</td>
                    <td className="px-5 py-4"><form action={deleteTransactionAction}><input type="hidden" name="transactionId" value={transaction.id}/><button className="text-xs font-semibold text-rose-700 hover:underline">Delete</button></form></td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <div className="flex items-center gap-2 font-semibold"><Wallet size={19}/>Bank imports</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">CSV import and consent-based account connections are not enabled yet. Use the import page to review the implementation plan.</p>
            <Link href="/imports" className="mt-3 inline-block text-sm font-semibold text-emerald-800">View import status →</Link>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <div className="flex items-center gap-2 font-semibold"><CircleHelp size={19}/>AI budget assistant</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">The AI integration is intentionally disabled. The budget calculations shown here are deterministic application calculations.</p>
            <Link href="/assistant" className="mt-3 inline-block text-sm font-semibold text-emerald-800">View assistant status →</Link>
          </div>
        </section>
        <footer className="py-8 text-center text-xs text-slate-500">RupeePilot · Your plan is not a bank balance. Verify actual balances and upcoming commitments.</footer>
      </div>
    </main>
  );
}

function nextMonth(month: string) {
  const [year, monthNum] = month.slice(0, 7).split("-").map(Number);
  return monthNum === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNum + 1).padStart(2, "0")}-01`;
}

function Stat({ title, value, icon, detail, negative = false }: { title: string; value: string; icon: React.ReactNode; detail: string; negative?: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between text-slate-500"><span className="text-sm">{title}</span><span>{icon}</span></div>
    <p className={`mt-3 text-2xl font-bold tracking-tight ${negative ? "text-rose-700" : "text-slate-900"}`}>{value}</p>
    <p className="mt-2 text-xs text-slate-500">{detail}</p>
  </div>;
}

