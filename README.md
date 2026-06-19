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

### Project Detail Schema

Each project in the index carries two layers of content:

**Layer 1 — Index Card** (shown in listing)
```
number          01
title           Document Q&A with citations
difficulty      Beginner
categories      [RAG]
tools           [Python, LangChain, Chroma]
time_estimate   ~3h
step_count      6
is_local        true
tagline         Chunk PDFs, embed, retrieve, and answer grounded in your own sources
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
Skip if: generic hype, no practical application, tool announcement without clear use case.
```

**Enrichment prompt (Pass 2)** — fills the detail page:
```
Given project: {title}, {tools}, {difficulty}
Generate:
1. what_it_does (3-4 sentences, no marketing language)
2. real_world_uses (4-6 scenarios with concrete role + outcome)
3. pain_points (4-6 specific problems, not generic)
4. who_benefits (3-5 roles with specific gains)
5. steps at BEGINNER level (full code, every term explained)
6. steps at INTERMEDIATE level (patterns, architectural notes)
7. steps at ADVANCED level (checkpoints, tradeoffs only)
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

### Source Tiers

| Tier | Type | Examples | Signal Quality |
|---|---|---|---|
| **T1 — Curated** | Newsletters, research reports | Ben's Bites, TLDR AI, McKinsey AI, a16z | Very high |
| **T2 — Community** | Structured platforms | Product Hunt AI, Hacker News, Reddit | Medium |
| **T3 — Broadcast** | High-volume social | Twitter/X, YouTube, LinkedIn | Low (needs filtering) |

### Source Inventory

**Newsletters (daily/weekly ingest)**
- Ben's Bites — bens.substack.com
- The Rundown AI — therundown.ai
- TLDR AI — tldr.tech/ai
- Superhuman Newsletter — itsuperhuman.co
- Import AI (Jack Clark) — importai.substack.com
- Lenny's Newsletter — lennysnewsletter.com

**APIs and Structured Sources**
- Product Hunt API — `/v2/posts?topic=artificial-intelligence`
- Hacker News API — topstories + keyword filter
- GitHub Trending — `github.com/trending`
- arXiv — `arxiv.org/search/?searchtype=cs.AI`

**Communities**
- r/artificial, r/ChatGPT, r/MachineLearning, r/SideProject, r/Entrepreneur

**Research & Reports**
- McKinsey Global Institute, Gartner Hype Cycle, Harvard Business Review, a16z State of AI

**Marketplaces (battle-tested use cases)**
- Fiverr AI category, Upwork AI jobs, G2 AI software

### Ingestion Pipeline

```
Source → Fetcher → Deduplicator → Extractor (Claude) → Enricher (Claude) → Scorer → Review Queue → Published
```

1. **Fetch** — Cron job pulls raw content per source (RSS, API, scrape)
2. **Deduplicate** — Hash title+URL; semantic similarity check against existing entries (skip if >0.92)
3. **Extract** — Claude Pass 1 structures raw content into a draft entry
4. **Enrich** — Claude Pass 2 fills detail page content, generates steps at all levels
5. **Score** — Compute profit_potential, complexity, initial trending_score
6. **Review Queue** — Status: `pending_review` → manual approve/reject → `published`

### Cron Schedule

| Frequency | Task |
|---|---|
| Every 1h | Fetch Product Hunt, HN new stories |
| Every 6h | Ingest newsletters (RSS) |
| Every 24h | Run Claude extraction on pending raw items |
| Every 24h | Recompute trending scores for all projects |
| Every 24h | Refresh relevancy scores for active users |
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
  id              uuid primary key default gen_random_uuid(),
  number          smallint unique not null,
  title           text not null,
  tagline         text,
  difficulty      text check (difficulty in ('Beginner','Intermediate','Advanced')),
  categories      text[],
  tools           text[],
  time_estimate   text,
  step_count      smallint,
  is_local        boolean default false,
  status          text default 'published',
  trending_score  float default 0,
  view_count      int default 0,
  save_count      int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
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
  id              uuid primary key default gen_random_uuid(),
  source          text,
  url             text,
  title           text,
  body            text,
  content_hash    text unique,
  status          text default 'pending',  -- pending | extracted | skipped | published
  skip_reason     text,
  project_id      uuid references projects(id),
  fetched_at      timestamptz default now()
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
