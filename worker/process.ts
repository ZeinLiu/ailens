import { SupabaseClient } from "@supabase/supabase-js";
import { scrape } from "./scrape";
import { extractProject } from "./extract";

export async function processItem(
  supabase: SupabaseClient,
  item: { id: string; url: string }
) {
  console.log(`[${new Date().toISOString()}] Processing: ${item.url}`);

  try {
    const content = await scrape(item.url);
    const extracted = await extractProject(item.url, content);

    await supabase
      .from("raw_items")
      .update({
        html: content.slice(0, 50000),
        extracted_json: extracted,
        confidence: extracted.confidence,
        status: "pending_review",
      })
      .eq("id", item.id);

    console.log(
      `✓ "${extracted.title}" — confidence: ${extracted.confidence.toFixed(2)}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ Failed: ${item.url} — ${msg}`);
    await supabase
      .from("raw_items")
      .update({ status: "extraction_failed" })
      .eq("id", item.id);
  }
}
