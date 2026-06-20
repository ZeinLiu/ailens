# Step Schema Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw code blocks in project build steps with LLM-prompt-driven steps, add explicit location/tool/input metadata, mandatory verification blocks, and a collapsible Step 0 environment setup section.

**Architecture:** Two-phase change. Phase 1: update TypeScript interfaces and the UI renderer. Phase 2: rewrite all 9 projects' content to the new schema. Phase 1 must compile and render (with one project as test) before Phase 2 begins.

**Tech Stack:** TypeScript, Next.js App Router, Tailwind CSS, React (client component)

## Global Constraints

- No new dependencies — use only what is already installed
- All tool/type fields are free strings — no TypeScript union types for them
- `verify` is required on every Step (not optional)
- `envSetup` is required on every Project (not optional)
- Step 0 is collapsed by default, not counted in progress
- Prompt block: `--purple-bg` (#f0effe), border `#ccc8f8`
- Verify block: `#edf7f2` background, border `#c2e8d2`, label `--green`
- Remove `code`, `why`, `watchOut` fields entirely — no backward compat shims
- Follow existing Tailwind + CSS variable patterns in the file

---

## File Map

| File | Change |
|---|---|
| `src/lib/data.ts` | New interfaces, updated Project type, full content rewrite |
| `src/app/project/[id]/page.tsx` | New EnvSetup section + updated step accordion renderer |

---

### Task 1: Update TypeScript interfaces in data.ts

**Files:**
- Modify: `src/lib/data.ts:1-40`

**Interfaces:**
- Produces: `EnvSetup`, `StepMeta`, `StepPrompt`, `StepVerify`, updated `Step`, updated `Project` — all consumed by Tasks 2–11

- [ ] **Step 1: Replace the Step interface and add new sub-interfaces**

Replace lines 5–13 of `src/lib/data.ts` (the old `Step` interface) with:

```typescript
export interface EnvSetup {
  prerequisites: string[];
  tools: { name: string; installCmd: string; purpose: string }[];
  apiKeys: { name: string; where: string; envVar: string }[];
  projectStructure: string;
}

export interface StepMeta {
  location: string;
  tool: string;
  userInputs?: string[];
}

export interface StepPrompt {
  context: string;
  instruction: string;
  tool?: string;
}

export interface StepVerify {
  run: string;
  expect: string;
  type: string;
}

export interface Step {
  title: string;
  sub: string;
  meta: StepMeta;
  body: string;
  prompt: StepPrompt;
  verify: StepVerify;
  time: string;
  confidence?: number;
}
```

- [ ] **Step 2: Add `envSetup` to the Project interface**

In the `Project` interface (currently lines 22–40), add `envSetup` after `source?`:

```typescript
export interface Project {
  id: number;
  num: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  categories: Category[];
  tools: string[];
  timeEstimate: string;
  stepCount: number;
  isLocal: boolean;
  source?: Source;
  envSetup: EnvSetup;
  depthDesc: Record<Depth, string>;
  overview: string;
  realWorldUses: { scenario: string; desc: string }[];
  painPoints: string[];
  whoBenefits: { role: string; gain: string }[];
  steps: Record<Depth, Step[]>;
}
```

- [ ] **Step 3: Verify TypeScript compiles (expected: type errors on all 9 projects)**

Run: `cd /Users/lz/Documents/GitHub/ailens && npx tsc --noEmit 2>&1 | head -30`

Expected: errors referencing missing `envSetup` and wrong `steps` shape on each project. This is correct — content rewrite comes in Tasks 3–11.

- [ ] **Step 4: Commit types-only change**

```bash
git add src/lib/data.ts
git commit -m "feat: add EnvSetup/StepMeta/StepPrompt/StepVerify types, update Step and Project interfaces"
```

---

### Task 2: Update the project detail page renderer

**Files:**
- Modify: `src/app/project/[id]/page.tsx`

**Interfaces:**
- Consumes: `EnvSetup`, `StepMeta`, `StepPrompt`, `StepVerify`, `Step` from Task 1
- Produces: updated UI components consumed by the browser

- [ ] **Step 1: Add EnvSetup state and section above the accordion**

In `src/app/project/[id]/page.tsx`, after the existing state declarations (line ~27), add:

```typescript
const [envOpen, setEnvOpen] = useState(false);
```

Then between the depth switcher block and the content tabs block, add the EnvSetup section:

```tsx
{/* Step 0 — Environment Setup */}
<div className="border border-[var(--border)] rounded-lg mb-7 overflow-hidden">
  <button
    onClick={() => setEnvOpen(v => !v)}
    className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-[var(--background)] transition-colors"
  >
    <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]">
      Environment Setup
    </span>
    <span className={`text-[var(--muted-foreground)] text-xs transition-transform ${envOpen ? "rotate-180" : ""}`}>∨</span>
  </button>

  {envOpen && (
    <div className="border-t border-[var(--border)] px-5 py-4 space-y-4 bg-white">
      {/* Prerequisites */}
      {project.envSetup.prerequisites.length > 0 && (
        <div className="flex gap-4">
          <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase w-28 shrink-0 pt-0.5">Prerequisites</span>
          <div className="flex flex-wrap gap-1.5">
            {project.envSetup.prerequisites.map(p => (
              <span key={p} className="font-mono text-xs px-2 py-0.5 border border-[var(--border)] rounded bg-[var(--background)]">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      {project.envSetup.tools.length > 0 && (
        <div className="flex gap-4">
          <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase w-28 shrink-0 pt-0.5">Install</span>
          <div className="space-y-1.5 flex-1">
            {project.envSetup.tools.map(t => (
              <div key={t.name} className="flex items-baseline gap-2">
                <code className="font-mono text-xs bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 rounded">{t.installCmd}</code>
                <span className="text-[12px] text-[var(--muted-foreground)]">{t.purpose}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Keys */}
      {project.envSetup.apiKeys.length > 0 && (
        <div className="flex gap-4">
          <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase w-28 shrink-0 pt-0.5">API Keys</span>
          <div className="space-y-1">
            {project.envSetup.apiKeys.map(k => (
              <div key={k.name} className="flex items-center gap-2 text-[12px]">
                <code className="font-mono text-xs text-[var(--blue)]">{k.envVar.split('=')[0]}</code>
                <span className="text-[var(--muted-foreground)]">—</span>
                <span className="text-[var(--muted-foreground)]">{k.where}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Structure */}
      {project.envSetup.projectStructure && (
        <div className="flex gap-4">
          <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase w-28 shrink-0 pt-0.5">Structure</span>
          <pre className="font-mono text-[12px] text-[var(--muted-foreground)] leading-relaxed whitespace-pre">{project.envSetup.projectStructure}</pre>
        </div>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 2: Update the step accordion to render new Step fields**

Replace the entire `{steps.map((step, i) => { ... })}` block (lines ~168–205) with:

```tsx
{steps.map((step, i) => {
  const isOpen = openSteps.has(i);
  const isDone = doneSteps.has(i);
  return (
    <div key={i}>
      {/* Collapsed header */}
      <button onClick={() => toggleStep(i)} className="w-full flex items-start justify-between gap-4 py-4.5 text-left group">
        <div className="flex gap-4 items-start">
          <span className="font-mono text-[13px] text-[var(--muted-foreground)] w-5 shrink-0 pt-0.5">{String(i+1).padStart(2,"0")}</span>
          <div>
            <p className={`text-[15px] font-semibold mb-0.5 transition-colors ${isDone ? "text-[var(--green)]" : "text-[var(--blue)] group-hover:text-blue-700"}`}>{step.title}</p>
            <p className="text-[13px] text-[var(--muted-foreground)]">{step.sub}</p>
          </div>
        </div>
        <span className={`text-[var(--muted-foreground)] shrink-0 pt-1 transition-transform ${isOpen ? "rotate-180" : ""}`}>∨</span>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="pb-5 pl-9 space-y-4">

          {/* Meta row — location · tool · user inputs */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[12px] text-[var(--muted-foreground)]">📁 <span className="text-[var(--foreground)]">{step.meta.location}</span></span>
              <span className="text-[var(--border)]">·</span>
              <span className="font-mono text-[12px] text-[var(--muted-foreground)]">🛠 <span className="text-[var(--foreground)]">{step.meta.tool}</span></span>
            </div>
            {step.meta.userInputs && step.meta.userInputs.length > 0 && (
              <p className="font-mono text-[12px] text-[var(--muted-foreground)]">
                🔑 Needs: {step.meta.userInputs.join(" · ")}
              </p>
            )}
          </div>

          {/* Body */}
          <p className="text-sm text-[#333] leading-relaxed">{step.body}</p>

          {/* Prompt block */}
          <div className="rounded-lg border border-[#ccc8f8] bg-[var(--purple-bg)] overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#ccc8f8]">
              <span className="font-mono text-[11px] text-[var(--purple)] uppercase tracking-wider">
                Run in {step.prompt.tool ?? step.meta.tool}
              </span>
              <button
                onClick={() => copyCode(step.prompt.context + "\n\n" + step.prompt.instruction, i)}
                className="font-mono text-[11px] text-[var(--purple)] hover:text-[#4a40c4]"
              >
                {copied === i ? "copied!" : "copy"}
              </button>
            </div>
            <div className="px-3.5 py-3 space-y-2">
              <p className="font-mono text-[12px] text-[#9b93dd] leading-relaxed italic">{step.prompt.context}</p>
              <p className="font-mono text-[13px] text-[#3d3580] leading-relaxed whitespace-pre-wrap">{step.prompt.instruction}</p>
            </div>
          </div>

          {/* Verify block */}
          <div className="rounded-lg border border-[#c2e8d2] bg-[#edf7f2] overflow-hidden">
            <div className="flex items-center px-3.5 py-2 border-b border-[#c2e8d2]">
              <span className="font-mono text-[11px] text-[var(--green)] uppercase tracking-wider">✓ Verify</span>
            </div>
            <div className="px-3.5 py-3 space-y-2">
              <p className="font-mono text-[12px] text-[var(--muted-foreground)]">Run: <span className="text-[var(--foreground)]">{step.verify.run}</span></p>
              <pre className="font-mono text-[12px] text-[#2d5a3d] leading-relaxed whitespace-pre-wrap bg-white border border-[#c2e8d2] rounded px-3 py-2">{step.verify.expect}</pre>
            </div>
          </div>

          {/* Time + Mark done */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-xs text-[var(--muted-foreground)]">{step.time}</span>
            <button onClick={() => toggleDone(i)}
              className={`font-mono text-xs ${isDone ? "text-[var(--green)]" : "text-[var(--blue)] hover:underline"}`}>
              {isDone ? "✓ Done" : "Mark done →"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
})}
```

- [ ] **Step 3: Update the copyCode call signature — prompt copies context + instruction**

The existing `copyCode` function signature `(code: string, i: number)` already works. No change needed — the prompt block already passes the right string in Step 2.

- [ ] **Step 4: Verify the page compiles and renders**

Run: `cd /Users/lz/Documents/GitHub/ailens && npm run dev`

Expected: dev server starts. Opening any project detail page will show TypeScript errors in the browser console (because project data still uses old Step shape) — that is expected. The UI structure itself should render without React errors.

- [ ] **Step 5: Commit UI changes**

```bash
git add "src/app/project/[id]/page.tsx"
git commit -m "feat: add EnvSetup section and update step accordion for new schema"
```

---

### Task 3: Project 01 content — "Ask questions across your files and get cited answers instantly"

**Files:**
- Modify: `src/lib/data.ts` — project id:1 only

**Interfaces:**
- Consumes: `EnvSetup`, `Step` from Task 1

This project is the canonical template. Get it right and working before moving to 02–09.

- [ ] **Step 1: Replace project 01's entire content block**

Find project id:1 in `src/lib/data.ts` (starts at line ~44). Replace its `depthDesc`, `steps` fields, and add `envSetup`. Keep all existing fields (id, num, title, tagline, difficulty, categories, tools, timeEstimate, stepCount, isLocal, source, overview, realWorldUses, painPoints, whoBenefits) unchanged.

Add after `source`:

```typescript
envSetup: {
  prerequisites: ["Python 3.10+", "pip", "An OpenAI account (free tier works)"],
  tools: [
    { name: "langchain-community", installCmd: "pip install langchain-community langchain-openai chromadb pypdf python-dotenv", purpose: "RAG pipeline, embeddings, vector store, PDF reader" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys → Create new secret key", envVar: "OPENAI_API_KEY=sk-..." },
  ],
  projectStructure: "my-rag-app/\n├── docs/          ← put your PDFs here\n├── ingest.py\n├── query.py\n├── .env\n└── .gitignore",
},
```

Replace `depthDesc`:

```typescript
depthDesc: {
  beginner: "You will have a working Q&A system that reads your PDFs and answers in plain English with citations. Every command is given to you — paste and run.",
  intermediate: "Focus on chunking strategy, retrieval tuning, and wrapping the chain as a reusable API. Prompts give you the pattern; you make the architectural decisions.",
  advanced: "Hybrid search, reranking, semantic chunking, cost modelling. Prompts are checkpoints — you drive the implementation.",
},
```

Replace `steps`:

```typescript
steps: {
  beginner: [
    {
      title: "Create your project folder",
      sub: "Set up the folder structure and install dependencies",
      meta: { location: "Terminal", tool: "Terminal", userInputs: ["Your OPENAI_API_KEY from platform.openai.com"] },
      body: "Creates the folder my-rag-app with a docs/ subfolder for your PDFs, a .env file for your API key, and a .gitignore that prevents the key from being committed. Run the install command — it takes about 30 seconds.",
      prompt: {
        context: "No project folder exists yet. I am in the directory where I want to create it.",
        instruction: "Create a folder called my-rag-app. Inside it create: an empty docs/ subfolder, a .env file containing the line OPENAI_API_KEY=paste-your-key-here, and a .gitignore containing .env and __pycache__/. Then run: pip install langchain-community langchain-openai chromadb pypdf python-dotenv\n\nShow me the exact terminal commands to run.",
      },
      verify: {
        run: "ls my-rag-app && python -c \"import langchain; print('OK')\"",
        expect: "docs/  .env  .gitignore\nOK",
        type: "terminal-output",
      },
      time: "~10 min",
    },
    {
      title: "Add a PDF to query",
      sub: "Copy any PDF into the docs/ folder",
      meta: { location: "my-rag-app/docs/", tool: "Finder / File Explorer", userInputs: ["Any PDF file — company policy, report, textbook chapter"] },
      body: "Copy one PDF into the docs/ folder. The name doesn't matter. Try a document you actually want to search — an employee handbook, a product manual, or research paper. The system will only answer from this document, so pick something with real content.",
      prompt: {
        context: "No code needed for this step.",
        instruction: "Copy a PDF file into my-rag-app/docs/. Confirm the file is there by running: ls my-rag-app/docs/",
      },
      verify: {
        run: "ls my-rag-app/docs/",
        expect: "your-document.pdf",
        type: "terminal-output",
      },
      time: "~2 min",
    },
    {
      title: "Create the ingestion script",
      sub: "Read the PDF, split it into chunks, store as vectors",
      meta: { location: "my-rag-app/ingest.py", tool: "Claude Code" },
      body: "This script reads every PDF in docs/, splits each page into overlapping 1000-character chunks (overlap prevents cutting mid-sentence), converts each chunk into a vector using OpenAI's embedding model, and saves everything to a local database called chroma_db. Run it once per document. It takes 5–15 seconds depending on PDF size.",
      prompt: {
        context: "my-rag-app/ exists with docs/ containing at least one PDF, a .env file with OPENAI_API_KEY set, and the langchain + chromadb packages installed.",
        instruction: "Create my-rag-app/ingest.py that does the following:\n1. Load OPENAI_API_KEY from .env using python-dotenv\n2. Load all PDFs from the docs/ folder using PyPDFDirectoryLoader\n3. Split documents into chunks of 1000 characters with 200-character overlap using RecursiveCharacterTextSplitter\n4. Create embeddings using OpenAIEmbeddings with model text-embedding-3-small\n5. Store embeddings in a Chroma vector store persisted at ./chroma_db\n6. Print: how many documents loaded, how many chunks created, and 'Stored in ./chroma_db ✓'",
      },
      verify: {
        run: "cd my-rag-app && python ingest.py",
        expect: "Loaded 1 document(s)\nSplit into 42 chunks\nStored in ./chroma_db ✓",
        type: "terminal-output",
      },
      time: "~20 min",
    },
    {
      title: "Create the query script",
      sub: "Connect the vector store to GPT and ask questions",
      meta: { location: "my-rag-app/query.py", tool: "Claude Code" },
      body: "Connects the Chroma vector store to GPT-4o-mini. When you ask a question it finds the 4 most relevant chunks and passes them to the LLM, which answers using only those chunks and tells you the source document. temperature=0 prevents the model from guessing.",
      prompt: {
        context: "my-rag-app/ingest.py exists and chroma_db/ has been created by running ingest.py. OPENAI_API_KEY is in .env.",
        instruction: "Create my-rag-app/query.py that does the following:\n1. Load OPENAI_API_KEY from .env using python-dotenv\n2. Load the existing Chroma vector store from ./chroma_db using OpenAIEmbeddings (text-embedding-3-small)\n3. Create a RetrievalQAWithSourcesChain using ChatOpenAI (model gpt-4o-mini, temperature 0) with the Chroma retriever set to k=4\n4. Accept a question as a command-line argument (sys.argv[1])\n5. Print the answer and the source document name",
      },
      verify: {
        run: "python query.py \"What is this document about?\"",
        expect: "Answer: This document covers...\nSources: docs/your-document.pdf",
        type: "terminal-output",
      },
      time: "~20 min",
    },
    {
      title: "Add the 'I don\\'t know' guardrail",
      sub: "Stop the model from making up answers",
      meta: { location: "my-rag-app/query.py", tool: "Claude Code" },
      body: "Without this, the LLM will answer from its training data when it can't find the answer in your documents — which defeats the purpose. This step adds a system instruction that forces it to say 'I don't have that information' instead of guessing.",
      prompt: {
        context: "my-rag-app/query.py exists and is returning answers. The chain does not yet have a custom system prompt.",
        instruction: "Update my-rag-app/query.py to add a custom prompt template to the RetrievalQAWithSourcesChain. The system message should say: 'Answer only from the provided context. If the answer is not found in the context, respond with: I don\\'t have that information in the provided documents. Do not use your training knowledge.'",
      },
      verify: {
        run: "python query.py \"What is the population of Mars?\"",
        expect: "Answer: I don't have that information in the provided documents.\nSources:",
        type: "terminal-output",
      },
      time: "~15 min",
    },
    {
      title: "Test with your real questions",
      sub: "Verify accuracy and citations before relying on it",
      meta: { location: "Terminal", tool: "Terminal" },
      body: "Run 5 questions you already know the answers to from reading the document. Check that each answer is correct and the citation points to the right file. If an answer is wrong or hallucinated, the chunk size (currently 1000) may be too large — try reducing to 500.",
      prompt: {
        context: "query.py is working with the guardrail in place.",
        instruction: "Run 5 different questions against your document using: python query.py \"your question here\"\n\nFor each answer, verify: (1) the answer is accurate, (2) the source is listed, (3) asking something NOT in the document returns the I don't have that information response.",
      },
      verify: {
        run: "python query.py \"[a question you know the answer to from your PDF]\"",
        expect: "Answer: [correct answer matching document content]\nSources: docs/your-document.pdf",
        type: "terminal-output",
      },
      time: "~15 min",
    },
  ],
  intermediate: [
    {
      title: "Set up with best-practice structure",
      sub: "Project layout, .env, requirements.txt",
      meta: { location: "Terminal", tool: "Terminal", userInputs: ["OPENAI_API_KEY"] },
      body: "Use a requirements.txt and virtual environment from the start. Keeps dependencies isolated and reproducible. The .env pattern via python-dotenv is the standard for local credentials.",
      prompt: {
        context: "No project exists yet.",
        instruction: "Create my-rag-app/ with: a venv, requirements.txt containing langchain-community langchain-openai chromadb pypdf python-dotenv fastapi uvicorn, a .env for OPENAI_API_KEY, and a .gitignore. Activate the venv and install requirements.",
      },
      verify: { run: "pip list | grep langchain", expect: "langchain-community  x.x.x\nlangchain-openai     x.x.x", type: "terminal-output" },
      time: "~10 min",
    },
    {
      title: "Build the ingestion pipeline with tunable chunking",
      sub: "Parameterise chunk_size and overlap for your document type",
      meta: { location: "my-rag-app/ingest.py", tool: "Claude Code" },
      body: "chunk_size=1000 is a starting heuristic. Dense technical docs benefit from smaller chunks (500); narrative text from larger (1500). Build in the parameter so you can tune without changing code. Semantic chunking is more accurate but adds latency — use character splitting for now.",
      prompt: {
        context: "my-rag-app/ exists with requirements installed and OPENAI_API_KEY in .env.",
        instruction: "Create ingest.py that accepts --chunk-size (default 1000) and --chunk-overlap (default 200) as CLI args. Use PyPDFDirectoryLoader, RecursiveCharacterTextSplitter with those params, OpenAIEmbeddings text-embedding-3-small, Chroma persisted at ./chroma_db. Print chunk count and avg chunk length on completion.",
      },
      verify: { run: "python ingest.py --chunk-size 500", expect: "Split into 84 chunks\nAvg chunk length: 487 chars\nStored in ./chroma_db ✓", type: "terminal-output" },
      time: "~20 min",
    },
    {
      title: "Wrap as a FastAPI endpoint",
      sub: "POST /query returns answer + sources as JSON",
      meta: { location: "my-rag-app/api.py", tool: "Claude Code" },
      body: "Makes the RAG chain composable — any frontend, Slack bot, or automation can call it. Use RetrievalQAWithSourcesChain, not plain RetrievalQA — the Sources variant returns document metadata for citations.",
      prompt: {
        context: "ingest.py exists and chroma_db/ is populated. requirements.txt includes fastapi and uvicorn.",
        instruction: "Create api.py with a FastAPI app. POST /query accepts { question: str }, loads the Chroma store and runs RetrievalQAWithSourcesChain (gpt-4o-mini, temperature 0, k=4), returns { answer: str, sources: list[str] }. Include the I-don't-know system prompt. Load .env on startup.",
      },
      verify: {
        run: "uvicorn api:app --reload & curl -s -X POST http://localhost:8000/query -H 'Content-Type: application/json' -d '{\"question\": \"What is this about?\"}'",
        expect: "{\"answer\": \"...\", \"sources\": [\"docs/your-document.pdf\"]}",
        type: "terminal-output",
      },
      time: "~25 min",
    },
    {
      title: "Evaluate retrieval quality",
      sub: "5-question eval set with recall check",
      meta: { location: "Terminal", tool: "Terminal" },
      body: "Write 5 questions with known answers. For each, check: correct answer, correct source, correct refusal for out-of-scope questions. Record pass/fail. This is your baseline before tuning chunk size or switching models.",
      prompt: {
        context: "api.py is running on localhost:8000.",
        instruction: "Create eval.py that sends 5 hardcoded questions to POST /query, compares each answer against an expected substring, and prints a pass/fail table with answer previews. Include one question whose answer is NOT in the document to verify the refusal.",
      },
      verify: { run: "python eval.py", expect: "Q1: PASS\nQ2: PASS\nQ3: PASS\nQ4: PASS\nQ5 (out-of-scope): PASS (refused)\n\n5/5 passed", type: "terminal-output" },
      time: "~20 min",
    },
  ],
  advanced: [
    {
      title: "Hybrid search: BM25 + vector with RRF fusion",
      sub: "Combine lexical and semantic retrieval",
      meta: { location: "my-rag-app/retriever.py", tool: "Claude Code" },
      body: "Pure cosine similarity misses exact-match cases (names, codes, IDs). BM25 handles these. Reciprocal Rank Fusion (RRF) merges both result lists without requiring score normalisation. Implement as a custom LangChain retriever.",
      prompt: {
        context: "Chroma store exists. rank_bm25 is available (pip install rank-bm25). The project has a FastAPI wrapper.",
        instruction: "Create retriever.py with a HybridRetriever class inheriting BaseRetriever. It should run both Chroma vector search (k=20) and BM25 over the same corpus in parallel, merge results with RRF (k=60), and return the top 5. Wire it into api.py replacing the default retriever.",
      },
      verify: { run: "python eval.py", expect: "All 5 tests pass (hybrid should match or exceed baseline)", type: "terminal-output" },
      time: "~45 min",
    },
    {
      title: "Add cross-encoder reranking",
      sub: "Rerank top-20 candidates to top-5",
      meta: { location: "my-rag-app/retriever.py", tool: "Claude Code" },
      body: "Cross-encoders jointly score (query, document) pairs — far more accurate than bi-encoder similarity but too slow to run on the full corpus. Apply on the top-20 hybrid results only. Use cross-encoder/ms-marco-MiniLM-L-6-v2 (fast, good quality).",
      prompt: {
        context: "retriever.py has HybridRetriever returning top-20. sentence-transformers is installed.",
        instruction: "Add a reranking step to HybridRetriever: after getting the top-20 hybrid results, score each (query, doc) pair with CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2'), sort descending, return top-5. Measure and print p95 latency.",
      },
      verify: { run: "python -c \"from retriever import HybridRetriever; import time; r=HybridRetriever(); t=time.time(); r.get_relevant_documents('test query'); print(f'{(time.time()-t)*1000:.0f}ms')\"", expect: "< 300ms", type: "terminal-output" },
      time: "~30 min",
    },
    {
      title: "Cost and latency modelling",
      sub: "Understand production economics before scaling",
      meta: { location: "Terminal / spreadsheet", tool: "Terminal" },
      body: "Embedding cost: ~$0.02/1M tokens (text-embedding-3-small), one-time per document. Query cost: LLM call is the variable expense. At gpt-4o-mini pricing, 1000 queries/day ≈ $2–5/day. Cache frequent queries (hash(question) → cached response) for 10x cost reduction on repeated questions.",
      prompt: {
        context: "api.py is instrumented with latency logging.",
        instruction: "Add a /stats endpoint to api.py that returns: total queries served, avg latency ms, estimated daily cost at current volume (assume $0.15/1M input tokens, $0.60/1M output tokens for gpt-4o-mini), and cache hit rate if query caching is implemented.",
      },
      verify: { run: "curl http://localhost:8000/stats", expect: "{\"total_queries\": N, \"avg_latency_ms\": N, \"est_daily_cost_usd\": N}", type: "terminal-output" },
      time: "~30 min",
    },
  ],
},
```

- [ ] **Step 2: Verify project 01 compiles**

Run: `npx tsc --noEmit 2>&1 | grep "project\[id\]\|data.ts" | head -20`

Expected: no errors on project 01. Errors from projects 02–09 are expected.

- [ ] **Step 3: Smoke test in browser**

Run `npm run dev`, open `http://localhost:3000/project/1`. Verify:
- Environment Setup section appears above accordion, collapsed by default
- Click opens it: prerequisites, install cmd, API key row, project structure all show
- Step 1 opens: meta row shows 📁 Terminal · 🛠 Terminal · 🔑 Needs: OPENAI_API_KEY
- Purple prompt block shows context (muted italic) + instruction
- Green verify block shows run command + expected output
- Mark done button still works

- [ ] **Step 4: Commit project 01 content**

```bash
git add src/lib/data.ts
git commit -m "feat: project 01 content rewritten to new step schema"
```

---

### Task 4: Projects 02–09 content

**Files:**
- Modify: `src/lib/data.ts` — projects id:2 through id:9

Each sub-task follows the exact same pattern as Task 3. For every step listed under "Replace steps", produce a complete Step object with all required fields:

```typescript
{
  title: "...",
  sub: "...",
  meta: { location: "...", tool: "...", userInputs?: [...] },
  body: "...",
  prompt: { context: "...", instruction: "..." },
  verify: { run: "...", expect: "...", type: "terminal-output" | "browser" | "file-exists" | "ui-state" },
  time: "...",
}
```

The per-project blocks below specify envSetup verbatim and name the steps. Expand each named step into a full Step object before committing.

---

#### Project 02 — "Build an AI that searches, calculates, and takes actions on your behalf"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Python 3.10+", "pip", "OpenAI account"],
  tools: [
    { name: "openai", installCmd: "pip install openai python-dotenv", purpose: "LLM + tool-calling API" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys", envVar: "OPENAI_API_KEY=sk-..." },
  ],
  projectStructure: "my-agent/\n├── agent.py\n├── tools.py\n├── .env\n└── .gitignore",
},
```

- [ ] **Replace depthDesc**

```typescript
depthDesc: {
  beginner: "Not recommended at Beginner level — complete project 01 first to understand LLM API basics.",
  intermediate: "You will build a ReAct loop with 2 working tools (web search + calculator). Every prompt is given; you wire the pieces.",
  advanced: "Design the tool schema, implement streaming tool calls, handle parallel tool use and retry logic.",
},
```

- [ ] **Replace steps** — write beginner as a single gate step pointing to project 01, intermediate with ~4 steps (define tools, implement ReAct loop, handle tool errors, test multi-step query), advanced with ~4 steps (tool schema design, streaming, parallel tool use, retry). Follow the full Step schema from Task 3 for each step.

- [ ] **Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "id.*2\|error" | head -10
git add src/lib/data.ts
git commit -m "feat: project 02 content rewritten to new step schema"
```

---

#### Project 03 — "Ship a live AI chat assistant in an afternoon — with streaming and memory"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Node.js 18+", "npm", "An OpenAI or Anthropic account"],
  tools: [
    { name: "next + ai sdk", installCmd: "npx create-next-app@latest my-chatbot && cd my-chatbot && npm install ai @ai-sdk/openai", purpose: "Next.js app with streaming AI responses" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys", envVar: "OPENAI_API_KEY=sk-..." },
  ],
  projectStructure: "my-chatbot/\n├── app/\n│   ├── api/chat/route.ts  ← streaming endpoint\n│   └── page.tsx           ← chat UI\n├── .env.local\n└── package.json",
},
```

- [ ] **Replace steps** — beginner: scaffold Next.js + install AI SDK, create streaming route, build basic chat UI, add memory (useChat hook), deploy to Vercel. Intermediate: custom system prompt, message history persistence, streaming to specific UI elements. Advanced: multi-model routing, tool use in streaming, rate limiting.

- [ ] **Verify and commit**

```bash
git add src/lib/data.ts && git commit -m "feat: project 03 content rewritten to new step schema"
```

---

#### Project 04 — "Train a private AI model that outperforms ChatGPT on your specific task"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Python 3.10+", "pip", "Hugging Face account (free)", "8GB+ RAM (16GB recommended)"],
  tools: [
    { name: "transformers + peft", installCmd: "pip install transformers peft datasets accelerate bitsandbytes torch python-dotenv", purpose: "Model loading, LoRA fine-tuning, dataset handling" },
  ],
  apiKeys: [
    { name: "HF_TOKEN", where: "huggingface.co → Settings → Access Tokens → New token (read)", envVar: "HF_TOKEN=hf_..." },
  ],
  projectStructure: "my-finetune/\n├── data/\n│   ├── train.jsonl\n│   └── eval.jsonl\n├── train.py\n├── inference.py\n├── .env\n└── requirements.txt",
},
```

- [ ] **Replace steps** — beginner: gate step (not recommended), points to project 03. Intermediate: prepare training data as JSONL, load base model with LoRA config, run training, test inference. Advanced: hyperparameter tuning, quantisation, push to Hub, compare vs base model on eval set.

- [ ] **Verify and commit**

```bash
git add src/lib/data.ts && git commit -m "feat: project 04 content rewritten to new step schema"
```

---

#### Project 05 — "Build an AI that reads screenshots, charts, and documents like a human would"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Python 3.10+", "pip", "OpenAI account"],
  tools: [
    { name: "openai + pillow", installCmd: "pip install openai pillow python-dotenv fastapi uvicorn", purpose: "Vision API, image handling, API wrapper" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys", envVar: "OPENAI_API_KEY=sk-..." },
  ],
  projectStructure: "my-vision-app/\n├── images/         ← screenshots, charts, PDFs\n├── analyze.py\n├── api.py\n├── .env\n└── requirements.txt",
},
```

- [ ] **Replace steps** — beginner: gate (complete project 03 first). Intermediate: send image to GPT-4o vision, extract structured data from charts, build OCR pipeline, wrap as API. Advanced: batch processing, confidence scoring, handle multipage PDFs, compare vision models.

- [ ] **Verify and commit**

```bash
git add src/lib/data.ts && git commit -m "feat: project 05 content rewritten to new step schema"
```

---

#### Project 06 — "Turn any meeting recording into structured notes and action items automatically"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Python 3.10+", "pip", "OpenAI account", "A meeting recording (.mp3 or .mp4)"],
  tools: [
    { name: "openai", installCmd: "pip install openai python-dotenv", purpose: "Whisper transcription + GPT summarisation" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys", envVar: "OPENAI_API_KEY=sk-..." },
  ],
  projectStructure: "my-meeting-bot/\n├── recordings/     ← drop .mp3/.mp4 files here\n├── transcribe.py\n├── summarize.py\n├── run.py\n├── .env\n└── requirements.txt",
},
```

- [ ] **Replace steps** — beginner: transcribe audio with Whisper API, extract action items with GPT, format as markdown, save to file, test with a real recording. Intermediate: speaker diarisation, structured JSON output, Slack/email delivery. Advanced: real-time streaming transcription, custom action item taxonomy, calendar integration.

- [ ] **Verify and commit**

```bash
git add src/lib/data.ts && git commit -m "feat: project 06 content rewritten to new step schema"
```

---

#### Project 07 — "Replace hours of manual monitoring with an AI workflow that runs itself"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Node.js 18+ OR Python 3.10+", "n8n account (n8n.io, free cloud tier) OR pip"],
  tools: [
    { name: "n8n (no-code path)", installCmd: "Sign up at n8n.io — no install needed for cloud", purpose: "Visual workflow builder for the automation" },
    { name: "openai (code path)", installCmd: "pip install openai requests python-dotenv schedule", purpose: "LLM summarisation + HTTP requests + scheduler" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys", envVar: "OPENAI_API_KEY=sk-..." },
    { name: "SLACK_WEBHOOK_URL", where: "api.slack.com → Your Apps → Incoming Webhooks → Add New Webhook", envVar: "SLACK_WEBHOOK_URL=https://hooks.slack.com/..." },
  ],
  projectStructure: "my-workflow/\n├── monitor.py     ← or use n8n canvas\n├── .env\n└── requirements.txt",
},
```

- [ ] **Replace steps** — beginner: build in n8n (HTTP Request → OpenAI → Slack), schedule to run daily, test manually. Intermediate: add content hashing for deduplication, error alerting, deploy on a server. Advanced: idempotency, dead letter queue, observability with Prometheus.

- [ ] **Verify and commit**

```bash
git add src/lib/data.ts && git commit -m "feat: project 07 content rewritten to new step schema"
```

---

#### Project 08 — "Build search that understands meaning, not just keywords"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Python 3.10+", "pip", "Docker (for Qdrant)", "OpenAI account"],
  tools: [
    { name: "qdrant + embeddings", installCmd: "docker run -p 6333:6333 qdrant/qdrant\npip install qdrant-client openai rank-bm25 sentence-transformers python-dotenv fastapi uvicorn", purpose: "Vector store, embeddings, BM25, reranking, API" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys", envVar: "OPENAI_API_KEY=sk-..." },
  ],
  projectStructure: "my-search/\n├── ingest.py\n├── search.py\n├── api.py\n├── eval.py\n├── .env\n└── requirements.txt",
},
```

- [ ] **Replace steps** — beginner: gate (complete project 01 first). Intermediate: set up Qdrant, ingest documents, implement vector-only baseline, add BM25, hybrid RRF fusion, evaluate. Advanced: ANN index tuning, quantisation, sharding, latency SLOs, query classification.

- [ ] **Verify and commit**

```bash
git add src/lib/data.ts && git commit -m "feat: project 08 content rewritten to new step schema"
```

---

#### Project 09 — "Stop guessing which AI prompt works — measure and compare them quantitatively"

- [ ] **Add envSetup**

```typescript
envSetup: {
  prerequisites: ["Python 3.10+", "pip", "OpenAI account", "A prompt or chatbot to evaluate (complete project 03 first)"],
  tools: [
    { name: "openai + pytest", installCmd: "pip install openai pytest python-dotenv", purpose: "LLM calls, test runner, environment vars" },
  ],
  apiKeys: [
    { name: "OPENAI_API_KEY", where: "platform.openai.com → API Keys", envVar: "OPENAI_API_KEY=sk-..." },
  ],
  projectStructure: "my-evals/\n├── prompts/\n│   ├── v1.txt\n│   └── v2.txt\n├── eval_set.jsonl\n├── judge.py\n├── run_eval.py\n├── .env\n└── requirements.txt",
},
```

- [ ] **Replace steps** — beginner: gate (complete project 03 first). Intermediate: create eval_set.jsonl with 10 question/expected-answer pairs, implement LLM-as-judge scorer, compare two prompt variants, output pass/fail table. Advanced: multi-dimensional rubrics, statistical significance testing, CI integration with GitHub Actions.

- [ ] **Verify and commit**

```bash
git add src/lib/data.ts && git commit -m "feat: project 09 content rewritten to new step schema"
```

---

### Task 5: Final verification and push

- [ ] **Step 1: TypeScript clean compile**

```bash
cd /Users/lz/Documents/GitHub/ailens && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Dev server smoke test all 9 projects**

Run `npm run dev`. Open each of `/project/1` through `/project/9`. For each verify:
- EnvSetup section present and toggles
- Steps open and show meta row, purple prompt block, green verify block
- No console errors

- [ ] **Step 3: Push to GitHub and verify Vercel deployment**

```bash
git config --global http.sslVerify false
git push
git config --global http.sslVerify true
```

Wait for Vercel deployment. Open the live URL and test project 1 detail page.
