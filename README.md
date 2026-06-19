# AILens

> A working index of AI projects — things you can build, run, and ship to actually understand how AI works.

---

## Table of Contents

1. [Background](#background)
2. [Core Philosophy](#core-philosophy)
3. [Platform Structure](#platform-structure)
4. [Taxonomy](#taxonomy)
5. [Content Strategy](#content-strategy)
6. [Sourcing Strategy](#sourcing-strategy)
   - [Entry Validity Gates](#entry-validity-gates)
   - [Trusted Industry Leads](#trusted-industry-leads)
   - [Ingestion Mechanism](#ingestion-mechanism)
   - [Ingestion Pipeline](#ingestion-pipeline)
   - [Deduplication](#deduplication)
   - [Content Freshness](#content-freshness)
   - [Cold Start Strategy](#cold-start-strategy)
   - [Review Queue](#review-queue)
7. [Tech Architecture](#tech-architecture)
8. [Data Model](#data-model)
9. [Trending & Relevancy](#trending--relevancy)
10. [Design System](#design-system)
11. [Development Phases](#development-phases)
12. [Future Directions](#future-directions)

---

## Background

AILens started from a simple observation: most AI learning resources either go too broad (conceptual articles, hype) or too deep (research papers, academic courses). There is a missing middle — **a curated, hands-on index of real AI projects that anyone can actually build, ship, and learn from**.

The goal is threefold:

1. **Learn by building** — every entry in the index is a project you complete, not an article you read
2. **Stay current** — the index is a living document, continuously updated with new AI use cases and techniques as the field evolves
3. **Find opportunity** — understanding what AI can do, concretely, reveals where the real-world profit and personal value lies

The platform is designed for one user first (the builder), with the intention of eventually opening it to a community of practitioners who contribute use cases, share progress, and help each other get unstuck.

---

## Core Philosophy

**"Things you can build, run, and ship — to actually understand how AI works."**

Four principles guide every product decision:

| Principle | What it means |
|---|---|
| **Hands-on over theoretical** | Every project produces a working artifact. No tutorials that stop at explaining. |
| **Depth that adapts** | The same project is explained differently for a beginner and an advanced engineer. The content meets you where you are. |
| **Honest effort estimates** | Time and step counts are real, not aspirational. If it takes 5 hours, it says 5 hours. |
| **Local first** | Where possible, projects run locally — no cloud accounts, no API costs, no data leaving your machine. |

---

## Platform Structure

The platform has three top-level views:

```
AILens
├── Index          — Browsable, filterable catalog of all AI projects
├── Tracker        — Personal progress dashboard (build queue, streaks, completions)
└── Project Detail — Full project page with capabilities, steps, and contextual help
```

### Index

The main entry point. Shows all projects with:
- Sequential numbering (`01`, `02`...)
- Title and one-line description
- Difficulty badge (Beginner / Intermediate / Advanced)
- Tool chips (Python, LangChain, Vercel...)
- Time estimate and step count
- `local` badge where applicable
- Filter by category and difficulty
- Full-text search across title, tools, and description

### Project Detail

The core learning experience. Each project page has:

**Header**
- Project number, title, difficulty badge
- Tool chips, time estimate, step count
- Start Building and Save actions

**Depth Switcher**
- Three modes: Beginner / Intermediate / Advanced
- Switching depth changes the explanation style, step granularity, and code shown
- Description line updates to reflect what changes at each level

**Two tabs**
- *What It Does* — capabilities, real-world uses, pain points, who benefits
- *Build It* — step-by-step implementation with progress tracking

**Step Accordion**
- Each step: number, title, one-line description, expandable body
- Body contains: explanation, why it matters, code block, time estimate, "Mark done" action
- Warnings for common mistakes at that step

**Bottom of page**
- Time remaining card (updates as steps are marked done)
- "Stuck? Ask Claude" — contextual AI help scoped to the current step

### Tracker

Personal progress dashboard:
- Streak counter (days building consecutively)
- Three columns: Not Started / In Progress / Completed
- Each project card shows: number, title, difficulty dot, thin progress bar, step count
- Filter by difficulty level
- Click any card to resume the project

---

## Taxonomy

### Difficulty Levels

| Level | User Profile | Code Shown | Explanation Style |
|---|---|---|---|
| **Beginner** | Non-coder or first AI project | Full copy-paste snippets | Plain English, every term explained, analogies used |
| **Intermediate** | Comfortable with Python, 1–2 AI projects done | Patterns, not full scripts | Why over what, architectural reasoning |
| **Advanced** | Builds production systems | Design decisions, edge cases | Tradeoffs, failure modes, scaling considerations |

### Project Categories

| Category | Description | Example Projects |
|---|---|---|
| **RAG** | Retrieval-Augmented Generation — grounding LLMs in private documents | Document Q&A, semantic search |
| **Agents** | Autonomous loops that use tools and make decisions | ReAct agent, prompt eval set |
| **Chatbots** | Conversational interfaces with memory and streaming | Streaming chatbot, customer support bot |
| **Fine-tuning** | Training or adapting a model on custom data | LoRA fine-tune, intent classifier |
| **Vision** | Models that process images, screenshots, charts | Multimodal assistant, OCR pipeline |
| **Speech** | Audio transcription and synthesis | Meeting summarizer, voice pipeline |
| **Automation** | Scheduled workflows that chain AI steps | n8n workflow, scrape-summarize-notify |

### Outcome Types (Use Case Layer)

| Outcome | Description |
|---|---|
| **Profit** | Direct revenue generation — freelance service, SaaS, productized offering |
| **Cost Saving** | Reduces spend on labour, tools, or time |
| **Productivity** | Makes existing work faster or less effort |
| **Quality** | Improves the output of existing work |
| **Quality of Life** | Personal improvement, learning, or wellbeing |

### Effort Levels (Use Case Layer)

| Level | What it means |
|---|---|
| **Low** | Prompt + API call, no-code tools, achievable in hours |
| **Medium** | Some coding, 1–2 integrations, achievable in days |
| **High** | Significant engineering, multiple systems, weeks of work |

---

## Content Strategy

### Entry Definition

An entry in AILens is a **hybrid** — a real-world AI use case that is also a buildable project guide. Every entry must satisfy two conditions simultaneously:

1. **Trending signal** — it has measurable popularity or industrial relevance (engagement on a trusted platform, or a direct post from a Tier 1 industry lead)
2. **Buildable** — it passes the buildability gate (see [Entry Validity Gates](#entry-validity-gates)) and can be decomposed into concrete implementation steps without unconfident assumptions

Use cases that are industry-trending but not yet fully buildable are flagged and held until source richness is sufficient. Projects with rich implementation detail but no social signal are deprioritised.

### Content Quality Standard

Every entry — whether sourced from the pipeline or batch-generated — must pass these three tests before entering the review queue:

**1. Outcome-first title rule**
The title must state the real-world outcome or capability, not the technique or tool used.

| Bad (technique-first) | Good (outcome-first) |
|---|---|
| Document Q&A with citations | Ask questions across your files and get cited answers instantly |
| Fine-tune a small model | Train a private AI model that outperforms ChatGPT on your specific task |
| Semantic search over your docs | Build search that understands meaning, not just keywords |
| Build a prompt eval set | Stop guessing which AI prompt works — measure and compare them quantitatively |

**2. Smart non-technical friend test**
Before any entry is approved: could someone who knows nothing about AI read the title and tagline and understand what it does for them and why it matters? If not, rewrite. The tagline should work as a standalone tweet.

**3. Dual audience card**
The index card serves two readers simultaneously:
- **Title + tagline** — for the curious non-expert who is scanning for something relevant to their work
- **Tool chips + time estimate + step count** — for the experienced builder who is evaluating complexity and fit

Both layers must be complete. Neither substitutes for the other.

**4. Author's voice preserved**
When an entry originates from a real source (a post, tutorial, or case study), Claude's enrichment works *around* the author's original language — it does not replace it. The author's framing, examples, and terminology are preserved. Claude adds structure and depth, not a rewrite.

**5. Source and author attribution**
Every entry carries a `source` field with: `author`, `platform`, and `url`. This is displayed on the index card (`via Author · Platform`) and as a clickable link on the detail page. Attribution is mandatory for sourced entries and encouraged even for batch-generated ones (linking to the canonical reference).

### Project Detail Schema

Each project in the index carries two layers of content:

**Layer 1 — Index Card** (shown in listing)
```
number          01
title           Ask questions across your files and get cited answers instantly
difficulty      Beginner
categories      [RAG]
tools           [Python, LangChain, Chroma]
time_estimate   ~3h
step_count      6
is_local        true
tagline         Stop ctrl+F searching through hundreds of pages. Upload your PDFs,
                ask in plain English, get the answer with the exact source.
source          { author: "LangChain team", platform: "LangChain Docs", url: "..." }
```

**Layer 2 — Detail Page** (shown when project is opened)
```
what_it_does        Plain English overview of the finished project
real_world_uses     4–6 concrete industry scenarios
pain_points         4–6 specific problems this solves
who_benefits        3–5 roles with specific gains

steps_beginner      Full step-by-step with copy-paste code
steps_intermediate  Pattern-level steps with architectural notes
steps_advanced      Checkpoints focusing on tradeoffs and production concerns

extensions          What to build next after completing this
profit_paths        How to monetise the skill or project
related             Linked project IDs
```

### Maturity-Adaptive Steps

Each step object contains:

```json
{
  "step_number": 3,
  "title": "Embed and index the chunks",
  "sub": "Turn each chunk into a vector and store it in Chroma.",
  "body": "Explanation appropriate to the depth level.",
  "code": "Code snippet — full for Beginner, partial for Intermediate, omitted for Advanced",
  "why": "Beginner only: why this step matters in plain English",
  "watch_out": "Common mistake or error at this step",
  "time": "~15 min"
}
```

**Beginner rules:** Explain every new term. Full code. Analogies. Explicit "why". Flag every error.

**Intermediate rules:** Assume Python fluency. Code patterns only. Focus on architectural decisions. Point to docs for standard setup.

**Advanced rules:** Checkpoints not instructions. Tradeoffs and failure modes. Production considerations (latency, cost, scaling). What not to do.

### Claude Prompts for Content Generation

**Extraction prompt (Pass 1)** — structures raw content into a project entry:
```
You are a use case analyst for an AI builder's index.
Extract structured data from the content below.
Output strict JSON: title, summary, categories[], difficulty,
tools[], time_estimate, step_count, tags[], confidence, skip_reason.

TITLE RULE: The title must state the real-world outcome, not the technique.
Good: "Turn any meeting recording into structured notes automatically"
Bad: "Transcribe & summarize meetings with Whisper"

Skip if: generic hype, no practical application, tool announcement without clear
use case, or no identifiable real-world pain point addressed.
```

**Enrichment prompt (Pass 2)** — fills the detail page:
```
Given project: {title}, {tools}, {difficulty}
Source: {author} on {platform}

IMPORTANT: Preserve the author's original framing, examples, and terminology.
Structure and expand around their voice — do not replace it.

Generate:
1. what_it_does (3-4 sentences, no marketing language)
2. real_world_uses (4-6 scenarios with concrete role + outcome)
3. pain_points (4-6 specific problems, not generic)
4. who_benefits (3-5 roles with specific gains)
5. steps at BEGINNER level (full code, every term explained)
6. steps at INTERMEDIATE level (patterns, architectural notes)
7. steps at ADVANCED level (checkpoints, tradeoffs only)

Each step must include a confidence rating (0.0–1.0). Flag any step
where confidence < 0.8 — do not generate fake steps to fill gaps.
```

**"Stuck? Ask Claude" prompt** — scoped help at the current step:
```
The user is working on: {project_title}.
They are on Step {n}: {step_title}.
Their depth level: {beginner | intermediate | advanced}.
Tools in use: {tools}.

Help them with this specific step only.
If they describe an error, ask them to paste it.
Keep answers short. Do not jump ahead to future steps.
```

---

## Sourcing Strategy

### Entry Validity Gates

Every candidate item must pass **both gates** before entering the enrichment pipeline. Failing either gate = skip.

**Gate 1 — Trending signal**

The item must have at least one of:
- Measurable engagement on a known platform (likes, saves, votes, views above threshold per platform)
- A post or share by a Tier 1 trusted industry lead (auto-passes Gate 1)
- Cross-source coverage: the same topic appears in 2+ independent sources

Items from Tier 1 leads auto-pass Gate 1. Items from Tier 2 sources require engagement signals above threshold. Items from Tier 3 (community) require the threshold plus cross-source confirmation.

**Gate 2 — Buildability**

Run in sequence — fail fast:

1. **Source richness check** — the raw content must include at least 2 of: working code, GitHub repo link, named specific tools, live demo. If it fails here, skip immediately (no Claude call).
2. **Claude step generation with confidence** — Claude attempts to decompose the use case into implementation steps. Each step is rated 0.0–1.0 confidence. If average confidence < 0.75 or any critical step < 0.6, the item is held in a `needs_more_source` queue rather than published. No fake steps are generated to fill gaps.

### Trusted Industry Leads

A **Tier 1 account** is a high-conviction source whose posts on a new AI use case are treated as a trending signal and automatically pass Gate 1.

**English-language Tier 1 accounts (proposed)**

| Account | Platform | Specialty |
|---|---|---|
| Andrej Karpathy | X / YouTube | Fundamentals, education, insider AI perspective |
| Simon Willison | X / Blog | LLM tools, practical hacks, never hype |
| Swyx (Shawn Wang) | X / Latent Space | AI engineering, what builders actually ship |
| Ethan Mollick | X | AI adoption in real work, non-engineer use cases |
| Ben Tossell | X / Ben's Bites | AI tools curation and discovery |
| Jason Liu | X / Instructor Docs | Structured outputs, RAG patterns, very applied |
| Harrison Chase | X | Agents, RAG, LangChain patterns |
| Jeremy Howard | X / fast.ai | Practical ML, education |
| Matt Wolfe | X / YouTube | AI tools, massive reach, early discovery |
| Greg Kamradt | X / YouTube | LLM notebooks, chunking, RAG patterns |

**Chinese-community Tier 1 accounts (proposed)**

| Account | Platform | Specialty |
|---|---|---|
| 李沐 (Mu Li) | Bilibili / X | Deep learning education, Dive into Deep Learning author |
| 宝玉xp (@dotey) | X / Weibo | Translates key English AI content to Chinese, practitioner-focused |
| 归藏 (guicang) | Xiaohongshu / WeChat | AI tools, real-world use cases, high following |
| easychen | GitHub / X / WeChat | Developer tools, AI side projects, ships real things |
| 硅星人 | WeChat / Weibo | AI industry news, practical products and companies |
| 量子位 (Quantum Bit) | WeChat / Weibo | Leading Chinese AI media, enterprise deployments |
| APPSO | WeChat | Practical AI tools from the user perspective |
| Bilibili AI tutorial creators | Bilibili / Douyin | Short-form tutorials, younger developer audience |

> **Tier 2** (~100 accounts): emerging voices, not yet Tier 1. Items from Tier 2 sources still require engagement signals to pass Gate 1 — they are not auto-passed, but their threshold is halved.
>
> **Tier 3** (community-nominated): anyone can nominate an account for Tier 2. Nominations require 3 endorsements from existing Tier 1 or Tier 2 accounts.

### Ingestion Mechanism

A hybrid model: automated cron for structured sources, opencli browser automation for social platforms, manual paste for edge cases.

**opencli** (Chrome DevTools Protocol automation, 87+ platforms) handles all social media ingestion where session state is required — including Chinese platforms that need login. This avoids scraping bans and respects platform ToS by operating like a real browser session.

| Source type | Mechanism | Cadence |
|---|---|---|
| Newsletters (Ben's Bites, TLDR AI, Import AI, etc.) | RSS / cron | Every 6h |
| Product Hunt, Hacker News | API / cron | Every 1–6h |
| GitHub Trending | API / cron | Every 6h |
| Zhihu, CSDN, Juejin | opencli (session-based) | Daily |
| Bilibili, Douyin | opencli (session-based) | Daily |
| Xiaohongshu, Weibo | opencli (session-based) | Daily |
| Twitter/X (Tier 1 accounts) | opencli | Daily |
| Reddit (r/artificial, r/MachineLearning) | API + opencli | Every 6h |
| Manual paste / URL forward | Admin panel | On demand |

### Ingestion Pipeline

```
Source → Fetcher → Gate 1 check → Deduplicator → Gate 2 check → Extractor (Claude) → Enricher (Claude) → Scorer → Review Queue → Published
```

1. **Fetch** — cron or opencli pulls raw content per source
2. **Gate 1 check** — trending signal validation (engagement threshold or Tier 1 lead)
3. **Deduplicate** — two-layer deduplication (see below)
4. **Gate 2 check** — source richness, then Claude confidence scoring
5. **Extract** — Claude Pass 1 structures raw content into a draft entry
6. **Enrich** — Claude Pass 2 fills detail page content, generates steps at all levels with per-step confidence
7. **Score** — compute initial trending_score, source_count, cross_cultural_signal
8. **Review Queue** — high-confidence items auto-publish; low-confidence items queue for manual review (~15–20 min/day)

### Deduplication

Two layers, run in sequence:

**Layer 1 — Semantic similarity at ingestion**
Embed the title + summary of every incoming item. Compare against all existing entries and pending queue items. Cosine similarity > 0.88 = duplicate. On match: merge signals (increment `source_count`, log additional source URL) but do not create a new raw item.

**Layer 2 — Daily topic clustering**
Before enrichment runs each day, group pending items into topic clusters. Items within the same cluster are merged into one enriched entry. All source URLs are preserved as evidence. The `source_count` and `cross_cultural_signal` fields are updated — an item covered by both English and Chinese sources gets a significant trending boost.

### Content Freshness

Entries do not have a fixed TTL. Freshness is maintained through two event-driven mechanisms:

**Signal-based refresh (urgent priority)**
Triggered by: a new major version release of a named tool in the entry (detected via GitHub Releases API / PyPI changelog), or a Tier 1 account posting a correction or "this is outdated" signal. Claude re-evaluates the affected steps and flags breaking changes.

**Community flagging (high priority)**
Users can flag any individual step as broken or outdated. Three flags on the same step triggers a refresh queue entry. Claude suggests the update; the reviewer approves. Handled silently — no public warning badge until the fix is confirmed.

### Cold Start Strategy

To reach a critical mass of 50–100 entries before the automated pipeline generates them organically:

**Archive backfill (primary)** — run the ingestion pipeline against 3–6 months of historical content: Ben's Bites archive, Hacker News "Show HN" posts tagged AI, GitHub repos with 500+ stars in AI categories, top Zhihu AI answers.

**Claude batch generation (supplement)** — for canonical AI use cases that would definitely pass both gates and are well-known enough to have rich reference material, Claude generates full entries. Condition: Claude must be able to articulate a clear real-world pain point and value add. If it cannot, the case is skipped — no entries generated without a grounded use case.

A manual curation sprint of 20–30 entries (sourced from your own knowledge and bookmarks) establishes the quality baseline before automation scales it.

### Review Queue

- **Auto-publish:** items scoring high on both trending signal strength (≥4/5) and enrichment confidence (≥4/5) go live immediately
- **Manual queue:** items below either threshold wait for daily review (15–20 minutes)
- **Hold:** items that pass Gate 1 but fail Gate 2 (`needs_more_source` status) are retried when new source material arrives
- **Threshold review:** after 30 days of watching auto-published quality, thresholds are tuned toward more automation

### Cron Schedule

| Frequency | Task |
|---|---|
| Every 1h | Fetch Product Hunt, HN new stories |
| Every 6h | Ingest newsletters (RSS), Reddit, GitHub Trending |
| Every 24h | opencli sweep of Tier 1 social accounts (X, Bilibili, Weibo, Douyin, Xiaohongshu) |
| Every 24h | Run deduplication + topic clustering on pending raw items |
| Every 24h | Run Claude extraction + enrichment on deduplicated queue |
| Every 24h | Recompute trending scores for all projects |
| Every 24h | Check GitHub Releases / PyPI for version updates to tools mentioned in entries |
| Every 7d | Fetch research reports, marketplace scans |
| Every 7d | Purge raw items older than 90 days (status=skipped) |

---

## Tech Architecture

### Stack

| Layer | Technology | Reason |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, RSC, file-based routing, Vercel native |
| **Language** | TypeScript | Type safety across DB ↔ API ↔ UI |
| **Database** | Supabase (Postgres) | Auth + DB + Realtime in one, generous free tier |
| **UI Components** | shadcn/ui + Tailwind CSS | Matches the minimal design system, fully customisable |
| **AI** | Claude API (claude-sonnet-4-6) | Content generation, step enrichment, contextual help |
| **Deployment** | Vercel | Zero-config, preview deployments, cron jobs |
| **Search** | Supabase full-text search → Algolia (later) | Start simple, upgrade when needed |
| **Content ingestion** | Firecrawl + Claude pipeline | Auto-discover and structure new projects |

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                     │
│         UI Layer (shadcn/ui + Tailwind)                  │
│         React Server Components                          │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                 Next.js API Routes                        │
│   /api/projects    /api/ask    /api/ingest    /api/cron  │
└──────┬───────────────────────┬────────────────┬─────────┘
       │                       │                │
┌──────▼──────┐   ┌────────────▼────┐   ┌──────▼──────┐
│  Supabase   │   │   Claude API    │   │  Firecrawl  │
│  Postgres   │   │ claude-sonnet   │   │  Web scrape │
│  Auth       │   │ -4-6            │   │             │
│  Realtime   │   └─────────────────┘   └─────────────┘
└─────────────┘
```

### Key API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/projects` | GET | List and filter projects |
| `/api/projects/[id]` | GET | Single project with steps at requested depth |
| `/api/progress` | POST | Mark a step done, update user progress |
| `/api/ask` | POST | "Stuck? Ask Claude" — streaming response scoped to step |
| `/api/ingest` | POST | Trigger ingestion pipeline for a URL or raw content |
| `/api/cron/trending` | GET | Recompute trending scores (called by Vercel cron) |

### Page Routes

| Route | Page |
|---|---|
| `/` | Index — project listing |
| `/project/[id]` | Project detail |
| `/tracker` | Personal tracker |
| `/admin` | Review queue for ingested drafts |

---

## Data Model

### Core Tables

```sql
-- Projects (the index entries)
create table projects (
  id                    uuid primary key default gen_random_uuid(),
  number                smallint unique not null,
  title                 text not null,
  tagline               text,
  difficulty            text check (difficulty in ('Beginner','Intermediate','Advanced')),
  categories            text[],
  tools                 text[],
  time_estimate         text,
  step_count            smallint,
  is_local              boolean default false,
  -- Source attribution (first-class field)
  source_author         text,
  source_platform       text,
  source_url            text,
  source_note           text,
  -- Pipeline metadata
  status                text default 'published',  -- draft | pending_review | needs_more_source | published
  source_count          int default 1,             -- number of independent sources covering this entry
  cross_cultural_signal boolean default false,     -- true if covered in both English and Chinese sources
  enrichment_confidence float,                     -- avg Claude confidence across all steps
  trending_score        float default 0,
  view_count            int default 0,
  save_count            int default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Rich content per project (detail page)
create table project_content (
  project_id      uuid references projects(id) primary key,
  what_it_does    text,
  real_world_uses jsonb,   -- [{scenario, description}]
  pain_points     text[],
  who_benefits    jsonb,   -- [{role, gain}]
  extensions      jsonb,
  profit_paths    jsonb,
  related_ids     uuid[]
);

-- Steps (per project, per depth level)
create table project_steps (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references projects(id),
  depth           text check (depth in ('beginner','intermediate','advanced')),
  step_number     smallint,
  title           text,
  sub             text,
  body            text,
  code            text,
  why             text,
  watch_out       text,
  time_estimate   text,
  confidence      float,    -- Claude's confidence in this step (0.0–1.0). Steps < 0.8 are flagged.
  flag_count      int default 0,  -- community "broken step" flags; ≥3 triggers refresh queue
  unique (project_id, depth, step_number)
);

-- User progress
create table user_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id),
  project_id      uuid references projects(id),
  depth           text default 'beginner',
  completed_steps int[] default '{}',
  status          text default 'not_started',  -- not_started | in_progress | completed
  started_at      timestamptz,
  completed_at    timestamptz,
  unique (user_id, project_id)
);

-- Streak tracking
create table user_streaks (
  user_id         uuid references auth.users(id) primary key,
  current_streak  int default 0,
  longest_streak  int default 0,
  last_active_at  date
);

-- Events (for trending score computation)
create table project_events (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references projects(id),
  event_type      text,   -- 'view' | 'save' | 'step_complete' | 'share'
  user_id         uuid,
  created_at      timestamptz default now()
);

-- Raw ingestion log
create table raw_items (
  id                  uuid primary key default gen_random_uuid(),
  source              text,          -- platform name
  source_author       text,          -- author / account name
  source_tier         int,           -- 1 | 2 | 3 | null (community/anonymous)
  url                 text,
  title               text,
  body                text,
  content_hash        text unique,
  embedding           vector(1536),  -- for dedup cosine similarity check
  gate1_passed        boolean,       -- trending signal gate
  gate2_passed        boolean,       -- buildability gate
  enrichment_confidence float,
  status              text default 'pending',
    -- pending | gate1_failed | needs_more_source | extracted | skipped | published
  skip_reason         text,
  merged_into         uuid references raw_items(id),  -- dedup: points to the canonical item
  project_id          uuid references projects(id),
  fetched_at          timestamptz default now()
);
```

---

## Trending & Relevancy

### Trending Score Algorithm

```python
def compute_trending_score(project_id):
    saves_24h    = count_events(project_id, 'save',           hours=24)
    saves_7d     = count_events(project_id, 'save',           days=7)
    views_7d     = count_events(project_id, 'view',           days=7)
    completions  = count_events(project_id, 'step_complete',  days=7)
    source_hits  = count_source_mentions(project_id,          days=30)

    engagement = (
        saves_24h   * 20  +
        saves_7d    * 5   +
        views_7d    * 0.5 +
        completions * 8   +
        source_hits * 15
    )

    age_days        = (now() - project.created_at).days
    recency_boost   = max(0, 30 - age_days) * 0.5
    daily_avg       = max(saves_7d / 7, 0.1)
    velocity        = min(saves_24h / daily_avg, 3.0)

    return min((engagement + recency_boost) * velocity, 100)
```

### Trending Labels

| Label | Condition |
|---|---|
| 🔥 Hot | score > 80, last 24h |
| 📈 Rising | score 50–80, last 7d |
| ⚡ New | age < 7 days + score > 30 |
| 🏛 Classic | save_count > 500, age > 90 days |
| 💎 Hidden gem | profit_potential = 5, views < 100 |

### Relevancy Engine

**Signal sources ranked by weight:**

| Signal | Weight | Type |
|---|---|---|
| Saved projects | 0.35 | Explicit |
| User profile (skills, goals) | 0.30 | Explicit |
| Time spent on detail page | 0.15 | Implicit |
| Tags of items saved | 0.10 | Implicit |
| Collaborative (similar users) | 0.10 | Collaborative |

**Relevancy scoring prompt:**
```
USER PROFILE:
- Skills: {skills}
- Goals: {goals}
- Budget: {budget}
- Hours/week: {hours}
- Previously saved: {saved_project_titles}

PROJECT: {title} | Type: {type} | Difficulty: {difficulty}
Tools: {tools} | Profit Potential: {profit}/5

Score FIT 0–10 for this specific user.
Output: { fit_score, fit_label, reason (1 sentence), blocker }
```

---

## Design System

Extracted from the Claude Design mockups.

### Colors

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f9f8f6` | Page background (warm off-white) |
| `--surface` | `#ffffff` | Cards, inputs |
| `--border` | `#e5e4e0` | All borders |
| `--text` | `#111110` | Primary text |
| `--muted` | `#888580` | Secondary text, labels |
| `--blue` | `#4169e1` | Active states, project numbers, step titles, In Progress |
| `--blue-light` | `#eef1fc` | Beginner badge background |
| `--green` | `#2d7a4f` | Completed section label |
| `--green-bar` | `#3db870` | Completed progress bar fill |
| `--purple` | `#5b50d6` | "Stuck? Ask Claude" button |
| `--purple-bg` | `#f0effe` | Ask Claude card background |
| `--orange` | `#c4522a` | Advanced badge, warnings |

### Typography

| Usage | Style |
|---|---|
| Page headlines | Bold, large, tight letter-spacing (`-0.5px`) |
| Project titles | Semibold, `17px` in listing, `28px` in detail |
| Step titles | Semibold, `15px`, blue |
| Labels / numbers | Monospace, uppercase, `11–13px` |
| Body text | Regular, `14–15px`, `1.6–1.7` line height |
| Code | Monospace, `13px`, dark background `#1a1a18` |

### Key Components

**Project card (index)**
- Number in monospace gray
- Bold title, difficulty badge inline
- Tool chips + time + steps in meta row
- No hover shadow — title colour change to blue only

**Step accordion**
- Step number: monospace, muted
- Title: blue, semibold (signals clickability)
- One-line description below title
- Chevron right-aligned, rotates on open
- Body: padded left to align with title

**Progress bar**
- Height: `2px`
- Background: `--border`
- Fill: blue (in progress), green (complete)
- Renders inside tracker cards and at top of Build It tab

**Difficulty dot (tracker)**
- `• Beginner` — blue
- `• Intermediate` — amber
- `• Advanced` — orange

**Streak badge**
- Flame emoji + monospace bold text + small caps subtext
- Border, rounded, white background

---

## Development Phases

### Phase 0 — Setup (Day 1)
- `npx create-next-app@latest ailens --typescript --tailwind --app`
- Configure shadcn/ui
- Set up Supabase project, run schema migrations
- Connect to Vercel, enable preview deployments
- **Verify:** blank app live at `ailens.vercel.app`

### Phase 1 — Index + Detail (Week 1)
- Implement Index page (`/`) with filter and search
- Implement Project Detail page (`/project/[id]`) with depth switcher and step accordion
- Seed all 9 projects with full content at all 3 depth levels
- **Verify:** all 9 projects browsable, steps expand correctly at each level

### Phase 2 — Auth + Tracker (Week 2)
- Supabase Auth (Google OAuth)
- Save/unsave projects
- Mark steps as done (persisted to database)
- Tracker page with real data
- Streak computation (daily cron)
- **Verify:** logged-in user progress persists across sessions

### Phase 3 — "Stuck? Ask Claude" (Week 2–3)
- `/api/ask` route with streaming
- Inject current project + step + depth into system prompt
- Chat UI inside the step accordion (inline, not a modal)
- **Verify:** Claude answers are scoped to the current step, not generic

### Phase 4 — Content Pipeline (Week 3–4)
- Admin review queue (`/admin`)
- URL submission form → Firecrawl → Claude extraction → draft entry
- Claude generates step content at all 3 levels for new entries
- Approve/reject/edit workflow
- **Verify:** submit a URL, approve, appears in index within 5 minutes

### Phase 5 — Trending + Discovery (Week 4–5)
- Event tracking (view, save, step_complete)
- Trending score cron job
- "New this week" and "Most saved" sections on index
- Email digest (weekly) via Resend
- **Verify:** trending scores update daily, new section shows correct projects

### Phase 6 — Opportunity Layer (Post-MVP)
- User profile (skills, goals, budget)
- Relevancy scoring via Claude API
- "For you" personalised section
- Profit path templates per project
- Idea combinator (select 2+ projects → Claude suggests business idea)

---

## Future Directions

**Community**
- Public project submissions with upvoting
- User-contributed alternative steps ("here's how I did it differently")
- Comments per step

**Integrations**
- GitHub: link your completed project repo to a tracker entry
- VS Code extension: open project steps in sidebar while coding
- Slack bot: daily project suggestion based on your profile

**Monetisation paths**
- Free tier: full index access, no progress tracking
- Pro ($9/mo): Tracker, "Stuck? Ask Claude", personalised feed
- Teams ($29/mo per seat): shared tracker, team learning paths
- API access: embed the index in other tools

**Content expansion**
- Video walkthroughs per project
- "See it working" live demos embedded in detail page
- Downloadable starter repos (pre-scaffolded project per entry)
- Certification: complete 5 projects at Intermediate → earn a verifiable credential

---

*Last updated: June 2026*
*Design: Claude Design (Anthropic)*
*Demo: https://zeinliu.github.io/ailens-demo/*

---

## Decision Log

Key decisions locked during the sourcing pipeline design session.

| # | Decision | Outcome |
|---|---|---|
| 1 | Entry definition | Hybrid — a use case that is trending AND buildable becomes a project guide |
| 2 | Trending signal sources | Platform engagement on GitHub, Reddit, HN, Zhihu, Bilibili, Douyin, Weibo, Xiaohongshu + Tier 1 lead posts auto-pass |
| 3 | Buildability gate | Source richness check first (fail fast, no Claude call). If passes → Claude step generation with per-step confidence. Low confidence = held, not faked. |
| 4 | Trusted leads | Tiered: ~30 Tier 1 accounts (auto-pass), ~100 Tier 2 (halved threshold), community-nominated Tier 3. English + Chinese balanced from day one. Douyin included. |
| 5 | Ingestion mechanism | Cron for structured sources (RSS, APIs). opencli for social + Chinese platforms (session-based, 87+ platforms). Manual paste for edge cases. |
| 6 | Deduplication | Semantic similarity at ingestion (cosine > 0.88 = merge). Daily topic clustering before enrichment. Cross-source + cross-cultural count feeds trending score. |
| 7 | Review queue | Auto-publish high-confidence (≥4/5 on both dimensions). Low-confidence queues for ~15–20 min daily review. Re-evaluate thresholds after 30 days. |
| 8 | Content freshness | Event-driven only (no TTL). Signal-based (tool version releases, Tier 1 corrections) + community step flagging (3 flags = refresh queue). |
| 9 | Cold start | Archive backfill (3–6 months) + Claude batch generation for canonical cases (only if clear pain point can be articulated). Manual sprint of 20–30 entries sets quality baseline. |
| 10 | Content quality | Outcome-first titles. Smart non-technical friend test. Dual audience card. Author's original language preserved. Source + author attribution on every entry. |
