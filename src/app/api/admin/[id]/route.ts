import type { NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json() as { action: "approve" | "reject" };

  if (action === "reject") {
    const { error } = await supabase
      .from("raw_items")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (action === "approve") {
    const { data: item, error: fetchErr } = await supabase
      .from("raw_items")
      .select("extracted_json")
      .eq("id", id)
      .single();

    if (fetchErr || !item) {
      return Response.json({ error: "Item not found" }, { status: 404 });
    }

    // Compute next num (10, 11, 12…)
    const { count } = await supabase
      .from("pipeline_projects")
      .select("id", { count: "exact", head: true });

    const nextNum = 10 + (count ?? 0);
    const projectData: Project = {
      ...(item.extracted_json as Omit<Project, "id" | "num">),
      id: nextNum,
      num: String(nextNum),
    };

    const { error: insertErr } = await supabase.from("pipeline_projects").insert({
      num: String(nextNum),
      data: projectData,
      raw_item_id: id,
    });
    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });

    await supabase.from("raw_items").update({ status: "approved" }).eq("id", id);

    return Response.json({ ok: true, num: nextNum });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
