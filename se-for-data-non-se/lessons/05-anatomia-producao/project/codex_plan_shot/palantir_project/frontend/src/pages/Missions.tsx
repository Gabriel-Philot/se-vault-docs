import { useEffect, useMemo, useState } from "react";

import { PageCard } from "../components/shared/PageCard";
import { PageTitleBlock } from "../components/shared/PageTitleBlock";
import { usePollingResource } from "../hooks/usePollingResource";
import { api } from "../lib/api";
import { assets } from "../lib/assets";
import type { MissionSummary, MissionTraceRecord } from "../lib/types";

type TrackedMission = MissionSummary & {
  hero_display_name?: string;
  hero_key?: string;
  hero_avatar_key?: string;
  artifact_key?: string;
  phase_ui?: string;
  points_awarded?: number;
  new_score?: number;
};

function formatTime(value?: string | null) {
  if (!value) return "--:--:--";
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? value : dt.toLocaleTimeString();
}

function heroAvatar(heroKey?: string, avatarKey?: string | null) {
  if (heroKey && heroKey in assets.heroes) {
    return (assets.heroes as Record<string, string>)[heroKey];
  }
  if (avatarKey) return `/images/${avatarKey}`;
  return assets.locations.eagles;
}

export function MissionsPage() {
  const [missions, setMissions] = useState<TrackedMission[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("Nenhuma missao ativa ainda.");
  const [busy, setBusy] = useState(false);
  const [traceView, setTraceView] = useState<"terminal" | "json">("terminal");
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const traces = usePollingResource(() => api.missions.traces(12).then((r) => r.data), 1600);
  const missionFeed = usePollingResource(() => api.missions.list().then((r) => r.data), 1200);

  useEffect(() => {
    const feedMissions = (missionFeed.data?.missions ?? []) as TrackedMission[];
    if (!feedMissions.length) return;
    setMissions((prev) => {
      const merged = new Map<string, TrackedMission>();
      for (const mission of prev) merged.set(mission.id, mission);
      for (const mission of feedMissions) merged.set(mission.id, mission);
      const next = Array.from(merged.values())
        .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
        .slice(0, 16);

      const same =
        next.length === prev.length &&
        next.every((m, idx) => {
          const p = prev[idx];
          return (
            p &&
            p.id === m.id &&
            p.status === m.status &&
            p.progress_pct === m.progress_pct &&
            p.phase_ui === m.phase_ui
          );
        });
      return same ? prev : next;
    });
  }, [missionFeed.data]);

  useEffect(() => {
    if (!traces.data?.traces?.length) return;
    if (!selectedTraceId) {
      setSelectedTraceId(traces.data.traces[0].mission_id);
      return;
    }
    const stillExists = traces.data.traces.some((trace) => trace.mission_id === selectedTraceId);
    if (!stillExists) setSelectedTraceId(traces.data.traces[0].mission_id);
  }, [selectedTraceId, traces.data]);

  const activeMissions = useMemo(
    () => missions.filter((m) => !["SUCCESS", "FAILURE"].includes(m.status)),
    [missions]
  );
  const displayMissions = useMemo(() => {
    const ranked = [...missions].sort((a, b) => {
      const aActive = !["SUCCESS", "FAILURE"].includes(a.status) ? 1 : 0;
      const bActive = !["SUCCESS", "FAILURE"].includes(b.status) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return String(b.updated_at ?? b.created_at ?? "").localeCompare(String(a.updated_at ?? a.created_at ?? ""));
    });
    return ranked.slice(0, 6);
  }, [missions]);
  const activeCount = activeMissions.length;
  const selectedTrace = traces.data?.traces.find((trace) => trace.mission_id === selectedTraceId) ?? traces.data?.traces?.[0] ?? null;

  const latestTerminalLines = useMemo(() => {
    if (!selectedTrace) return [];
    return selectedTrace.steps.map((step) => {
      const stage = String(step.stage).replaceAll("_", " ").toUpperCase();
      const port = step.port ? `:${step.port}` : "";
      return `[${formatTime(step.created_at)}] ${step.service}${port}  ${stage.padEnd(18, " ")} ${step.label}`;
    });
  }, [selectedTrace]);

  const run = async (kind: "recon" | "consult" | "raven" | "fellowship") => {
    setBusy(true);
    try {
      if (kind === "fellowship") {
        const res = await api.missions.fellowship();
        setMissions((prev) => [...(res.data.launched as TrackedMission[]), ...prev].slice(0, 12));
        setStatusMessage(`Lote iniciado: ${res.data.batch_id} (${res.data.launched.length} missoes)`);
      } else {
        const res = await api.missions[kind]();
        setMissions((prev) => [res.data as TrackedMission, ...prev].slice(0, 12));
        setStatusMessage(`Missao ${kind} enviada: ${res.data.id}`);
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Falha ao enviar missao");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitleBlock
        eyebrow="Command Theater"
        title="Missoes"
        subtitle="Dispare missões, acompanhe heróis/workers e veja a cadeia de execução em formato de terminal."
        accent="gold"
      />

      <section className="relative overflow-hidden rounded-2xl border border-pal-gold/10">
        <img src={assets.ui.missionsBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/55" />
        <div className="relative grid gap-4 p-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <div className="space-y-3 rounded-xl border border-pal-gold/15 bg-black/25 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <img src={assets.locations.eagles} alt="" aria-hidden="true" className="h-12 w-12 rounded-lg object-cover ring-1 ring-pal-gold/20" />
              <div>
                <div className="text-sm font-semibold text-pal-gold">Convocador de Missões</div>
                <div className="text-xs text-pal-muted">
                  Workers aparecem como heróis (Aguia(s) no fluxo de mensageria/raven).
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <button disabled={busy} onClick={() => void run("recon")} className="rounded-lg border border-pal-gold/15 bg-black/25 px-3 py-2 text-left text-sm hover:bg-black/35 disabled:opacity-60">
                Reconhecimento em Mordor
              </button>
              <button disabled={busy} onClick={() => void run("consult")} className="rounded-lg border border-pal-gold/15 bg-black/25 px-3 py-2 text-left text-sm hover:bg-black/35 disabled:opacity-60">
                Consultar os Elfos
              </button>
              <button disabled={busy} onClick={() => void run("raven")} className="rounded-lg border border-pal-gold/15 bg-black/25 px-3 py-2 text-left text-sm hover:bg-black/35 disabled:opacity-60">
                Enviar Corvo Mensageiro
              </button>
              <button disabled={busy} onClick={() => void run("fellowship")} className="rounded-lg border border-pal-green/25 bg-pal-green/10 px-3 py-2 text-left text-sm hover:bg-pal-green/15 disabled:opacity-60">
                Convocar a Sociedade (batch)
              </button>
            </div>

            <div className="rounded-lg border border-pal-gold/10 bg-black/20 px-3 py-2 text-xs text-pal-muted">
              <div className="text-pal-text">{statusMessage}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full border border-pal-gold/10 px-2 py-0.5">ativas: {activeCount}</span>
                <span className="rounded-full border border-pal-gold/10 px-2 py-0.5">registradas: {missions.length}</span>
                <span className="rounded-full border border-pal-gold/10 px-2 py-0.5">trace poll: 1.6s</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {displayMissions.length === 0 ? (
                <div className="rounded-xl border border-pal-gold/10 bg-black/20 p-4 text-sm text-pal-muted md:col-span-2 xl:col-span-3">
                  Nenhuma missão ativa ainda. Lance uma missão para ver heróis, fases e progresso no mapa e no terminal.
                </div>
              ) : (
                displayMissions.map((mission) => {
                  const isTerminal = ["SUCCESS", "FAILURE"].includes(mission.status);
                  return (
                  <div
                    key={mission.id}
                    className={[
                      "relative overflow-hidden rounded-xl p-3 backdrop-blur-sm",
                      isTerminal
                        ? "border border-pal-green/15 bg-black/15 opacity-85"
                        : "border border-pal-gold/10 bg-black/20"
                    ].join(" ")}
                  >
                    <div className="absolute inset-0 opacity-20">
                      <img src={heroAvatar(mission.hero_key, mission.hero_avatar_key)} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img src={heroAvatar(mission.hero_key, mission.hero_avatar_key)} alt="" aria-hidden="true" className="h-8 w-8 rounded-full object-cover ring-1 ring-pal-gold/20" />
                          <div>
                            <div className="text-sm font-medium text-pal-text">{mission.hero_display_name ?? mission.mission_type}</div>
                            <div className="text-[11px] uppercase tracking-wide text-pal-muted">{mission.mission_type}</div>
                          </div>
                        </div>
                        <span className={[
                          "rounded-full border px-2 py-0.5 text-[11px]",
                          mission.status === "SUCCESS"
                            ? "border-pal-green/30 text-pal-green"
                            : mission.status === "RETRY"
                              ? "border-pal-red/30 text-pal-red"
                              : "border-pal-gold/20 text-pal-gold"
                        ].join(" ")}>
                          {mission.phase_ui ?? mission.status}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full bg-gradient-to-r from-pal-blue via-pal-gold to-pal-green transition-all" style={{ width: `${mission.progress_pct ?? 0}%` }} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-pal-muted">
                        <span>{mission.id}</span>
                        <span>{mission.progress_pct ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        </div>
      </section>

      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pal-gold/70">Últimas Missões</p>
            <h2 className="text-xl font-semibold">Terminal de Execução</h2>
            <p className="text-sm text-pal-muted">
              Cadeia de serviços/portas por missão: de onde começou, por quais serviços passou e onde terminou.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTraceView("terminal")}
              className={`rounded-md border px-3 py-1 text-xs ${traceView === "terminal" ? "border-pal-gold/30 bg-pal-gold/10 text-pal-gold" : "border-pal-gold/15 hover:bg-black/20"}`}
            >
              Terminal
            </button>
            <button
              type="button"
              onClick={() => setTraceView("json")}
              className={`rounded-md border px-3 py-1 text-xs ${traceView === "json" ? "border-pal-blue/30 bg-pal-blue/10 text-pal-blue" : "border-pal-gold/15 hover:bg-black/20"}`}
            >
              JSON
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[300px_1fr]">
          <div className="rounded-xl border border-pal-gold/10 bg-black/20 p-2">
            <div className="mb-2 px-2 text-xs uppercase tracking-[0.2em] text-pal-muted">Sessões Recentes</div>
            <div className="max-h-[420px] space-y-1 overflow-auto pr-1">
              {(traces.data?.traces ?? []).map((trace) => {
                const selected = trace.mission_id === selectedTrace?.mission_id;
                return (
                  <button
                    key={trace.mission_id}
                    type="button"
                    onClick={() => setSelectedTraceId(trace.mission_id)}
                    className={`w-full rounded-lg border p-2 text-left ${selected ? "border-pal-gold/25 bg-pal-gold/5" : "border-pal-gold/10 bg-black/10 hover:bg-black/20"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{trace.hero_display_name ?? trace.mission_type ?? "Mission"}</span>
                      <span className="text-[10px] uppercase tracking-wide text-pal-gold">{trace.status}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-pal-muted">
                      {(trace.mission_type ?? "mission").toUpperCase()} · {formatTime(trace.started_at)} · {trace.steps.length} etapas
                    </div>
                    <div className="mt-1 truncate text-[11px] text-pal-muted">{trace.mission_id}</div>
                  </button>
                );
              })}
              {!traces.data?.traces?.length && (
                <div className="rounded-lg border border-pal-gold/10 bg-black/10 px-3 py-4 text-sm text-pal-muted">
                  Dispare uma missão para preencher o terminal.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-pal-gold/10 bg-black/35 p-0">
            <div className="flex items-center justify-between gap-3 border-b border-pal-gold/10 px-4 py-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-pal-gold/70">Terminal / JSON</div>
                <div className="text-sm text-pal-text">
                  {selectedTrace ? `${selectedTrace.hero_display_name ?? "Hero"} · ${selectedTrace.mission_type ?? "mission"} · ${selectedTrace.status}` : "Nenhuma missão selecionada"}
                </div>
              </div>
              {selectedTrace ? (
                <div className="text-right text-[11px] text-pal-muted">
                  <div>início {formatTime(selectedTrace.started_at)}</div>
                  <div>fim {formatTime(selectedTrace.ended_at)}</div>
                </div>
              ) : null}
            </div>
            <div className="max-h-[420px] overflow-auto p-4">
              {selectedTrace ? (
                traceView === "terminal" ? (
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-pal-green">
                    {latestTerminalLines.map((line, idx) => (
                      <div key={`${selectedTrace.mission_id}-${idx}`} className="text-pal-green/95">
                        <span className="mr-2 select-none text-pal-gold/60">$</span>
                        {line}
                      </div>
                    ))}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-pal-text/90">
                    {JSON.stringify(selectedTrace, null, 2)}
                  </pre>
                )
              ) : (
                <p className="text-sm text-pal-muted">Selecione uma missão para ver o trace.</p>
              )}
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
