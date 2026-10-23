import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, FileUp, Landmark } from "lucide-react";

export default async function ImportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <main className="min-h-screen px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft size={16}/>Back to dashboard</Link>
      <h1 className="mt-6 text-3xl font-bold">Transaction imports</h1>
      <p className="mt-2 text-slate-600">Imports are not enabled in this starter. The database and application boundaries are prepared for later integration.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <FileUp className="text-emerald-800" size={25}/>
          <h2 className="mt-3 font-semibold">CSV statement upload</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Next step: implement a file parser, column mapping, preview, validation, duplicate detection and explicit import confirmation.</p>
          <span className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Not enabled</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Landmark className="text-emerald-800" size={25}/>
          <h2 className="mt-3 font-semibold">Bank connection</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Next step: confirm eligibility with an Account Aggregator provider, then implement consent, verified callbacks, secure token storage and reconciliation.</p>
          <span className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Provider access required</span>
        </div>
      </div>
    </div>
  </main>;
}
