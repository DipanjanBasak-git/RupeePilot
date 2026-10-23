import Link from "next/link";
import { Wallet, ShieldCheck, ChartNoAxesCombined } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-white"><Wallet size={21} /></span>
          RupeePilot
        </div>
        <section className="grid gap-10 py-20 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-800">Your money, planned</p>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">Know what you can spend before you spend it.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Plan your salary, reserve money for commitments, and keep your monthly expenses under control.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900" href="/signup">Create account</Link>
              <Link className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold hover:bg-slate-50" href="/login">Sign in</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Example monthly plan</p>
            <p className="mt-2 text-4xl font-bold">₹35,000</p>
            <div className="mt-6 space-y-4">
              {[
                ["Home contribution", "₹8,000", "w-[23%]"],
                ["Savings", "₹7,000", "w-[20%]"],
                ["Rent and bills", "₹8,000", "w-[23%]"],
                ["Personal spending", "₹5,000", "w-[14%]"]
              ].map(([label, amount, width]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{amount}</strong></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full bg-emerald-700 ${width}`} /></div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-500">Illustrative figures. Set your own amounts after signing in.</p>
          </div>
        </section>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [ShieldCheck, "Private by design", "Your account only sees its own records."],
            [Wallet, "Plan every rupee", "Allocate income before spending."],
            [ChartNoAxesCombined, "Track your progress", "Compare planned budgets with recorded expenses."]
          ].map(([Icon, title, desc]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5">
              <FeatureIcon className="text-emerald-800" size={23} />
              <h2 className="mt-3 font-semibold">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc as string}</p>
            </div>;
          })}
        </div>
      </div>
    </main>
  );
}
