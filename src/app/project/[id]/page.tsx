"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { use } from "react";
import { PROJECTS, type Depth, type Difficulty } from "@/lib/data";

const DIFF_STYLES: Record<Difficulty, string> = {
  Beginner:     "text-[var(--blue)] border-[#c5d0f7] bg-[var(--blue-light)]",
  Intermediate: "text-[var(--amber)] border-[#f0d89a] bg-[var(--amber-light)]",
  Advanced:     "text-[var(--orange)] border-[#f5c9b5] bg-[var(--orange-light)]",
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = PROJECTS.find(p => p.id === Number(id));

  const [depth, setDepth] = useState<Depth>("beginner");
  const [tab, setTab] = useState<"what" | "build">("build");
  const [envOpen, setEnvOpen] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([0]));
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    if (!project) return;
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
  }, [project?.id]);

  const toggleDone = useCallback(async (i: number) => {
    // Optimistic update
    setDoneSteps(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
    await fetch(`/api/progress/${project?.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepIndex: i, depth, totalSteps: project?.steps[depth].length ?? 0 }),
    });
  }, [project?.id, depth, project?.steps]);

  if (!project) return <div className="px-8 py-16 text-[var(--muted-foreground)]">Project not found.</div>;

  const steps = project.steps[depth];
  const total = steps.length;
  const done = doneSteps.size;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function toggleStep(i: number) {
    setOpenSteps(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  }
  async function copyPrompt(text: string, i: number) {
    await navigator.clipboard.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-2xl px-8 pb-20">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider py-5 hover:text-[var(--foreground)]">
        ← Back to Index
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3.5 mb-2.5 flex-wrap">
          <span className="font-mono text-3xl font-bold text-[var(--blue)]">{project.num}</span>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${DIFF_STYLES[project.difficulty]}`}>• {project.difficulty.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {project.tools.map(t => <span key={t} className="font-mono text-xs px-2 py-0.5 border border-[var(--border)] rounded bg-white">{t}</span>)}
          <span className="text-[var(--border)]">·</span>
          <span className="font-mono text-xs text-[var(--muted-foreground)]">{project.timeEstimate}</span>
          <span className="text-[var(--border)]">·</span>
          <span className="font-mono text-xs text-[var(--muted-foreground)]">{project.stepCount} steps</span>
        </div>
        {project.source && (
          <p className="font-mono text-[11px] text-[var(--muted-foreground)] mb-5">
            via{" "}
            {project.source.url
              ? <a href={project.source.url} target="_blank" rel="noopener noreferrer" className="text-[var(--blue)] hover:underline">{project.source.author}</a>
              : <span className="text-[var(--foreground)]">{project.source.author}</span>
            }
            {" "}· {project.source.platform}
          </p>
        )}
        <div className="flex gap-2.5">
          <button onClick={() => setTab("build")} className="bg-[var(--foreground)] text-[var(--background)] px-5 py-2.5 rounded-md text-sm font-medium hover:bg-[#333] flex items-center gap-1.5">
            Start Building →
          </button>
          <button className="border border-[var(--border)] px-5 py-2.5 rounded-md text-sm font-medium hover:bg-white">
            Save
          </button>
        </div>
      </div>

      {/* Depth switcher */}
      <div className="border border-[var(--border)] rounded-lg px-5 py-4 mb-5 bg-white">
        <p className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-2.5">Depth</p>
        <div className="flex gap-1 mb-2.5">
          {(["beginner","intermediate","advanced"] as Depth[]).map(d => (
            <button key={d} onClick={() => { setDepth(d); setDoneSteps(new Set()); setOpenSteps(new Set([0])); }}
              className={`text-sm px-3.5 py-1.5 rounded-md capitalize transition-colors ${depth === d ? "bg-[var(--background)] border border-[var(--border)] font-medium text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{project.depthDesc[depth]}</p>
      </div>

      {/* Step 0 — Environment Setup */}
      <div className="border border-[var(--border)] rounded-lg mb-7 overflow-hidden">
        <button
          onClick={() => setEnvOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-[var(--background)] transition-colors"
        >
          <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]">
            Environment Setup
          </span>
          <span className={`text-[var(--muted-foreground)] text-xs transition-transform duration-200 ${envOpen ? "rotate-180" : ""}`}>∨</span>
        </button>

        {envOpen && (
          <div className="border-t border-[var(--border)] px-5 py-4 space-y-4 bg-white">
            {project.envSetup.prerequisites.length > 0 && (
              <div className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider w-28 shrink-0 pt-0.5">Prerequisites</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.envSetup.prerequisites.map(p => (
                    <span key={p} className="font-mono text-xs px-2 py-0.5 border border-[var(--border)] rounded bg-[var(--background)]">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {project.envSetup.tools.length > 0 && (
              <div className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider w-28 shrink-0 pt-0.5">Install</span>
                <div className="space-y-2 flex-1">
                  {project.envSetup.tools.map(t => (
                    <div key={t.name}>
                      <code className="font-mono text-[12px] bg-[var(--background)] border border-[var(--border)] px-2 py-0.5 rounded block mb-0.5">{t.installCmd}</code>
                      <span className="text-[12px] text-[var(--muted-foreground)]">{t.purpose}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.envSetup.apiKeys.length > 0 && (
              <div className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider w-28 shrink-0 pt-0.5">API Keys</span>
                <div className="space-y-1.5">
                  {project.envSetup.apiKeys.map(k => (
                    <div key={k.name} className="text-[12px]">
                      <code className="font-mono text-[var(--blue)] mr-2">{k.name}</code>
                      <span className="text-[var(--muted-foreground)]">{k.where}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.envSetup.projectStructure && (
              <div className="flex gap-4">
                <span className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider w-28 shrink-0 pt-0.5">Structure</span>
                <pre className="font-mono text-[12px] text-[var(--muted-foreground)] leading-relaxed whitespace-pre">{project.envSetup.projectStructure}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content tabs */}
      <div className="flex border-b border-[var(--border)] mb-7">
        {(["what","build"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm py-2.5 mr-7 border-b-2 transition-colors capitalize ${tab === t ? "border-[var(--foreground)] text-[var(--foreground)] font-medium" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {t === "what" ? "What It Does" : "Build It"}
          </button>
        ))}
      </div>

      {/* WHAT IT DOES */}
      {tab === "what" && (
        <div className="space-y-8">
          <section>
            <p className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Overview</p>
            <p className="text-sm text-[#333] leading-relaxed">{project.overview}</p>
          </section>
          <section>
            <p className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Real-world uses</p>
            <div className="grid grid-cols-2 gap-2.5">
              {project.realWorldUses.map(u => (
                <div key={u.scenario} className="border border-[var(--border)] rounded-lg p-3.5 bg-white">
                  <p className="text-sm font-semibold mb-1">{u.scenario}</p>
                  <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed">{u.desc}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <p className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Pain points solved</p>
            <ul className="space-y-0 divide-y divide-[var(--border)]">
              {project.painPoints.map(p => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-[#333] py-2.5 leading-relaxed">
                  <span className="text-[var(--muted-foreground)] shrink-0">—</span>{p}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <p className="font-mono text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Who benefits</p>
            <div className="space-y-2">
              {project.whoBenefits.map(w => (
                <div key={w.role} className="flex gap-3 text-sm">
                  <span className="font-semibold w-32 shrink-0">{w.role}</span>
                  <span className="text-[var(--muted-foreground)]">{w.gain}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* BUILD IT */}
      {tab === "build" && (
        <div>
          {/* Progress */}
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-sm text-[var(--muted-foreground)]">Step {done} of {total}</span>
            <span className="font-mono text-sm text-[var(--muted-foreground)]">{pct}%</span>
          </div>
          <div className="h-0.5 bg-[var(--border)] rounded-full mb-7 overflow-hidden">
            <div className="h-full bg-[var(--blue)] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>

          {/* Steps */}
          <div className="divide-y divide-[var(--border)]">
            {steps.map((step, i) => {
              const isOpen = openSteps.has(i);
              const isDone = doneSteps.has(i);
              return (
                <div key={i}>
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

                  {isOpen && (
                    <div className="pb-6 pl-9 space-y-4">

                      {/* Meta row */}
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
                            onClick={() => copyPrompt(step.prompt.context + "\n\n" + step.prompt.instruction, i)}
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
          </div>

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
        </div>
      )}
    </div>
  );
}
