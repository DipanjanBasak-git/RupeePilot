import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Loading...</main>}>
    <AuthForm mode="signup" />
  </Suspense>;
}
