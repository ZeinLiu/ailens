# Phase 2: Auth + Progress Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Supabase Auth (Google OAuth) + persist step progress, saves, and streaks to a database, replacing all mock/local state.

**Architecture:** Static TypeScript project data stays as-is. A Supabase Postgres database tracks per-user state (progress, saves, streaks) using the project's integer `id` as the foreign key. All auth is handled by Supabase Auth; sessions are maintained via httpOnly cookies refreshed in Next.js middleware.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, `@supabase/supabase-js`, `@supabase/ssr`, Supabase Postgres + Auth, Vercel Cron

## Global Constraints

- Next.js version is **16.2.9** — `cookies()` from `next/headers` is **async** (`await cookies()`), must be awaited everywhere
- All Supabase client creation in server context must use `@supabase/ssr`'s `createServerClient`, NOT `createClient`
- Browser client uses `@supabase/ssr`'s `createBrowserClient`
- Row-Level Security (RLS) enabled on all user tables — users can only read/write their own rows
- Middleware must NOT redirect on auth check — it only refreshes the session cookie (no forced login walls)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the env var names (public prefix required for browser client)
- Project IDs are **smallint** (1–9) matching `Project.id` in `src/lib/types.ts`

---

## File Map

**Create:**
- `src/lib/supabase/server.ts` — async factory for server-side Supabase client
- `src/lib/supabase/client.ts` — browser Supabase singleton
- `src/middleware.ts` — session cookie refresh on every request
- `src/app/auth/callback/route.ts` — OAuth PKCE code exchange
- `src/app/api/progress/[projectId]/route.ts` — GET progress, POST toggle step done
- `src/app/api/saved/[projectId]/route.ts` — GET is-saved, POST toggle save
- `src/app/api/tracker/route.ts` — GET all user progress rows
- `src/app/api/cron/streak/route.ts` — daily cron to reset lapsed streaks
- `vercel.json` — cron schedule

**Modify:**
- `src/components/nav.tsx` — show user avatar/email + sign out; "log in" triggers OAuth
- `src/app/project/[id]/page.tsx` — load initial progress from API, persist toggleDone + Save
- `src/app/tracker/page.tsx` — replace TRACKER_DATA mock with real API data + streak

---

### Task 1: Supabase project setup + DB schema

**Files:**
- No code files — Supabase schema applied via MCP tool

**Interfaces:**
- Produces: three tables (`user_progress`, `saved_projects`, `user_streaks`) with RLS policies

- [ ] **Step 1: Create Supabase project** (if not already created)

  Use the Supabase MCP `create_project` tool. Name it `ailens`. Note the project URL and anon key from the response. If a project already exists, use `list_projects` to find it.

- [ ] **Step 2: Apply migration — user_progress table**

  Use `apply_migration` with the following SQL:

  ```sql
  create table user_progress (
    user_id uuid references auth.users(id) on delete cascade,
    project_id smallint not null,
    depth text not null default 'beginner' check (depth in ('beginner','intermediate','advanced')),
    completed_steps smallint[] not null default '{}',
    status text not null default 'not_started'
      check (status in ('not_started','in_progress','completed')),
    started_at timestamptz,
    completed_at timestamptz,
    primary key (user_id, project_id)
  );

  alter table user_progress enable row level security;

  create policy "Users manage own progress"
    on user_progress for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  ```

- [ ] **Step 3: Apply migration — saved_projects table**

  ```sql
  create table saved_projects (
    user_id uuid references auth.users(id) on delete cascade,
    project_id smallint not null,
    saved_at timestamptz not null default now(),
    primary key (user_id, project_id)
  );

  alter table saved_projects enable row level security;

  create policy "Users manage own saves"
    on saved_projects for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  ```

- [ ] **Step 4: Apply migration — user_streaks table**

  ```sql
  create table user_streaks (
    user_id uuid references auth.users(id) on delete cascade primary key,
    current_streak smallint not null default 0,
    longest_streak smallint not null default 0,
    last_active_date date
  );

  alter table user_streaks enable row level security;

  create policy "Users manage own streak"
    on user_streaks for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  ```

- [ ] **Step 5: Enable Google OAuth in Supabase dashboard**

  In the Supabase dashboard → Authentication → Providers → Google:
  - Enable Google provider
  - Set redirect URL to: `http://localhost:3000/auth/callback` (dev) and your production URL + `/auth/callback`
  - Create a Google OAuth app at console.cloud.google.com → add Client ID + Secret in Supabase
  - Authorised redirect URI in Google: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`

- [ ] **Step 6: Create `.env.local`**

  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
  CRON_SECRET=<generate with: openssl rand -base64 32>
  ```

  `.env.local` is already in `.gitignore` — do not commit it.

- [ ] **Step 7: Verify tables exist**

  Use Supabase MCP `list_tables` — confirm `user_progress`, `saved_projects`, `user_streaks` are present.

---

### Task 2: Install packages + Supabase client helpers

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`

**Interfaces:**
- Produces:
  - `createSupabaseServer(): Promise<SupabaseClient>` — for Route Handlers and Server Components
  - `supabaseBrowser: SupabaseClient` — singleton for client components

- [ ] **Step 1: Install packages**

  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

  Expected: packages added to `package.json`, no errors.

- [ ] **Step 2: Create `src/lib/supabase/server.ts`**

  ```ts
  import { createServerClient } from "@supabase/ssr";
  import { cookies } from "next/headers";

  export async function createSupabaseServer() {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from a Server Component — cookie writes are no-ops here
            }
          },
        },
      }
    );
  }
  ```

- [ ] **Step 3: Create `src/lib/supabase/client.ts`**

  ```ts
  import { createBrowserClient } from "@supabase/ssr";

  export const supabaseBrowser = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

---

### Task 3: Middleware + OAuth callback route

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- Produces: session cookie refreshed on every request; OAuth code exchanged for session at `/auth/callback`

- [ ] **Step 1: Create `src/middleware.ts`**

  ```ts
  import { createServerClient } from "@supabase/ssr";
  import { NextResponse, type NextRequest } from "next/server";

  export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session — do NOT redirect based on auth state here
    await supabase.auth.getUser();
    return supabaseResponse;
  }

  export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  };
  ```

- [ ] **Step 2: Create `src/app/auth/callback/route.ts`**

  ```ts
  import { NextResponse } from "next/server";
  import { createSupabaseServer } from "@/lib/supabase/server";

  export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
      const supabase = await createSupabaseServer();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    return NextResponse.redirect(`${origin}/?error=auth`);
  }
  ```

- [ ] **Step 3: Start dev server and test**

  ```bash
  npm run dev
  ```

  Visit `http://localhost:3000` — app should load with no errors in the console.

- [ ] **Step 4: Commit**

  ```bash
  git add src/middleware.ts src/app/auth/callback/route.ts src/lib/supabase/server.ts src/lib/supabase/client.ts package.json package-lock.json
  git commit -m "feat: add Supabase clients, middleware, and OAuth callback"
  ```

---

### Task 4: Nav auth state — sign in / sign out

**Files:**
- Modify: `src/components/nav.tsx`

**Interfaces:**
- Consumes: `supabaseBrowser` from `src/lib/supabase/client.ts`
- Produces: nav shows "log in" (unauthenticated) or user email + "sign out" (authenticated)

- [ ] **Step 1: Rewrite `src/components/nav.tsx`**

  Replace the entire file:

  ```tsx
  "use client";
  import Link from "next/link";
  import { usePathname } from "next/navigation";
  import { useEffect, useState } from "react";
  import type { User } from "@supabase/supabase-js";
  import { supabaseBrowser } from "@/lib/supabase/client";

  export default function Nav() {
    const path = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      supabaseBrowser.auth.getUser().then(({ data }) => setUser(data.user));
      const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
        (_, session) => setUser(session?.user ?? null)
      );
      return () => subscription.unsubscribe();
    }, []);

    async function signIn() {
      await supabaseBrowser.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
    }

    async function signOut() {
      await supabaseBrowser.auth.signOut();
      setUser(null);
    }

    return (
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-13 border-b border-[var(--border)] bg-[var(--background)]">
        <Link href="/" className="font-bold text-base tracking-tight">AILens</Link>
        <div className="flex items-center gap-7 text-sm">
          <Link href="/" className={path === "/" ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}>Index</Link>
          <Link href="/tracker" className={path === "/tracker" ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}>Tracker</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-[var(--muted-foreground)] text-xs font-mono truncate max-w-[140px]">{user.email}</span>
              <button onClick={signOut} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">sign out</button>
            </div>
          ) : (
            <button onClick={signIn} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">log in</button>
          )}
        </div>
      </nav>
    );
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 3: Manual test**

  - Start dev server: `npm run dev`
  - Visit `http://localhost:3000`
  - Click "log in" — should redirect to Google OAuth
  - After auth, should redirect back to `/` with email shown in nav
  - Click "sign out" — nav should revert to "log in"

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/nav.tsx
  git commit -m "feat: add Google OAuth sign in/out to nav"
  ```

---

### Task 5: Progress API + wire to project detail page

**Files:**
- Create: `src/app/api/progress/[projectId]/route.ts`
- Modify: `src/app/project/[id]/page.tsx`

**Interfaces:**
- `GET /api/progress/[projectId]` → `{ completedSteps: number[], depth: string, status: string } | null`
- `POST /api/progress/[projectId]` body: `{ stepIndex: number, depth: string, totalSteps: number }` → `{ completedSteps: number[], status: string }`
- Consumes: `createSupabaseServer` from `src/lib/supabase/server.ts`

- [ ] **Step 1: Create `src/app/api/progress/[projectId]/route.ts`**

  ```ts
  import { NextResponse } from "next/server";
  import { createSupabaseServer } from "@/lib/supabase/server";

  export async function GET(
    _req: Request,
    { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(null);

    const { data } = await supabase
      .from("user_progress")
      .select("completed_steps, depth, status")
      .eq("user_id", user.id)
      .eq("project_id", Number(projectId))
      .single();

    return NextResponse.json(data ?? null);
  }

  export async function POST(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const { stepIndex, depth, totalSteps } = await req.json() as {
      stepIndex: number;
      depth: string;
      totalSteps: number;
    };

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch current row
    const { data: existing } = await supabase
      .from("user_progress")
      .select("completed_steps")
      .eq("user_id", user.id)
      .eq("project_id", Number(projectId))
      .single();

    const current: number[] = existing?.completed_steps ?? [];
    const isCurrentlyDone = current.includes(stepIndex);
    const updatedSteps = isCurrentlyDone
      ? current.filter((s) => s !== stepIndex)
      : [...current, stepIndex];

    const allDone = updatedSteps.length === totalSteps;
    const status = allDone
      ? "completed"
      : updatedSteps.length > 0
      ? "in_progress"
      : "not_started";

    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          project_id: Number(projectId),
          depth,
          completed_steps: updatedSteps,
          status,
          started_at: updatedSteps.length > 0 ? now : null,
          completed_at: allDone ? now : null,
        },
        { onConflict: "user_id,project_id" }
      )
      .select("completed_steps, status")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update streak
    await upsertStreak(supabase, user.id);

    return NextResponse.json(updated);
  }

  async function upsertStreak(
    supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServer>>,
    userId: string
  ) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: streak } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, last_active_date")
      .eq("user_id", userId)
      .single();

    const last = streak?.last_active_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let current = streak?.current_streak ?? 0;
    if (last === today) {
      return; // already counted today
    } else if (last === yesterday) {
      current += 1;
    } else {
      current = 1; // streak broken
    }

    const longest = Math.max(current, streak?.longest_streak ?? 0);

    await supabase.from("user_streaks").upsert(
      { user_id: userId, current_streak: current, longest_streak: longest, last_active_date: today },
      { onConflict: "user_id" }
    );
  }
  ```

- [ ] **Step 2: Update `src/app/project/[id]/page.tsx` — add progress loading and persistence**

  At the top of the file, add the import:
  ```ts
  import { useEffect, useCallback } from "react";
  ```
  (merge with existing `import { useState } from "react"` → `import { useState, useEffect, useCallback } from "react"`)

  After the existing state declarations (after line 22 `const [copied, setCopied]`), add:
  ```ts
  const [loadingProgress, setLoadingProgress] = useState(true);
  ```

  Replace the existing `useEffect`-less mount by adding a `useEffect` block after the state declarations:
  ```ts
  useEffect(() => {
    fetch(`/api/progress/${project.id}`)
      .then(r => r.json())
      .then(data => {
        if (data?.completed_steps) {
          setDoneSteps(new Set(data.completed_steps));
        }
        if (data?.depth) {
          setDepth(data.depth as Depth);
        }
      })
      .finally(() => setLoadingProgress(false));
  }, [project.id]);
  ```

  Replace the `toggleDone` function (lines 35-37) with:
  ```ts
  const toggleDone = useCallback(async (i: number) => {
    // Optimistic update
    setDoneSteps(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
    await fetch(`/api/progress/${project.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepIndex: i, depth, totalSteps: steps.length }),
    });
  }, [project.id, depth, steps.length]);
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 4: Manual test**

  - Sign in via nav
  - Open any project page → mark step 1 as done
  - Refresh the page → step 1 should still be shown as done
  - Sign out, sign back in → step still persists

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/progress src/app/project
  git commit -m "feat: persist step progress to Supabase with streak upsert"
  ```

---

### Task 6: Save/unsave API + wire Save button

**Files:**
- Create: `src/app/api/saved/[projectId]/route.ts`
- Modify: `src/app/project/[id]/page.tsx`

**Interfaces:**
- `GET /api/saved/[projectId]` → `{ saved: boolean }`
- `POST /api/saved/[projectId]` → `{ saved: boolean }` (toggles)
- Consumes: `createSupabaseServer`

- [ ] **Step 1: Create `src/app/api/saved/[projectId]/route.ts`**

  ```ts
  import { NextResponse } from "next/server";
  import { createSupabaseServer } from "@/lib/supabase/server";

  export async function GET(
    _req: Request,
    { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ saved: false });

    const { data } = await supabase
      .from("saved_projects")
      .select("project_id")
      .eq("user_id", user.id)
      .eq("project_id", Number(projectId))
      .single();

    return NextResponse.json({ saved: !!data });
  }

  export async function POST(
    _req: Request,
    { params }: { params: Promise<{ projectId: string }> }
  ) {
    const { projectId } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase
      .from("saved_projects")
      .select("project_id")
      .eq("user_id", user.id)
      .eq("project_id", Number(projectId))
      .single();

    if (existing) {
      await supabase
        .from("saved_projects")
        .delete()
        .eq("user_id", user.id)
        .eq("project_id", Number(projectId));
      return NextResponse.json({ saved: false });
    } else {
      await supabase
        .from("saved_projects")
        .insert({ user_id: user.id, project_id: Number(projectId) });
      return NextResponse.json({ saved: true });
    }
  }
  ```

- [ ] **Step 2: Add saved state to `src/app/project/[id]/page.tsx`**

  Add to the state declarations block:
  ```ts
  const [saved, setSaved] = useState(false);
  ```

  Extend the existing `useEffect` (from Task 5) to also fetch saved state — replace the fetch block:
  ```ts
  useEffect(() => {
    Promise.all([
      fetch(`/api/progress/${project.id}`).then(r => r.json()),
      fetch(`/api/saved/${project.id}`).then(r => r.json()),
    ]).then(([progress, savedData]) => {
      if (progress?.completed_steps) setDoneSteps(new Set(progress.completed_steps));
      if (progress?.depth) setDepth(progress.depth as Depth);
      if (savedData?.saved !== undefined) setSaved(savedData.saved);
    }).finally(() => setLoadingProgress(false));
  }, [project.id]);
  ```

  Add a `toggleSave` function after `toggleDone`:
  ```ts
  const toggleSave = useCallback(async () => {
    setSaved(prev => !prev); // optimistic
    const res = await fetch(`/api/saved/${project.id}`, { method: "POST" });
    const data = await res.json();
    if (data.saved !== undefined) setSaved(data.saved);
  }, [project.id]);
  ```

  Replace the Save button (line 77–79 in the original, the `<button className="border...">Save</button>`):
  ```tsx
  <button
    onClick={toggleSave}
    className={`border border-[var(--border)] px-5 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors ${saved ? "text-[var(--blue)] border-[var(--blue)]" : ""}`}
  >
    {saved ? "Saved ✓" : "Save"}
  </button>
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Manual test**

  - Sign in, open a project, click "Save" → button shows "Saved ✓"
  - Refresh page → button still shows "Saved ✓"
  - Click again → reverts to "Save"

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/saved src/app/project
  git commit -m "feat: save/unsave projects with persistence"
  ```

---

### Task 7: Tracker page — real data + streak display

**Files:**
- Create: `src/app/api/tracker/route.ts`
- Modify: `src/app/tracker/page.tsx`

**Interfaces:**
- `GET /api/tracker` → `{ progress: { project_id: number, completed_steps: number[], status: string, depth: string }[], streak: { current_streak: number, longest_streak: number } | null }`
- Consumes: `createSupabaseServer`, `PROJECTS` from `src/lib/data`

- [ ] **Step 1: Create `src/app/api/tracker/route.ts`**

  ```ts
  import { NextResponse } from "next/server";
  import { createSupabaseServer } from "@/lib/supabase/server";

  export async function GET() {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ progress: [], streak: null });

    const [{ data: progress }, { data: streak }] = await Promise.all([
      supabase
        .from("user_progress")
        .select("project_id, completed_steps, status, depth")
        .eq("user_id", user.id),
      supabase
        .from("user_streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", user.id)
        .single(),
    ]);

    return NextResponse.json({ progress: progress ?? [], streak: streak ?? null });
  }
  ```

- [ ] **Step 2: Rewrite `src/app/tracker/page.tsx`**

  Replace the entire file:

  ```tsx
  "use client";
  import { useState, useEffect, useMemo } from "react";
  import Link from "next/link";
  import { PROJECTS, DIFFICULTIES, type Difficulty } from "@/lib/data";

  type ProgressRow = {
    project_id: number;
    completed_steps: number[];
    status: string;
    depth: string;
  };

  const DIFF_DOT: Record<Difficulty, string> = {
    Beginner:     "text-[var(--blue)]",
    Intermediate: "text-[var(--amber)]",
    Advanced:     "text-[var(--orange)]",
  };

  export default function TrackerPage() {
    const [filter, setFilter] = useState<"All" | Difficulty>("All");
    const [progress, setProgress] = useState<ProgressRow[]>([]);
    const [streak, setStreak] = useState<{ current_streak: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch("/api/tracker")
        .then(r => r.json())
        .then(({ progress, streak }) => {
          setProgress(progress);
          setStreak(streak);
        })
        .finally(() => setLoading(false));
    }, []);

    const progressMap = useMemo(
      () => Object.fromEntries(progress.map(p => [p.project_id, p])),
      [progress]
    );

    const inProgress = PROJECTS.filter(p =>
      progressMap[p.id]?.status === "in_progress" &&
      (filter === "All" || p.difficulty === filter)
    );
    const completed = PROJECTS.filter(p =>
      progressMap[p.id]?.status === "completed" &&
      (filter === "All" || p.difficulty === filter)
    );
    const notStarted = PROJECTS.filter(p =>
      !progressMap[p.id] || progressMap[p.id].status === "not_started"
    ).filter(p => filter === "All" || p.difficulty === filter);

    function Card({ project, variant }: { project: typeof PROJECTS[0]; variant: "notStarted" | "inProgress" | "completed" }) {
      const row = progressMap[project.id];
      const doneCount = row?.completed_steps?.length ?? 0;
      const pct = variant === "completed" ? 100 : Math.round((doneCount / project.stepCount) * 100);
      const barColor = variant === "completed" ? "bg-[var(--green-bar)]" : "bg-[var(--blue)]";
      const label = variant === "completed"
        ? `Complete · ${project.stepCount}/${project.stepCount}`
        : `Step ${doneCount} of ${project.stepCount}`;

      return (
        <Link href={`/project/${project.id}`} className="block border border-[var(--border)] rounded-lg px-4.5 py-4 bg-white hover:border-[#ccc] transition-colors mb-2.5">
          <div className="flex items-start justify-between mb-2.5">
            <div>
              <p className="font-mono text-xs text-[var(--muted-foreground)] mb-0.5">{project.num}</p>
              <p className="text-[15px] font-semibold">{project.title}</p>
            </div>
            <span className={`text-xs flex items-center gap-1 shrink-0 ml-3 ${DIFF_DOT[project.difficulty]}`}>• {project.difficulty}</span>
          </div>
          <div className="h-0.5 bg-[var(--border)] rounded-full mb-2 overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <p className="font-mono text-xs text-[var(--muted-foreground)]">{label}</p>
        </Link>
      );
    }

    return (
      <div className="max-w-2xl px-8 pb-20">
        {/* Header */}
        <div className="pt-10 pb-7">
          <p className="font-mono text-[11px] text-[var(--blue)] uppercase tracking-widest mb-2.5">Learning Tracker</p>
          <h1 className="text-3xl font-bold tracking-tight mb-5">Your build queue, in motion.</h1>
          <div className="inline-flex items-center gap-3 border border-[var(--border)] rounded-lg px-4 py-2.5 bg-white mb-6">
            <span className="text-xl">🔥</span>
            <div>
              <p className="font-mono text-[15px] font-bold leading-none">
                {loading ? "—" : streak ? `${streak.current_streak} day streak` : "0 day streak"}
              </p>
              <p className="font-mono text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider mt-0.5">
                {streak?.current_streak ? "Keep it going" : "Mark a step done to start"}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-0 border-b border-[var(--border)] pb-3">
            <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase mr-4">Difficulty</span>
            {(["All", ...DIFFICULTIES] as const).map(d => (
              <button key={d} onClick={() => setFilter(d)}
                className={`text-sm px-3.5 py-1 transition-colors ${filter === d ? "font-bold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : (
          <>
            {/* In Progress */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border)]">
                <span className="font-mono text-[13px] font-bold text-[var(--blue)]">In Progress</span>
                <span className="font-mono text-[13px] text-[var(--muted-foreground)]">{String(inProgress.length).padStart(2,"0")}</span>
              </div>
              {inProgress.map(p => <Card key={p.id} project={p} variant="inProgress" />)}
              {inProgress.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">None at this level.</p>}
            </section>

            {/* Not Started */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border)]">
                <span className="font-mono text-[13px] font-bold">Not Started</span>
                <span className="font-mono text-[13px] text-[var(--muted-foreground)]">{String(notStarted.length).padStart(2,"0")}</span>
              </div>
              {notStarted.map(p => <Card key={p.id} project={p} variant="notStarted" />)}
              {notStarted.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">None at this level.</p>}
            </section>

            {/* Completed */}
            <section>
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border)]">
                <span className="font-mono text-[13px] font-bold text-[var(--green)]">Completed</span>
                <span className="font-mono text-[13px] text-[var(--muted-foreground)]">{String(completed.length).padStart(2,"0")}</span>
              </div>
              {completed.map(p => <Card key={p.id} project={p} variant="completed" />)}
              {completed.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">None yet — start building!</p>}
            </section>
          </>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 4: Manual test**

  - Sign in, mark steps done on two different projects
  - Visit `/tracker` — should see those projects in "In Progress" with correct step counts
  - Mark all steps done on one project → should appear in "Completed"
  - Streak badge should show "1 day streak" after first step done

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/tracker src/app/tracker
  git commit -m "feat: wire tracker page to real Supabase data"
  ```

---

### Task 8: Streak cron + Vercel cron config

**Files:**
- Create: `src/app/api/cron/streak/route.ts`
- Create: `vercel.json`

**Interfaces:**
- `GET /api/cron/streak` — protected by `CRON_SECRET`, resets `current_streak` to 0 for users whose `last_active_date < today - 1 day`
- Runs daily at 02:00 UTC via Vercel Cron

- [ ] **Step 1: Create `src/app/api/cron/streak/route.ts`**

  ```ts
  import { NextResponse } from "next/server";
  import { createClient } from "@supabase/supabase-js";

  export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role to bypass RLS for the cron job
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Reset streaks for users who weren't active yesterday or today
    const { error } = await supabase
      .from("user_streaks")
      .update({ current_streak: 0 })
      .lt("last_active_date", yesterday);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  }
  ```

- [ ] **Step 2: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`**

  Find the service role key in the Supabase dashboard → Project Settings → API → service_role key (keep secret, never expose to browser):

  ```bash
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  ```

- [ ] **Step 3: Create `vercel.json`**

  ```json
  {
    "crons": [
      {
        "path": "/api/cron/streak",
        "schedule": "0 2 * * *"
      }
    ]
  }
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 5: Manual test of cron endpoint**

  With dev server running:

  ```bash
  curl -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)" \
    http://localhost:3000/api/cron/streak
  ```

  Expected response: `{"ok":true}`

  Without auth header:
  ```bash
  curl http://localhost:3000/api/cron/streak
  ```
  Expected: `{"error":"Unauthorized"}` with 401.

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/api/cron vercel.json
  git commit -m "feat: add daily streak-reset cron route and Vercel cron config"
  ```

---

## Verification checklist

After all tasks complete, verify end-to-end:

- [ ] Sign in via Google OAuth → session persists across page reloads
- [ ] Mark steps done on a project → progress persists after sign out + sign back in
- [ ] Tracker shows correct In Progress / Completed bucketing with real step counts
- [ ] Streak increments after first step done; shows on tracker page
- [ ] Save button on project page toggles and persists
- [ ] Sign out → tracker shows empty state (loading resolves to no data)
- [ ] Cron endpoint returns 401 without auth, 200 with correct `CRON_SECRET`
