import { useEffect, useMemo, useRef, useState } from "react";

import { PageCard } from "../components/shared/PageCard";
import { PageTitleBlock } from "../components/shared/PageTitleBlock";
import { api } from "../lib/api";
import { assets } from "../lib/assets";
import type { DiagramEnvelope, TraceEnvelope } from "../lib/types";

type Tone = "gold" | "blue" | "green" | "amber" | "red";

type ReplayState = {
  activeStepIndex: number;
  completedStepIndexes: number[];
  activeNodeId: string | null;
  activeEdgeIds: string[];
  running: boolean;
};

function toneUi(tone: Tone | undefined) {
  switch (tone) {
    case "blue":
      return { border: "border-sky-300/35", text: "text-sky-100", glow: "shadow-[0_0_24px_rgba(56,189,248,0.18)]" };
    case "green":
      return { border: "border-emerald-300/35", text: "text-emerald-100", glow: "shadow-[0_0_24px_rgba(16,185,129,0.18)]" };
    case "amber":
      return { border: "border-amber-300/35", text: "text-amber-100", glow: "shadow-[0_0_24px_rgba(251,191,36,0.16)]" };
    case "red":
      return { border: "border-red-300/35", text: "text-red-100", glow: "shadow-[0_0_24px_rgba(239,68,68,0.16)]" };
    case "gold":
    default:
      return { border: "border-pal-gold/35", text: "text-pal-text", glow: "shadow-[0_0_24px_rgba(232,178,58,0.18)]" };
  }
}

function resolveImagePath(imageKey?: string) {
  if (!imageKey) return null;
  const [group, ...rest] = imageKey.split("/");
  const file = rest.join("/");
  if (!group || !file) return null;
  if (group === "ui") {
    const uiMap: Record<string, string> = {
      "palantir-orb.png": assets.ui.palantirOrb,
      "header-logo.png": assets.ui.headerLogo,
      "architecture-bg.png": assets.ui.architectureBg,
      "map-bg.png": assets.ui.mapBg,
      "parchment-texture.png": assets.ui.parchmentTexture
    };
    return uiMap[file] ?? null;
  }
  const bucket = (assets as unknown as Record<string, Record<string, string>>)[group];
  if (!bucket) return `/images/${imageKey}`;
  const key = file.replace(".png", "").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return bucket[key] ?? `/images/${imageKey}`;
}

function formatPath(points?: Array<[number, number]>) {
  if (!points?.length) return "";
  const [first, ...rest] = points;
  return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(" ")}`;
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ArchitecturePage() {
  const [diagram, setDiagram] = useState<DiagramEnvelope | null>(null);
  const [trace, setTrace] = useState<TraceEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState<ReplayState>({
    activeStepIndex: -1,
    completedStepIndexes: [],
    activeNodeId: null,
    activeEdgeIds: [],
    running: false
  });
  const [showTraceJson, setShowTraceJson] = useState(false);

  const replayRunRef = useRef(0);

  useEffect(() => {
    void api.architecture
      .diagram()
      .then((r) => setDiagram(r.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Falha no diagrama"));
  }, []);

  useEffect(() => {
    return () => {
      replayRunRef.current += 1;
    };
  }, []);

  const nodeById = useMemo(
    () =>
      new Map(
        (diagram?.nodes ?? []).map((node) => [
          node.id,
          {
            ...node,
            x_pct: node.x_pct ?? 0,
            y_pct: node.y_pct ?? 0,
            width_pct: node.width_pct ?? 18
          }
        ])
      ),
    [diagram]
  );

  const traceStepKeySet = useMemo(() => new Set(replay.completedStepIndexes.concat(replay.activeStepIndex).filter((idx) => idx >= 0)), [replay]);

  const startReplay = async () => {
    setError(null);
    replayRunRef.current += 1;
    const runId = replayRunRef.current;
    setReplay({
      activeStepIndex: -1,
      completedStepIndexes: [],
      activeNodeId: null,
      activeEdgeIds: [],
      running: true
    });

    try {
      const res = await api.architecture.trace();
      if (replayRunRef.current != runId) return;
      setTrace(res.data);

      const reduced = prefersReducedMotion();
      const completed: number[] = [];
      for (let i = 0; i < res.data.steps.length; i += 1) {
        const step = res.data.steps[i];
        if (replayRunRef.current != runId) return;
        setReplay({
          activeStepIndex: i,
          completedStepIndexes: [...completed],
          activeNodeId: step.node_id ?? null,
          activeEdgeIds: step.edge_ids ?? [],
          running: true
        });
        const delay = reduced ? 180 : Math.min(900, Math.max(320, step.latency_ms * 28));
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        completed.push(i);
      }
      if (replayRunRef.current != runId) return;
      setReplay((prev) => ({
        ...prev,
        running: false,
        completedStepIndexes: traceStepKeySet.size ? prev.completedStepIndexes : prev.completedStepIndexes,
        activeStepIndex: -1,
        activeNodeId: null,
        activeEdgeIds: []
      }));
    } catch (err) {
      if (replayRunRef.current != runId) return;
      setReplay({ activeStepIndex: -1, completedStepIndexes: [], activeNodeId: null, activeEdgeIds: [], running: false });
      setError(err instanceof Error ? err.message : "Falha no trace");
    }
  };

  const traceSteps = trace?.steps ?? [];
  const activeStep = replay.activeStepIndex >= 0 ? traceSteps[replay.activeStepIndex] : null;
  const activeStepTone = toneUi((activeStep?.tone as Tone | undefined) ?? "gold");

  const legend = [
    ["gateway", "Nginx ingress", "gold"],
    ["app", "FastAPI core", "green"],
    ["cache", "Redis memory", "green"],
    ["db", "Postgres persistence", "blue"],
    ["broker", "Beacon relay", "amber"],
    ["worker", "Eagles worker", "amber"]
  ] as const;

  return (
    <div className="space-y-5">
      <PageTitleBlock
        eyebrow="Command Map"
        title="Arquitetura"
        subtitle="Diagrama de fluxo e replay do request. Cada etapa acende nós e arestas para mostrar o caminho do sistema."
        accent="gold"
      >
        <div className="flex flex-wrap gap-2 text-xs">
          {legend.map(([key, label, tone]) => (
            <span
              key={key}
              className={`rounded-full border bg-black/20 px-2.5 py-1 backdrop-blur-sm ${toneUi(tone as Tone).border} ${toneUi(tone as Tone).text}`}
            >
              {label}
            </span>
          ))}
        </div>
      </PageTitleBlock>

      <section className="relative overflow-hidden rounded-2xl border border-pal-gold/10 bg-gradient-to-b from-black/35 via-black/20 to-black/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_38%,rgba(232,178,58,0.05),transparent_44%),radial-gradient(circle_at_78%_18%,rgba(56,189,248,0.04),transparent_40%)]" />
        <div className="relative p-3">
          <div className="relative min-h-[660px] overflow-hidden rounded-2xl border border-pal-gold/10 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_18px_40px_rgba(0,0,0,0.28)]">
            <img
              src={assets.ui.architectureBg}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-[center_35%] opacity-62"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_40%,rgba(232,178,58,0.12),transparent_46%),radial-gradient(circle_at_76%_20%,rgba(56,189,248,0.08),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.50))]" />

            {diagram ? (
              <>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  <defs>
                    <filter id="traceGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="0.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {diagram.edges.map((edge) => {
                    const d = formatPath(edge.path);
                    const isActive = replay.activeEdgeIds.includes(edge.id);
                    const isCompleted = traceSteps.some((step, idx) => replay.completedStepIndexes.includes(idx) && (step.edge_ids ?? []).includes(edge.id));
                    const tone = toneUi((edge.tone as Tone | undefined) ?? "gold");
                    const stroke = edge.tone === "blue" ? "#7dd3fc" : edge.tone === "green" ? "#6ee7b7" : edge.tone === "amber" ? "#fbbf24" : "#e8b23a";
                    return (
                      <path
                        key={edge.id}
                        d={d}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={isActive ? 0.55 : isCompleted ? 0.42 : 0.28}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={isActive ? 0.95 : isCompleted ? 0.55 : 0.28}
                        className={isActive ? "animate-pulse" : ""}
                        filter={isActive ? "url(#traceGlow)" : undefined}
                        style={{ transition: "all 220ms ease" }}
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-0">
                  {diagram.nodes.map((node) => {
                    const isActive = replay.activeNodeId === node.id;
                    const isCompleted = traceSteps.some((step, idx) => replay.completedStepIndexes.includes(idx) && step.node_id === node.id);
                    const tone = toneUi((node.tone as Tone | undefined) ?? "gold");
                    const imagePath = resolveImagePath(node.image_key);
                    const widthPct = node.width_pct ?? 18;
                    const renderMode = node.render_mode ?? "image";
                    const accentPath = resolveImagePath(node.accent_image_key);
                    return (
                      <div
                        key={node.id}
                        className="absolute"
                        style={{ left: `${node.x_pct ?? 0}%`, top: `${node.y_pct ?? 0}%`, width: `${widthPct}%` }}
                      >
                        <div className="relative">
                          <div
                            className={[
                              "relative flex min-h-[88px] items-center justify-center transition-all duration-300",
                              isActive
                                ? `${tone.glow}`
                                : isCompleted
                                  ? "shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                                  : ""
                            ].join(" ")}
                          >
                            <div
                              className={[
                                "relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border bg-black/30 shadow-[0_12px_28px_rgba(0,0,0,0.28)]",
                                tone.border,
                                isActive ? "ring-2 ring-white/10" : isCompleted ? "ring-1 ring-white/5" : ""
                              ].join(" ")}
                            >
                              {renderMode === "emblem" ? (
                                <>
                                  <div className="absolute inset-0 opacity-30">
                                    <img src={assets.ui.parchmentTexture} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/18 via-black/25 to-sky-400/14" />
                                  {imagePath ? <img src={imagePath} alt="" aria-hidden="true" className="relative z-10 h-10 w-10 rounded-full bg-black/35 p-1" /> : null}
                                </>
                              ) : (
                                <>
                                  {imagePath ? <img src={imagePath} alt="" aria-hidden="true" className="h-full w-full object-cover object-center opacity-92" /> : <div className="h-full w-full bg-black/20" />}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                                </>
                              )}
                            </div>

                            {node.id === "worker" && accentPath ? (
                              <div className="absolute left-1/2 top-0 -translate-y-1/3 translate-x-4 rounded border border-pal-gold/15 bg-black/30 p-0.5">
                                <img src={accentPath} alt="" aria-hidden="true" className="h-4 w-6 rounded object-cover opacity-85" />
                              </div>
                            ) : null}

                            {renderMode === "emblem" ? (
                              <div className="absolute left-1/2 top-1/2 ml-14 -translate-y-1/2 rounded-md border border-emerald-300/20 bg-black/35 px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-100">
                                App Core
                              </div>
                            ) : null}
                          </div>

                          <div
                            className={[
                              "mt-1.5 rounded-md border px-2 py-1 text-[11px] leading-tight transition-all duration-300",
                              "bg-black/55",
                              tone.border,
                              isActive ? `${tone.text} ${tone.glow}` : isCompleted ? "text-pal-text" : "text-pal-text/95"
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold">{node.label}</div>
                              {node.port ? (
                                <span className="rounded-full border border-white/10 bg-black/25 px-1.5 py-0.5 text-[9px] text-pal-text/85">
                                  {node.port}
                                </span>
                              ) : null}
                            </div>
                            {node.sublabel ? <div className="text-[10px] opacity-80">{node.sublabel}</div> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-pal-muted">Carregando diagrama...</div>
            )}
          </div>
        </div>
      </section>

      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pal-gold/70">Request Trace</p>
            <h2 className="text-xl font-semibold">Replay do Caminho do Request</h2>
            <p className="text-sm text-pal-muted">Cada etapa acende nós e arestas; o painel abaixo detalha serviço, porta e latência.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void startReplay()}
              disabled={replay.running}
              className="rounded-lg border border-pal-gold/20 bg-pal-panel/80 px-4 py-2 text-sm hover:bg-pal-panel disabled:opacity-60"
            >
              {replay.running ? "Reproduzindo..." : "Trace a Request"}
            </button>
            <button
              type="button"
              onClick={() => setShowTraceJson((v) => !v)}
              className={`rounded-md border px-3 py-2 text-xs ${showTraceJson ? "border-pal-blue/25 bg-pal-blue/10 text-pal-blue" : "border-pal-gold/15 hover:bg-black/20"}`}
            >
              {showTraceJson ? "Ocultar JSON" : "Ver JSON"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-pal-red">{error}</p> : null}

        {trace ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-pal-muted">
              <span className="rounded-full border border-pal-gold/10 bg-black/15 px-2.5 py-1">trace: {trace.trace_id}</span>
              <span className="rounded-full border border-pal-gold/10 bg-black/15 px-2.5 py-1">total: {trace.total_latency_ms}ms</span>
              {activeStep ? (
                <span className={`rounded-full border bg-black/15 px-2.5 py-1 ${activeStepTone.border} ${activeStepTone.text}`}>
                  ativa: {activeStep.order}. {activeStep.phase_label ?? activeStep.step}
                </span>
              ) : (
                <span className="rounded-full border border-pal-gold/10 bg-black/15 px-2.5 py-1">pronto para replay</span>
              )}
            </div>

            <div className="rounded-xl border border-pal-gold/10 bg-black/20 p-3">
              <div className="grid gap-3 md:grid-cols-[repeat(7,minmax(0,1fr))]">
                {trace.steps.map((step, idx) => {
                  const isActive = replay.activeStepIndex === idx;
                  const isCompleted = replay.completedStepIndexes.includes(idx);
                  const tone = toneUi((step.tone as Tone | undefined) ?? "gold");
                  return (
                    <div key={step.order} className="relative">
                      {idx < trace.steps.length - 1 ? (
                        <div className="absolute left-[55%] top-3 hidden h-0.5 w-[90%] md:block">
                          <div
                            className={[
                              "h-full rounded-full transition-all duration-300",
                              isCompleted ? "bg-pal-gold/60" : "bg-pal-gold/15",
                              isActive ? "animate-pulse bg-pal-gold/80" : ""
                            ].join(" ")}
                          />
                        </div>
                      ) : null}
                      <div
                        className={[
                          "relative rounded-lg border bg-black/25 p-2 text-xs transition-all duration-200",
                          isActive ? `${tone.border} ${tone.glow} ring-1 ring-white/10` : isCompleted ? "border-pal-gold/20" : "border-pal-gold/10"
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "grid h-5 w-5 place-items-center rounded-full border text-[10px] font-semibold",
                              isActive ? `${tone.border} ${tone.text} animate-pulse` : isCompleted ? "border-pal-gold/20 text-pal-gold" : "border-pal-gold/10 text-pal-muted"
                            ].join(" ")}
                          >
                            {step.order}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-pal-text">{step.service}</div>
                            <div className="truncate text-[10px] text-pal-muted">{step.phase_label ?? step.step}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="rounded-xl border border-pal-gold/10 bg-black/20 p-3">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-pal-gold/70">Step Details</div>
                <ol className="space-y-2">
                  {trace.steps.map((step, idx) => {
                    const isActive = replay.activeStepIndex === idx;
                    const isCompleted = replay.completedStepIndexes.includes(idx);
                    const tone = toneUi((step.tone as Tone | undefined) ?? "gold");
                    return (
                      <li
                        key={step.order}
                        className={[
                          "rounded-lg border px-3 py-2 text-sm transition-all duration-200",
                          isActive
                            ? `${tone.border} bg-black/35 ${tone.glow} ring-1 ring-white/10`
                            : isCompleted
                              ? "border-pal-gold/15 bg-black/20"
                              : "border-pal-gold/10 bg-black/10"
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium text-pal-text">
                            {step.order}. {step.service} <span className="text-pal-muted">({step.phase_label ?? step.step})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {step.port ? <span className="rounded-full border border-pal-gold/10 bg-black/15 px-2 py-0.5">port {step.port}</span> : null}
                            <span className="rounded-full border border-pal-gold/10 bg-black/15 px-2 py-0.5">{step.latency_ms}ms</span>
                            {step.cache_event ? <span className="rounded-full border border-emerald-300/20 bg-emerald-400/5 px-2 py-0.5">cache {step.cache_event}</span> : null}
                            {step.worker_pid ? <span className="rounded-full border border-pal-gold/10 bg-black/15 px-2 py-0.5">pid {step.worker_pid}</span> : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-xl border border-pal-gold/10 bg-black/20 p-3">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-pal-gold/70">Trace Details</div>
                {activeStep ? (
                  <div className="space-y-2 text-sm">
                    <div className={`rounded-lg border bg-black/25 p-2 ${activeStepTone.border} ${activeStepTone.text}`}>
                      <div className="font-medium">{activeStep.phase_label ?? activeStep.step}</div>
                      <div className="text-xs opacity-85">{activeStep.service}</div>
                    </div>
                    {activeStep.details ? (
                      <pre className="max-h-40 overflow-auto rounded-lg border border-pal-gold/10 bg-black/25 p-2 text-xs text-pal-text/90">
                        {JSON.stringify(activeStep.details, null, 2)}
                      </pre>
                    ) : (
                      <div className="rounded-lg border border-pal-gold/10 bg-black/15 p-2 text-xs text-pal-muted">Sem detalhes extras nesta etapa.</div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-pal-gold/10 bg-black/15 p-3 text-sm text-pal-muted">Clique em Trace a Request para iniciar o replay.</div>
                )}
              </div>
            </div>

            {showTraceJson ? (
              <pre className="max-h-96 overflow-auto rounded-xl border border-pal-gold/10 bg-black/25 p-3 text-xs text-pal-text/90">
                {JSON.stringify(trace, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-pal-gold/10 bg-black/15 p-3 text-sm text-pal-muted">
            Ainda sem trace carregado. Clique em <span className="text-pal-gold">Trace a Request</span> para reproduzir o caminho do request.
          </div>
        )}
      </PageCard>

      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-pal-gold/70">Infra Health</div>
            <div className="text-sm text-pal-muted">Visão rápida dos serviços da arquitetura para suporte ao trace.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["nginx", "up"],
              ["gunicorn", "up"],
              ["fastapi", "up"],
              ["redis", "up"],
              ["postgres", "up"],
              ["broker", "up"],
              ["worker", "up"]
            ].map(([service, status]) => (
              <span key={service} className="rounded-full border border-emerald-300/25 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-200">
                {service}: {status}
              </span>
            ))}
          </div>
        </div>
      </PageCard>

      {diagram ? (
        <div className="grid gap-3 md:grid-cols-2">
          <PageCard>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-pal-gold/70">Nodes</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {diagram.nodes.map((node) => {
                const tone = toneUi((node.tone as Tone | undefined) ?? "gold");
                const active = replay.activeNodeId === node.id;
                return (
                  <span
                    key={node.id}
                    className={[
                      "rounded-full border bg-black/20 px-2 py-0.5 transition-all",
                      tone.border,
                      active ? `${tone.text} ${tone.glow} ring-1 ring-white/10` : "text-pal-text/90"
                    ].join(" ")}
                  >
                    {node.label}
                  </span>
                );
              })}
            </div>
          </PageCard>
          <PageCard>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-pal-gold/70">Edges</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {diagram.edges.map((edge) => {
                const active = replay.activeEdgeIds.includes(edge.id);
                return (
                  <span
                    key={edge.id}
                    className={[
                      "rounded-full border px-2 py-0.5 transition-all",
                      active ? "border-pal-gold/30 bg-pal-gold/10 text-pal-gold animate-pulse" : "border-pal-gold/15 bg-pal-panel/60 text-pal-text/90"
                    ].join(" ")}
                  >
                    {edge.from} {"->"} {edge.to}
                  </span>
                );
              })}
            </div>
          </PageCard>
        </div>
      ) : null}
    </div>
  );
}
