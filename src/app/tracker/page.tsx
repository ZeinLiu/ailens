"use client";
import { useState } from "react";
import Link from "next/link";
import { PROJECTS, DIFFICULTIES, type Difficulty } from "@/lib/data";

const TRACKER_DATA = {
  notStarted: [3, 7, 4],
  inProgress: [1, 5, 2],
  completed:  [8, 6],
  progress:   { 1: 3, 5: 4, 2: 2 } as Record<number, number>,
};

const DIFF_DOT: Record<Difficulty, string> = {
  Beginner:     "text-[var(--blue)]",
  Intermediate: "text-[var(--amber)]",
  Advanced:     "text-[var(--orange)]",
};

export default function TrackerPage() {
  const [filter, setFilter] = useState<"All" | Difficulty>("All");

  function filterIds(ids: number[]) {
    if (filter === "All") return ids;
    return ids.filter(id => PROJECTS.find(p => p.id === id)?.difficulty === filter);
  }

  const notStarted = filterIds(TRACKER_DATA.notStarted);
  const inProgress  = filterIds(TRACKER_DATA.inProgress);
  const completed   = filterIds(TRACKER_DATA.completed);

  function Card({ id, variant }: { id: number; variant: "notStarted" | "inProgress" | "completed" }) {
    const p = PROJECTS.find(x => x.id === id)!;
    const prog = TRACKER_DATA.progress[id] || 0;
    const pct = variant === "completed" ? 100 : Math.round((prog / p.stepCount) * 100);
    const barColor = variant === "completed" ? "bg-[var(--green-bar)]" : "bg-[var(--blue)]";
    const label = variant === "completed" ? `Complete · ${p.stepCount}/${p.stepCount}` : `Step ${prog} of ${p.stepCount}`;

    return (
      <Link href={`/project/${p.id}`} className="block border border-[var(--border)] rounded-lg px-4.5 py-4 bg-white hover:border-[#ccc] transition-colors mb-2.5">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <p className="font-mono text-xs text-[var(--muted-foreground)] mb-0.5">{p.num}</p>
            <p className="text-[15px] font-semibold">{p.title}</p>
          </div>
          <span className={`text-xs flex items-center gap-1 shrink-0 ml-3 ${DIFF_DOT[p.difficulty]}`}>• {p.difficulty}</span>
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
            <p className="font-mono text-[15px] font-bold leading-none">3 day streak</p>
            <p className="font-mono text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider mt-0.5">Keep it going</p>
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

      {/* Not Started */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border)]">
          <span className="font-mono text-[13px] font-bold">Not Started</span>
          <span className="font-mono text-[13px] text-[var(--muted-foreground)]">{String(notStarted.length).padStart(2,"0")}</span>
        </div>
        {notStarted.map(id => <Card key={id} id={id} variant="notStarted" />)}
        {notStarted.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">None at this level.</p>}
      </section>

      {/* In Progress */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border)]">
          <span className="font-mono text-[13px] font-bold text-[var(--blue)]">In Progress</span>
          <span className="font-mono text-[13px] text-[var(--muted-foreground)]">{String(inProgress.length).padStart(2,"0")}</span>
        </div>
        {inProgress.map(id => <Card key={id} id={id} variant="inProgress" />)}
        {inProgress.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">None at this level.</p>}
      </section>

      {/* Completed */}
      <section>
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--border)]">
          <span className="font-mono text-[13px] font-bold text-[var(--green)]">Completed</span>
          <span className="font-mono text-[13px] text-[var(--muted-foreground)]">{String(completed.length).padStart(2,"0")}</span>
        </div>
        {completed.map(id => <Card key={id} id={id} variant="completed" />)}
        {completed.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">None yet — start building!</p>}
      </section>
    </div>
  );
}
