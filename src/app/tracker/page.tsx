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
