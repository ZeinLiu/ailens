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

    // Check if already approved (handles status-update-failed-then-retry case)
    const { data: existing } = await supabase
      .from("pipeline_projects")
      .select("num")
      .eq("raw_item_id", id)
      .maybeSingle();

    if (existing) {
      // Already inserted — just ensure status is marked approved
      await supabase.from("raw_items").update({ status: "approved" }).eq("id", id);
      return Response.json({ ok: true, num: parseInt(existing.num) });
    }

    // Compute next num atomically-ish: use max rather than count to handle gaps
    const { data: maxRow } = await supabase
      .from("pipeline_projects")
      .select("num")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNum = maxRow ? parseInt(maxRow.num) + 1 : 10;
    const projectData = {
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

    // Update status — if this fails, admin retry will hit the "already approved" path above
    const { error: statusErr } = await supabase
      .from("raw_items")
      .update({ status: "approved" })
      .eq("id", id);
    if (statusErr) {
      console.error("Status update failed after insert:", statusErr.message);
      // Return success — project is published, admin retry will fix the status
      return Response.json({ ok: true, num: nextNum, warning: "status_update_failed" });
    }

    return Response.json({ ok: true, num: nextNum });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
