import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ progress: [], streak: null });

  const [{ data: progress }, { data: streak }] = await Promise.all([
    supabase
      .from("user_progress")
      .select("project_id, completed_steps, status, depth")
      .eq("user_id", user.id),
    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .single(),
  ]);

  return NextResponse.json({ progress: progress ?? [], streak: streak ?? null });
}
