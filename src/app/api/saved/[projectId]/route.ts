import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ saved: false });

  const { data } = await supabase
    .from("saved_projects")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("project_id", Number(projectId))
    .single();

  return NextResponse.json({ saved: !!data });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("saved_projects")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("project_id", Number(projectId))
    .single();

  if (existing) {
    await supabase
      .from("saved_projects")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", Number(projectId));
    return NextResponse.json({ saved: false });
  } else {
    await supabase
      .from("saved_projects")
      .insert({ user_id: user.id, project_id: Number(projectId) });
    return NextResponse.json({ saved: true });
  }
}
