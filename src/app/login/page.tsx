import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Loading...</main>}>
    <AuthForm mode="login" />
  </Suspense>;
}
