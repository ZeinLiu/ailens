# Step Schema Redesign

**Date:** 2026-06-20
**Scope:** `src/lib/data.ts` (types + all 9 projects' step content), `src/app/project/[id]/page.tsx` (UI)

---

## Problem

The current build step schema presents raw code blocks and brief explanations. It does not tell users where to put files, what they need to provide, which tool to use, or whether their step succeeded. The approach assumes users will manually write or paste code — which is out of step with how AI-assisted development actually works in 2026.

---

## Goals

1. Replace code blocks with ready-to-paste Claude Code prompts
2. Make every step explicit about location, tool, and user inputs
3. Add a mandatory verification block so users know when a step succeeded
4. Add a dedicated collapsible Step 0 (environment setup) above the accordion
5. Keep the schema open-ended — no fixed enums for tools or verification types, because new AI tools, skills, and capabilities will emerge

---

## Schema

### `EnvSetup` — Step 0 (new type on `Project`)

```typescript
export interface EnvSetup {
  prerequisites: string[];
  // e.g. ["Python 3.10+", "pip", "A code editor (VS Code, Cursor, etc.)"]

  tools: {
    name: string;
    installCmd: string;
    purpose: string;
  }[];
  // e.g. { name: "langchain", installCmd: "pip install langchain-community", purpose: "Orchestrates the RAG pipeline" }

  apiKeys: {
    name: string;       // e.g. "OPENAI_API_KEY"
    where: string;      // e.g. "platform.openai.com → API Keys"
    envVar: string;     // e.g. "export OPENAI_API_KEY=sk-..."
  }[];

  projectStructure: string;
  // Plain-text file tree of everything that will be created across all steps
  // e.g. "docs/\n├── ingest.py\n└── query.py\n.env"
}
```

### `StepMeta` — structured fields shown as labeled rows

```typescript
export interface StepMeta {
  location: string;
  // Where this step's output lives. Examples:
  // "src/lib/ingest.py" · "Terminal" · "n8n canvas" · ".env"

  tool: string;
  // Free string — not a fixed enum. Examples:
  // "Claude Code" · "Cursor" · "n8n" · "Replit" · "Terminal" · anything new

  userInputs?: string[];
  // What the user must supply before running this step. Examples:
  // ["Path to your PDF file", "OPENAI_API_KEY from platform.openai.com"]
}
```

### `StepPrompt` — the Claude Code action block

```typescript
export interface StepPrompt {
  context: string;
  // One sentence describing what already exists that the tool should know.
  // Shown in muted text above the instruction.
  // e.g. "ingest.py does not exist yet. The project root has a docs/ folder."

  instruction: string;
  // The ready-to-paste prompt text the user copies into Claude Code or their chosen tool.
  // Should be self-contained: tool doesn't need to ask follow-up questions to execute it.

  tool?: string;
  // Optional override if the prompt targets a different tool than StepMeta.tool.
}
```

### `StepVerify` — verification block before Mark done

```typescript
export interface StepVerify {
  run: string;
  // What the user does to verify. Examples:
  // "Run: python ingest.py" · "Open http://localhost:3000" · "Check n8n execution log"

  expect: string;
  // What success looks like — shown as a comparable output block.
  // For terminal: expected stdout. For browser: expected response/UI state.
  // For file: expected content snippet. User compares their result against this.

  type: string;
  // Free string — determines rendering style. Examples:
  // "terminal-output" · "browser" · "file-exists" · "ui-state" · anything new
}
```

### `Step` — complete revised type

```typescript
export interface Step {
  title: string;         // action-oriented: "Ingest your PDF"
  sub: string;           // one-line summary shown in collapsed state
  meta: StepMeta;        // location + tool + user inputs (structured rows)
  body: string;          // human explanation: what + why + any warnings as final sentence
  prompt: StepPrompt;    // Claude Code action block
  verify: StepVerify;    // verification block, required on every step
  time: string;          // e.g. "~20 min"
  confidence?: number;   // pipeline field: 0.0–1.0, set by Claude enrichment
}
```

### Removed fields

| Old field | Replacement |
|---|---|
| `code` | `prompt.instruction` — the LLM generates the code |
| `why` | Folded into `body` prose |
| `watchOut` | Final sentence of `body` when relevant |

### `Project` changes

```typescript
export interface Project {
  // ... all existing fields unchanged ...
  envSetup: EnvSetup;             // new — Step 0 section
  steps: Record<Depth, Step[]>;   // same key, new Step shape
}
```

---

## UI Layout

### Step 0 — Environment Setup

Positioned above the step accordion. Collapsed by default (experienced users skip it). Clicking the header row expands/collapses. Not counted in step progress.

```
┌─ ENVIRONMENT SETUP ──────────────────────────── ∨ ┐  ← collapsed by default
└─────────────────────────────────────────────────────┘

Expanded:

┌─ ENVIRONMENT SETUP ──────────────────────────── ∧ ┐
│                                                     │
│  Prerequisites    Python 3.10+  ·  pip              │
│                                                     │
│  Tools            langchain  chromadb  pypdf        │  ← install cmd shown on tap/hover
│                                                     │
│  API Keys         OPENAI_API_KEY  →  platform...    │  ← links to where to get them
│                                                     │
│  Project          docs/                             │
│  Structure        ├── ingest.py                     │
│                   └── query.py                      │
│                   .env                              │
└─────────────────────────────────────────────────────┘
```

### Build Step — expanded state

```
┌─ 01  Ingest your PDF ─────────────────────────── ∧ ┐
│      Load and split the document into chunks          │
│                                                       │
│  📁 src/lib/ingest.py          🛠 Claude Code         │  ← meta row
│  🔑 Needs: path to PDF · OPENAI_API_KEY               │
│                                                       │
│  [body — clear explanation of what this step does,    │
│   why it matters, and any warning as last sentence]   │
│                                                       │
│  ┌─ Run in Claude Code ─────────────────────── copy ┐ │
│  │ Context: ingest.py does not exist yet.           │ │  ← purple-tinted
│  │ The project root contains a docs/ folder.        │ │
│  │                                                  │ │
│  │ Create src/lib/ingest.py that...                 │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  ✓ Verify ────────────────────────────────────────    │  ← green label
│  Run: python ingest.py                                │
│  ┌──────────────────────────────────────────────── ┐  │
│  │ Ingesting doc.pdf...                            │  │  ← green-tinted output block
│  │ Split into 42 chunks                            │  │
│  │ Stored in ./chroma_db ✓                         │  │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  ~20 min                            Mark done →       │
└───────────────────────────────────────────────────────┘
```

### Visual treatment

| Block | Background | Border | Label |
|---|---|---|---|
| Prompt block | `--purple-bg` (#f0effe) | `#ccc8f8` | "Run in Claude Code" (or tool name) |
| Verify block | `#edf7f2` (green-light) | `#c2e8d2` | "✓ Verify" in `--green` |
| Meta row | none | none | icon + plain text inline |

---

## Content Rules

### `envSetup` — what belongs here

- Every tool the user must install before step 1
- Every API key or credential needed across all steps (not per-step — here once)
- The full project file structure that will exist after all steps complete
- Minimum runtime versions (Python, Node.js etc.)

### `body` — writing rules

- State what this step produces in the first sentence
- Explain the key decision or architectural choice in the second sentence
- Any warning or common failure mode goes as the final sentence
- No jargon without a brief definition on first use
- No "the code below does X" — the prompt block handles code

### `prompt.instruction` — writing rules

- Self-contained: the tool must be able to execute without asking follow-up questions
- Include file paths explicitly
- Reference what already exists ("the ingest.py created in step 1 already handles...")
- State the output explicitly ("the result should be a FastAPI app at src/api/main.py")
- For Claude Code: write as a direct instruction, not a question

### `verify.expect` — writing rules

- For `terminal-output`: show the exact stdout the user should see (or a representative excerpt)
- For `browser`: show the URL + expected status/response body
- For `file-exists`: show the file path + a key line or two of expected content
- For `ui-state`: describe what appears on screen
- Keep it short — 3–5 lines maximum. The user is comparing, not reading.
- At **Advanced depth**, `verify` may be a single-line check (e.g. `run: "pytest tests/"`, `expect: "All tests pass"`) — Advanced users don't need expected output spoon-fed, just the right command to confirm.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/data.ts` | Add `EnvSetup`, `StepMeta`, `StepPrompt`, `StepVerify` types. Revise `Step` and `Project` interfaces. Rewrite all 9 projects' `envSetup` + `steps` content at all 3 depth levels. |
| `src/app/project/[id]/page.tsx` | Add collapsible Step 0 section above accordion. Update step accordion to render `meta` row, `prompt` block (purple), `verify` block (green). Remove old `code`/`why`/`watchOut` rendering. |

---

## Out of Scope

- Changes to the Index page or Tracker page
- Auth or database persistence (separate phase)
- The "Stuck? Ask Claude" feature (separate phase)
- Adding new projects beyond the existing 9
