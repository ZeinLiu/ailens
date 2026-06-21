import { execFile } from "child_process";
import { readdir, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { extractProject } from "@/lib/extract";
import { createSupabaseServer } from "@/lib/supabase/server";

const execFileAsync = promisify(execFile);

// Augment PATH so yt-dlp is found regardless of how Next.js was launched
const EXEC_ENV = {
  ...process.env,
  PATH: `${process.env.PATH}:/opt/homebrew/bin:/usr/local/bin`,
};

// YouTube only — Bilibili moved to Playwright path
function isVideoUrl(url: string): boolean {
  return /youtube\.com\/watch|youtu\.be\//.test(url);
}

// Chinese platforms that require a logged-in browser session
function isPlaywrightUrl(url: string): boolean {
  return /bilibili\.com|douyin\.com|xiaohongshu\.com|xhslink\.com/.test(url);
}

function cleanVtt(raw: string): string {
  return raw
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("WEBVTT") &&
        !line.match(/^\d{2}:\d{2}:\d{2}/) &&
        !line.match(/^\d+$/) &&
        !line.startsWith("NOTE") &&
        !line.startsWith("Kind:") &&
        !line.startsWith("Language:")
    )
    .map((line) => line.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchVideoTranscript(url: string): Promise<string> {
  const id = `ytdlp-${Date.now()}`;
  const outTemplate = path.join(tmpdir(), id);

  // Get metadata first (title + description)
  const { stdout: infoJson } = await execFileAsync(
    "yt-dlp",
    ["--dump-single-json", "--no-playlist", url],
    { timeout: 30000, env: EXEC_ENV }
  );
  const info = JSON.parse(infoJson);
  const title = (info.title ?? "") as string;
  const description = ((info.description ?? "") as string).slice(0, 3000);

  // Download auto-generated subtitles
  try {
    await execFileAsync(
      "yt-dlp",
      [
        "--write-auto-sub",
        "--sub-langs", "en,zh,zh-Hans,zh-Hant",
        "--skip-download",
        "--sub-format", "vtt",
        "--no-playlist",
        "-o", outTemplate,
        url,
      ],
      { timeout: 60000, env: EXEC_ENV }
    );
  } catch {
    // No subtitles available — fall back to description only
    return `Title: ${title}\n\nDescription:\n${description}`;
  }

  // Find the downloaded .vtt file
  const tmpFiles = await readdir(tmpdir());
  const subFile = tmpFiles.find((f) => f.startsWith(id) && f.endsWith(".vtt"));
  if (!subFile) {
    return `Title: ${title}\n\nDescription:\n${description}`;
  }

  const raw = await readFile(path.join(tmpdir(), subFile), "utf-8");
  const transcript = cleanVtt(raw).slice(0, 15000);
  await unlink(path.join(tmpdir(), subFile)).catch(() => {});

  return `Title: ${title}\n\nDescription:\n${description}\n\nTranscript:\n${transcript}`;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { url?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url: rawUrl, content: manualContent } = body;
  if (!rawUrl || typeof rawUrl !== "string") {
    return Response.json({ error: "url required" }, { status: 400 });
  }
  // Handle share strings like "【Title】 https://..." pasted from mobile apps
  const urlMatch = rawUrl.match(/https?:\/\/\S+/);
  const url = urlMatch ? urlMatch[0] : rawUrl;

  // Content strategy: manual paste > playwright queue > yt-dlp video > plain fetch
  let pageContent: string;
  if (manualContent?.trim()) {
    pageContent = manualContent.trim();
  } else if (isPlaywrightUrl(url)) {
    // Queue for Mac worker — return immediately, no Claude call
    const { data, error } = await supabase
      .from("raw_items")
      .insert({
        url,
        html: null,
        extracted_json: null,
        status: "pending_playwright",
        confidence: null,
        submitted_by: user.id,
      })
      .select("id")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ id: data.id, status: "pending_playwright" });
  } else if (isVideoUrl(url)) {
    try {
      pageContent = await fetchVideoTranscript(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // yt-dlp not installed or blocked — prompt admin to paste manually
      if (msg.includes("ENOENT") || msg.includes("not found")) {
        return Response.json(
          { error: "yt-dlp not available on this server. Paste the transcript in the content field instead." },
          { status: 422 }
        );
      }
      return Response.json({ error: `Video extraction failed: ${msg}` }, { status: 422 });
    }
  } else {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 AILens/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      pageContent = await res.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return Response.json({ error: `Failed to fetch URL: ${msg}` }, { status: 422 });
    }
  }

  // Extract with Claude
  let extracted;
  try {
    extracted = await extractProject(url, pageContent);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Extraction failed: ${msg}` }, { status: 500 });
  }

  // Save to raw_items
  const { data, error } = await supabase
    .from("raw_items")
    .insert({
      url,
      html: pageContent.slice(0, 50000),
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
