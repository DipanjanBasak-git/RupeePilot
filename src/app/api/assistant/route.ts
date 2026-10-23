import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  return NextResponse.json({
    error: "The AI assistant is not configured.",
    nextStep: "Add a server-only AI provider key and implement validated budget query tools."
  }, { status: 501 });
}
