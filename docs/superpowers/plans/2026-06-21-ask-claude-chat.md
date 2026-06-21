# "Stuck? Ask Claude" Inline Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-step inline streaming chat (powered by Claude) inside each step's accordion on the project detail page, replacing the non-functional static "Ask Claude" button.

**Architecture:** A new POST route `/api/ask` accepts step context + conversation history, builds a step-scoped system prompt, and streams raw text deltas back via Web Streams API. The project page adds three state vars and renders a chat UI (message bubbles + textarea + send button) inside each open step's accordion, accumulating deltas with `getReader()`.

**Tech Stack:** `@anthropic-ai/sdk` (TypeScript), Next.js 16 App Router route handlers, Web Streams API, React state hooks.

## Global Constraints

- Next.js version: 16.2.9 — read `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` before touching the route file; route handlers use the Web `Request`/`Response` APIs
- Model: `claude-opus-4-8` exactly — no other model
- Streaming: `new ReadableStream` + `new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })` — not SSE, not JSON
- Auth: gate `/api/ask` with Supabase auth — return 401 if no user (same pattern as `/api/tracker/route.ts`)
- No test framework in this project — verification is `npm run build` (type check) + manual dev server test
- Client file is `"use client"` — all additions stay within that constraint; no server imports
- YAGNI: no markdown rendering, no message persistence, no session ID, no token counting

---

## Task 1: Install SDK, add env var, create streaming API route

**Files:**
- Install: `@anthropic-ai/sdk` (npm dependency)
- Env: `.env.local` — add `ANTHROPIC_API_KEY`
- Create: `src/app/api/ask/route.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `POST /api/ask` — request body `{ projectTitle: string, stepIndex: number, stepTitle: string, depth: string, tools: string, messages: Array<{role: "user"|"assistant", content: string}> }` → streaming `text/plain` response of raw text deltas

- [ ] **Step 1: Install `@anthropic-ai/sdk`**

```bash
cd /Users/lz/Documents/GitHub/ailens && npm install @anthropic-ai/sdk
```

Expected: package added to `dependencies` in `package.json`, `node_modules/@anthropic-ai/sdk` exists.

- [ ] **Step 2: Add `ANTHROPIC_API_KEY` to `.env.local`**

Append to `/Users/lz/Documents/GitHub/ailens/.env.local`:
```
ANTHROPIC_API_KEY=<paste your key here>
```

The user must fill in an actual API key. Do not proceed to manual testing without it.

- [ ] **Step 3: Create `src/app/api/ask/route.ts`**

Create the file with this exact content:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { projectTitle, stepIndex, stepTitle, depth, tools, messages } =
    await request.json();

  const system = `The user is working on: ${projectTitle}.
They are on Step ${stepIndex + 1}: ${stepTitle}.
Their depth level: ${depth}.
Tools in use: ${tools}.
Help them with this specific step only.
If they describe an error, ask them to paste it.
Keep answers short. Do not jump ahead to future steps.`;

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 1024,
          stream: true,
          system,
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/lz/Documents/GitHub/ailens && npm run build
```

Expected: build completes without TypeScript errors. Ignore prerender output — only watch for type errors.

- [ ] **Step 5: Smoke-test with curl (requires dev server running and valid API key)**

In a separate terminal, start the dev server:
```bash
npm run dev
```

Then in another terminal:
```bash
curl -s -N -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"projectTitle":"Test","stepIndex":0,"stepTitle":"Hello","depth":"beginner","tools":"Cursor","messages":[{"role":"user","content":"What does this step do?"}]}' \
  --cookie "$(cat /tmp/ailens-cookie.txt 2>/dev/null || echo '')"
```

Note: the `/api/ask` route requires auth — you'll get a 401 without a valid session cookie. Test by navigating to a project in the browser first, then using the browser's dev tools Network tab instead. The curl test verifies the route exists; the real E2E test happens in Task 2.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ask/route.ts package.json package-lock.json
git commit -m "feat: add /api/ask streaming route (claude-opus-4-8)"
```

---

## Task 2: Per-step chat UI on project detail page

**Files:**
- Modify: `src/app/project/[id]/page.tsx`
  - Lines 1-3: add no new imports (useState already imported)
  - Lines 17-24: add 3 new state vars after existing state
  - Lines 66-72: add `askClaude` callback after `copyPrompt`
  - Lines 328-335: add chat UI block inside `{isOpen && ...}`, after the "Mark done" row
  - Lines 343-353: delete the global static "Ask Claude" block

**Interfaces:**
- Consumes: `POST /api/ask` from Task 1 — streams `text/plain` deltas
- Produces: nothing downstream

- [ ] **Step 1: Add three state vars**

In `src/app/project/[id]/page.tsx`, after line 24 (`const [saved, setSaved] = useState(false);`), add:

```typescript
  const [chatHistories, setChatHistories] = useState<Record<number, Array<{role: "user" | "assistant", content: string}>>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState<number | null>(null);
```

- [ ] **Step 2: Add `askClaude` callback**

In `src/app/project/[id]/page.tsx`, after the `copyPrompt` function (after line 72), add:

```typescript
  const askClaude = useCallback(async (i: number) => {
    if (!chatInput.trim() || chatLoading !== null) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const step = steps[i];
    const prevHistory = chatHistories[i] ?? [];
    const newHistory: Array<{role: "user" | "assistant", content: string}> = [
      ...prevHistory,
      { role: "user", content: userMsg },
    ];
    setChatHistories(prev => ({ ...prev, [i]: newHistory }));
    setChatLoading(i);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: project.title,
          stepIndex: i,
          stepTitle: step.title,
          depth,
          tools: step.meta.tool,
          messages: newHistory,
        }),
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setChatHistories(prev => ({
        ...prev,
        [i]: [...(prev[i] ?? []), { role: "assistant" as const, content: "" }],
      }));
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setChatHistories(prev => {
          const hist = [...(prev[i] ?? [])];
          hist[hist.length - 1] = { role: "assistant" as const, content: assistantText };
          return { ...prev, [i]: hist };
        });
      }
    } finally {
      setChatLoading(null);
    }
  }, [chatInput, chatLoading, chatHistories, steps, project, depth]);
```

- [ ] **Step 3: Add chat UI inside each step's open block**

In `src/app/project/[id]/page.tsx`, find the "Time + Mark done" closing `</div>` (after line 334, the `</div>` that closes the `<div className="flex items-center justify-between pt-1">`). After that closing div and before the closing `</div>` of the `{isOpen && ...}` block (line 336), insert:

```tsx
                      {/* Chat */}
                      <div className="pt-3 space-y-3 border-t border-[var(--border)]">
                        {(chatHistories[i] ?? []).map((msg, mi) => (
                          <div key={mi} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                              msg.role === "user"
                                ? "bg-[var(--purple)] text-white"
                                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                            }`}>
                              {msg.content || (chatLoading === i ? "…" : "")}
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 items-end">
                          <textarea
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askClaude(i); } }}
                            placeholder="Paste an error or describe where you're stuck…"
                            rows={2}
                            disabled={chatLoading !== null}
                            className="flex-1 resize-none font-mono text-[12px] border border-[var(--border)] rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[var(--purple)] disabled:opacity-50"
                          />
                          <button
                            onClick={() => askClaude(i)}
                            disabled={chatLoading !== null || !chatInput.trim()}
                            className="px-3 py-2 bg-[var(--purple)] text-white text-[12px] font-medium rounded-md hover:bg-[#4a40c4] disabled:opacity-50 shrink-0"
                          >
                            {chatLoading === i ? "…" : "Ask"}
                          </button>
                        </div>
                      </div>
```

- [ ] **Step 4: Remove the global static "Ask Claude" block**

In `src/app/project/[id]/page.tsx`, delete lines 343–353 (the entire `{/* Ask Claude */}` block):

```tsx
          {/* Ask Claude */}
          <div className="mt-7 border border-[#ccc8f8] rounded-lg px-5 py-4 bg-[var(--purple-bg)]">
            <button className="w-full flex items-center justify-center gap-2 bg-[var(--purple)] text-white rounded-md py-2.5 text-sm font-medium hover:bg-[#4a40c4] mb-2.5">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="9" rx="2" stroke="white" strokeWidth="1.4"/>
                <path d="M5 13l1.5-2h3L11 13" stroke="white" strokeWidth="1.4"/>
              </svg>
              Stuck? Ask Claude
            </button>
            <p className="text-[13px] text-[#6b60c0] leading-relaxed">Paste an error or describe where you&apos;re blocked — get an answer scoped to this step.</p>
          </div>
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/lz/Documents/GitHub/ailens && npm run build
```

Expected: no TypeScript errors. Watch for: missing `useCallback` deps, type mismatches on `role`, unresolved `chatHistories[i]`.

- [ ] **Step 6: Manual E2E test in dev server**

Start `npm run dev`, open a project page, expand a step, and:
1. Type a question (e.g. "I'm getting a 404 error, what should I check?") and press Enter or click Ask.
2. Verify the user message appears immediately in a purple bubble.
3. Verify an assistant reply streams in character-by-character (or chunk-by-chunk).
4. Send a follow-up to confirm multi-turn history is threaded.
5. Confirm the global purple "Ask Claude" section at the bottom of the Build tab is gone.
6. Confirm that opening a different step shows its own empty chat history.
7. Try submitting while a response is streaming — button should be disabled.

If you get a 401, you are not logged in. Sign in via the auth flow first.

- [ ] **Step 7: Commit**

```bash
git add src/app/project/[id]/page.tsx
git commit -m "feat: per-step inline streaming chat (Phase 3)"
```
