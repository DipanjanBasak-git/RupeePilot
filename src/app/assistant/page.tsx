import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Bot } from "lucide-react";

export default async function AssistantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <main className="min-h-screen px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft size={16}/>Back to dashboard</Link>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <Bot className="text-emerald-800" size={30}/>
        <h1 className="mt-4 text-3xl font-bold">AI budget assistant</h1>
        <p className="mt-3 leading-7 text-slate-600">The assistant is not connected to an AI provider yet. When implemented, it will answer budget questions using server-side tools that read only your own records.</p>
        <h2 className="mt-6 font-semibold">Planned capabilities</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
          <li>Check whether a proposed purchase fits your remaining budget.</li>
          <li>Explain which categories exceeded their allocations.</li>
          <li>Summarise spending for a selected month.</li>
          <li>Suggest adjustments without changing allocations unless you confirm.</li>
        </ul>
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">The assistant will not move money, initiate investments, or make financial calculations without deterministic application functions.</p>
      </div>
    </div>
  </main>;
}
