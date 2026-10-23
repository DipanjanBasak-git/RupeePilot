"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wallet } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setMessage("Account created. Check your email to confirm your address, then sign in.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        const next = searchParams.get("next");
        const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
        router.push(safeNext);
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="mb-8 flex items-center gap-2 font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-white"><Wallet size={21} /></span>RupeePilot</Link>
        <h1 className="text-2xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-600">{mode === "signup" ? "Start planning your monthly finances." : "Sign in to manage your monthly plan."}</p>
        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          {mode === "signup" && <label className="block text-sm font-medium">Name
            <input autoComplete="name" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
          </label>}
          <label className="block text-sm font-medium">Email
            <input required type="email" autoComplete="email" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Password
            <input required minLength={8} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700" value={password} onChange={(e) => setPassword(e.target.value)} />
            {mode === "signup" && <span className="mt-1 block text-xs text-slate-500">Use at least 8 characters.</span>}
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-sm text-slate-600">{mode === "signup" ? "Already have an account?" : "New to RupeePilot?"} <Link className="font-semibold text-emerald-800" href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? "Sign in" : "Create an account"}</Link></p>
        <Link href="/" className="mt-5 inline-block text-sm text-slate-500 hover:text-slate-800">Back to home</Link>
      </div>
    </main>
  );
}
