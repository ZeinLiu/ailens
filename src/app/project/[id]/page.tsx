"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { use } from "react";
import { PROJECTS, type Depth, type Difficulty, type Project } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase/client";

const DIFF_STYLES: Record<Difficulty, string> = {
  Beginner:     "text-[var(--blue)] border-[#c5d0f7] bg-[var(--blue-light)]",
  Intermediate: "text-[var(--amber)] border-[#f0d89a] bg-[var(--amber-light)]",
  Advanced:     "text-[var(--orange)] border-[#f5c9b5] bg-[var(--orange-light)]",
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hardcodedProject = PROJECTS.find(p => p.id === Number(id));

  const [dbProject, setDbProject] = useState<Project | null>(null);
  const [dbChecking, setDbChecking] = useState(!hardcodedProject);

  useEffect(() => {
    if (!hardcodedProject) {
      supabaseBrowser
        .from("pipeline_projects")
        .select("data")
        .filter("data->>id", "eq", id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.data) setDbProject(data.data as Project);
          setDbChecking(false);
        });
    }
  }, [hardcodedProject, id]);

  const project = hardcodedProject ?? dbProject;

  const [depth, setDepth] = useState<Depth>("beginner");
  const [tab, setTab] = useState<"what" | "build">("build");
  const [envOpen, setEnvOpen] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set([0]));
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [saved, setSaved] = useState(false);
  const [chatHistories, setChatHistories] = useState<Record<number, Array<{role: "user" | "assistant", content: string}>>>({});
  const [chatInputs, setChatInputs] = useState<Record<number, string>>({});
  const [chatLoading, setChatLoading] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!project) return;
    Promise.all([
      fetch(`/api/progress/${project.id}`).then(r => r.json()),
      fetch(`/api/saved/${project.id}`).then(r => r.json()),
    ]).then(([progress, savedData]) => {
      if (progress?.completed_steps) setDoneSteps(new Set(progress.completed_steps));
      if (progress?.depth) setDepth(progress.depth as Depth);
      if (savedData?.saved !== undefined) setSaved(savedData.saved);
    }).finally(() => setLoadingProgress(false));
  }, [project?.id]);

  const toggleSave = useCallback(async () => {
    setSaved(prev => !prev); // optimistic
    const res = await fetch(`/api/saved/${project?.id}`, { method: "POST" });
    const data = await res.json();
    if (data.saved !== undefined) setSaved(data.saved);
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

  if (!project && dbChecking) return <div className="px-8 py-16 text-[var(--muted-foreground)]">Loading…</div>;
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

  const askClaude = useCallback(async (i: number) => {
    if (!(chatInputs[i] ?? "").trim() || chatLoading !== null) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const userMsg = (chatInputs[i] ?? "").trim();
    setChatInputs(prev => ({ ...prev, [i]: "" }));
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
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const msg = res.status === 401 ? "Sign in to use Ask Claude." : "Something went wrong. Please try again.";
        setChatHistories(prev => ({ ...prev, [i]: [...(prev[i] ?? []), { role: "assistant" as const, content: msg }] }));
        return;
      }
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
      abortControllerRef.current = null;
      setChatLoading(null);
    }
  }, [chatInputs, chatLoading, chatHistories, steps, project, depth]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
          <button
            onClick={toggleSave}
            className={`border border-[var(--border)] px-5 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors ${saved ? "text-[var(--blue)] border-[var(--blue)]" : ""}`}
          >
            {saved ? "Saved ✓" : "Save"}
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
                            value={chatInputs[i] ?? ""}
                            onChange={e => setChatInputs(prev => ({ ...prev, [i]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askClaude(i); } }}
                            placeholder="Paste an error or describe where you're stuck…"
                            rows={2}
                            disabled={chatLoading !== null}
                            className="flex-1 resize-none font-mono text-[12px] border border-[var(--border)] rounded-md px-3 py-2 bg-white focus:outline-none focus:border-[var(--purple)] disabled:opacity-50"
                          />
                          <button
                            onClick={() => askClaude(i)}
                            disabled={chatLoading !== null || !(chatInputs[i] ?? "").trim()}
                            className="px-3 py-2 bg-[var(--purple)] text-white text-[12px] font-medium rounded-md hover:bg-[#4a40c4] disabled:opacity-50 shrink-0"
                          >
                            {chatLoading === i ? "…" : "Ask"}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
