import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import { processItem } from "./process";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RawItem = { id: string; url: string };

async function drainQueue() {
  const { data } = await supabase
    .from("raw_items")
    .select("id, url")
    .eq("status", "pending_playwright");

  const items = data ?? [];
  if (items.length > 0) {
    console.log(`Draining ${items.length} queued item(s)…`);
    for (const item of items) {
      await processItem(supabase, item as RawItem);
    }
  }
}

supabase
  .channel("playwright-queue")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "raw_items",
      filter: "status=eq.pending_playwright",
    },
    async (payload) => {
      const item = payload.new as RawItem;
      await processItem(supabase, item);
    }
  )
  .subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log("Worker ready — watching for pending_playwright items");
    }
  });

drainQueue();
