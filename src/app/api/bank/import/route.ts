import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return NextResponse.json({
    error: "Bank imports are not configured.",
    nextStep: "Implement CSV parsing or a consent-based Account Aggregator provider integration."
  }, { status: 501 });
}
