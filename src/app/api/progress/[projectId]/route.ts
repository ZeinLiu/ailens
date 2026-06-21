import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null);

  const { data } = await supabase
    .from("user_progress")
    .select("completed_steps, depth, status")
    .eq("user_id", user.id)
    .eq("project_id", Number(projectId))
    .single();

  return NextResponse.json(data ?? null);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { stepIndex, depth, totalSteps } = await req.json() as {
    stepIndex: number;
    depth: string;
    totalSteps: number;
  };

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch current row
  const { data: existing } = await supabase
    .from("user_progress")
    .select("completed_steps")
    .eq("user_id", user.id)
    .eq("project_id", Number(projectId))
    .single();

  const current: number[] = existing?.completed_steps ?? [];
  const isCurrentlyDone = current.includes(stepIndex);
  const updatedSteps = isCurrentlyDone
    ? current.filter((s) => s !== stepIndex)
    : [...current, stepIndex];

  const allDone = updatedSteps.length === totalSteps;
  const status = allDone
    ? "completed"
    : updatedSteps.length > 0
    ? "in_progress"
    : "not_started";

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: user.id,
        project_id: Number(projectId),
        depth,
        completed_steps: updatedSteps,
        status,
        started_at: updatedSteps.length > 0 ? now : null,
        completed_at: allDone ? now : null,
      },
      { onConflict: "user_id,project_id" }
    )
    .select("completed_steps, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update streak
  await upsertStreak(supabase, user.id);

  return NextResponse.json(updated);
}

async function upsertStreak(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { data: streak } = await supabase
    .from("user_streaks")
    .select("current_streak, longest_streak, last_active_date")
    .eq("user_id", userId)
    .single();

  const last = streak?.last_active_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = streak?.current_streak ?? 0;
  if (last === today) {
    return; // already counted today
  } else if (last === yesterday) {
    current += 1;
  } else {
    current = 1; // streak broken
  }

  const longest = Math.max(current, streak?.longest_streak ?? 0);

  await supabase.from("user_streaks").upsert(
    { user_id: userId, current_streak: current, longest_streak: longest, last_active_date: today },
    { onConflict: "user_id" }
  );
}
