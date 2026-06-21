import Anthropic from "@anthropic-ai/sdk";
import type { Project } from "./types";

export type ExtractedProject = Omit<Project, "id" | "num"> & {
  confidence: number;
  skip_reason: string | null;
};

const SYSTEM = `You are a structured data extractor for AILens — an index of buildable AI projects.

Given content from a URL, extract a project entry as strict JSON.

TITLE RULE: Outcome-first. State what it does for the user, not the technique.
  Bad: "RAG pipeline with LangChain"
  Good: "Ask questions across your files and get cited answers instantly"

DIFFICULTY:
  Beginner — no prior AI knowledge, copy-paste code, ~1-3 hours
  Intermediate — comfortable with Python/JS, 1-2 AI projects done, ~3-5 hours
  Advanced — builds production systems, ~5+ hours

CATEGORIES (pick all that apply): RAG | Agents | Chatbots | Fine-tuning | Vision | Speech | Automation

STEPS (beginner depth only, 3-8 steps):
Each step must include:
  title: string (imperative, e.g. "Create the ingestion script")
  sub: string (one sentence describing what happens)
  meta: { location: string (e.g. "project root"), tool: string (e.g. "Cursor"), userInputs?: string[] }
  body: string (2-4 sentences plain English explanation)
  prompt: { context: string (background for AI), instruction: string (what to ask), tool?: string }
  verify: { run: string (command or action to verify), expect: string (what success looks like), type: "terminal" | "browser" | "file" | "manual" }
  time: string (e.g. "~20 min")
  confidence: number (0.0-1.0 for this specific step)

CONFIDENCE (overall):
  1.0 = has working code, repo link, or live demo
  0.8 = has implementation details and named specific tools
  0.6 = has concept + some specifics but gaps in implementation
  <0.6 = too vague to build reliably

Set skip_reason if confidence < 0.6 (explain what is missing). Otherwise set skip_reason to null.`;

const buildPrompt = (url: string, html: string) =>
  `URL: ${url}

CONTENT (first 12000 chars of page HTML/text):
${html.slice(0, 12000)}

Return ONLY valid JSON — no markdown fences, no explanation — matching this exact shape:
{
  "title": "string",
  "tagline": "string (tweet-length, outcome-first, no marketing fluff)",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "categories": ["RAG" | "Agents" | "Chatbots" | "Fine-tuning" | "Vision" | "Speech" | "Automation"],
  "tools": ["string"],
  "timeEstimate": "string (e.g. ~3h)",
  "stepCount": number,
  "isLocal": boolean,
  "source": { "author": "string", "platform": "string", "url": "string" },
  "depthDesc": {
    "beginner": "string",
    "intermediate": "string",
    "advanced": "string"
  },
  "overview": "string (3-4 sentences, plain English, no marketing)",
  "realWorldUses": [{ "scenario": "string", "desc": "string" }],
  "painPoints": ["string"],
  "whoBenefits": [{ "role": "string", "gain": "string" }],
  "envSetup": {
    "prerequisites": ["string"],
    "tools": [{ "name": "string", "installCmd": "string", "purpose": "string" }],
    "apiKeys": [{ "name": "string", "where": "string", "envVar": "string" }],
    "projectStructure": "string (brief description of folder layout)"
  },
  "steps": {
    "beginner": [
      {
        "title": "string",
        "sub": "string",
        "meta": { "location": "string", "tool": "string", "userInputs": [] },
        "body": "string",
        "prompt": { "context": "string", "instruction": "string", "tool": "string" },
        "verify": { "run": "string", "expect": "string", "type": "terminal" | "browser" | "file" | "manual" },
        "time": "string",
        "confidence": number
      }
    ],
    "intermediate": [],
    "advanced": []
  },
  "confidence": number,
  "skip_reason": string | null
}`;

export async function extractProject(url: string, html: string): Promise<ExtractedProject> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8096,
    system: SYSTEM,
    messages: [{ role: "user", content: buildPrompt(url, html) }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude returned no JSON");

  return JSON.parse(match[0]) as ExtractedProject;
}
