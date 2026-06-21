"use client";
import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type RawItem = {
  id: string;
  url: string;
  status: string;
  confidence: number;
  created_at: string;
  extracted_json: {
    title?: string;
    tagline?: string;
    difficulty?: string;
    tools?: string[];
    skip_reason?: string | null;
  } | null;
};

const confColor = (c: number) =>
  c >= 0.8 ? "text-green-700" : c >= 0.6 ? "text-amber-700" : "text-red-700";

const statusBadge = (s: string) =>
  s === "approved"
    ? "bg-green-100 text-green-700"
    : s === "rejected"
    ? "bg-red-100 text-red-700"
    : "bg-amber-100 text-amber-700";

export default function AdminPage() {
  const [items, setItems] = useState<RawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabaseBrowser
      .from("raw_items")
      .select("id, url, status, confidence, created_at, extracted_json")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ingest = async () => {
    if (!url.trim() || ingesting) return;
    setIngesting(true);
    setIngestMsg(null);
    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setIngestMsg(`✓ "${data.title}" — confidence: ${data.confidence.toFixed(2)}`);
      setUrl("");
      load();
    } else {
      setIngestMsg(`✗ ${data.error}`);
    }
    setIngesting(false);
  };

  const act = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    await fetch(`/api/admin/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    load();
  };

  return (
    <div className="max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-bold mb-8">Review Queue</h1>

      {/* Submit */}
      <div className="border border-[var(--border)] rounded-lg p-5 mb-8 bg-white">
        <p className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
          Submit URL for extraction
        </p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ingest()}
            placeholder="https://simonwillison.net/..."
            className="flex-1 text-sm border border-[var(--border)] rounded-md px-3 py-2 focus:outline-none focus:border-[var(--blue)]"
          />
          <button
            onClick={ingest}
            disabled={ingesting || !url.trim()}
            className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-medium rounded-md hover:bg-[#333] disabled:opacity-50"
          >
            {ingesting ? "Extracting…" : "Extract"}
          </button>
        </div>
        {ingestMsg && (
          <p className="font-mono text-[12px] mt-2 text-[var(--muted-foreground)]">{ingestMsg}</p>
        )}
      </div>

      {/* Queue */}
      {loading ? (
        <p className="text-[var(--muted-foreground)] text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Queue is empty.</p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <div key={item.id} className="py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] mb-0.5">
                    {item.extracted_json?.title ?? "(untitled)"}
                  </p>
                  <p className="text-[13px] text-[var(--muted-foreground)] mb-2 leading-relaxed">
                    {item.extracted_json?.tagline}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className={`font-mono text-[12px] font-medium ${confColor(item.confidence ?? 0)}`}>
                      confidence: {(item.confidence ?? 0).toFixed(2)}
                    </span>
                    <span className="font-mono text-[12px] text-[var(--muted-foreground)]">
                      {item.extracted_json?.difficulty}
                    </span>
                    <span className="font-mono text-[12px] text-[var(--muted-foreground)]">
                      {item.extracted_json?.tools?.join(", ")}
                    </span>
                    <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${statusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.extracted_json?.skip_reason && (
                    <p className="font-mono text-[11px] text-red-600 mb-1">
                      ⚠ {item.extracted_json.skip_reason}
                    </p>
                  )}
                  <p className="font-mono text-[11px] text-[var(--muted-foreground)] truncate">
                    {item.url}
                  </p>
                </div>
                {item.status === "pending_review" && (
                  <div className="flex gap-2 shrink-0 pt-0.5">
                    <button
                      onClick={() => act(item.id, "approve")}
                      disabled={acting === item.id}
                      className="px-3 py-1.5 bg-[var(--green)] text-white text-[12px] font-medium rounded-md hover:opacity-90 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => act(item.id, "reject")}
                      disabled={acting === item.id}
                      className="px-3 py-1.5 border border-[var(--border)] text-[12px] font-medium rounded-md hover:bg-[var(--background)] disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
