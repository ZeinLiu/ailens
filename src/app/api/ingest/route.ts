import { createSupabaseServer } from "@/lib/supabase/server";
import { extractProject } from "@/lib/extract";

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return Response.json({ error: "url required" }, { status: 400 });
  }

  // Fetch page content
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 AILens/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    html = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Failed to fetch URL: ${msg}` }, { status: 422 });
  }

  // Extract with Claude
  let extracted;
  try {
    extracted = await extractProject(url, html);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Extraction failed: ${msg}` }, { status: 500 });
  }

  // Save to raw_items
  const { data, error } = await supabase
    .from("raw_items")
    .insert({
      url,
      html: html.slice(0, 50000),
      extracted_json: extracted,
      status: "pending_review",
      confidence: extracted.confidence,
      submitted_by: user.id,
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    id: data.id,
    title: extracted.title,
    confidence: extracted.confidence,
    status: "pending_review",
  });
}
