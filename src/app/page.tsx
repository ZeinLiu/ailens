"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PROJECTS, CATEGORIES, DIFFICULTIES, type Difficulty, type Category } from "@/lib/data";

const DIFF_STYLES: Record<Difficulty, string> = {
  Beginner:     "text-[var(--blue)] border-[#c5d0f7] bg-[var(--blue-light)]",
  Intermediate: "text-[var(--amber)] border-[#f0d89a] bg-[var(--amber-light)]",
  Advanced:     "text-[var(--orange)] border-[#f5c9b5] bg-[var(--orange-light)]",
};

export default function IndexPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | Category>("All");
  const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");

  const filtered = useMemo(() => PROJECTS.filter(p => {
    const catOk = category === "All" || p.categories.includes(category);
    const diffOk = difficulty === "All" || p.difficulty === difficulty;
    const q = search.toLowerCase();
    const searchOk = !q || p.title.toLowerCase().includes(q) || p.tools.join(" ").toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q);
    return catOk && diffOk && searchOk;
  }), [search, category, difficulty]);

  return (
    <div>
      {/* Hero */}
      <div className="px-8 pt-13 pb-9 max-w-3xl">
        <p className="font-mono text-xs text-[var(--blue)] uppercase tracking-widest mb-4">A working index of AI projects</p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight mb-7">
          Things you can build, run, and ship —<br />to actually understand how AI works.
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 border border-[var(--border)] rounded-md px-3.5 py-2 bg-white flex-1 max-w-md">
            <svg className="text-[var(--muted-foreground)] shrink-0" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search projects, tools, techniques"
              className="text-sm bg-transparent outline-none w-full placeholder:text-[var(--muted-foreground)]"
            />
          </div>
          <span className="font-mono text-sm text-[var(--muted-foreground)]">{String(filtered.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center px-8 border-b border-[var(--border)] overflow-x-auto">
        {(["All", ...CATEGORIES] as const).map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`text-sm px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${category === c ? "border-[var(--foreground)] text-[var(--foreground)] font-semibold" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex items-center px-8 py-2.5 border-b border-[var(--border)]">
        <span className="font-mono text-xs text-[var(--muted-foreground)] mr-6">
          {String(filtered.length).padStart(2, "0")} PROJECTS
        </span>
        {(["All", ...DIFFICULTIES] as const).map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`text-sm px-3 py-1 rounded transition-colors ${difficulty === d ? "font-bold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {d}
          </button>
        ))}
      </div>

      {/* Project list */}
      <div className="px-8 pb-16 max-w-3xl">
        {filtered.map(p => (
          <Link key={p.id} href={`/project/${p.id}`} className="group flex gap-6 py-7 border-b border-[var(--border)]">
            <span className="font-mono text-sm text-[var(--muted-foreground)] w-6 shrink-0 pt-0.5">{p.num}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="text-[17px] font-semibold tracking-tight group-hover:text-[var(--blue)] transition-colors">{p.title}</span>
                <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${DIFF_STYLES[p.difficulty]}`}>{p.difficulty}</span>
                {p.isLocal && <span className="font-mono text-[11px] text-[var(--green)] bg-[#edf7f2] border border-[#c2e8d2] px-1.5 py-0.5 rounded">local</span>}
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-3 leading-relaxed">{p.tagline}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {p.tools.map(t => (
                  <span key={t} className="font-mono text-xs px-2 py-0.5 border border-[var(--border)] rounded bg-white">{t}</span>
                ))}
                <span className="text-[var(--border)]">·</span>
                <span className="font-mono text-xs text-[var(--muted-foreground)]">{p.timeEstimate}</span>
                <span className="text-[var(--border)]">·</span>
                <span className="font-mono text-xs text-[var(--muted-foreground)]">{p.stepCount} steps</span>
              </div>
              {p.source && (
                <p className="font-mono text-[11px] text-[var(--muted-foreground)] mt-1.5">
                  via <span className="text-[var(--foreground)]">{p.source.author}</span> · {p.source.platform}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
