import { useEffect, useMemo, useRef, useState } from "react";

import { PageCard } from "../components/shared/PageCard";
import { usePollingResource } from "../hooks/usePollingResource";
import { api } from "../lib/api";
import { assets } from "../lib/assets";
import type { TelemetryEvent } from "../lib/types";

type WidgetId = "missions" | "library" | "infra";
type PulseTone = "gold" | "green" | "blue" | "amber" | "red";

type WidgetPulseState = {
  at: number;
  tone: PulseTone;
  label: string;
};

type MissionWidgetView = {
  mode: "idle" | "active" | "completed_hold";
  phase: string;
  heroKey: string | null;
  heroName: string | null;
  missionType: string | null;
  progressPct: number;
  pointsAwarded?: number;
  newScore?: number;
  subtitle: string;
};

type LibraryWidgetView = {
  mode: "idle" | "cache" | "score";
  title: string;
  subtitle: string;
  icon: string;
  hitMiss: string;
  events: number;
  heroName?: string;
  pointsAwarded?: number;
  newScore?: number;
};

const MAP_MARKERS = [
  { key: "m1", x: "15%", y: "32%" },
  { key: "m2", x: "34%", y: "46%" },
  { key: "m3", x: "58%", y: "28%" },
  { key: "m4", x: "73%", y: "56%" },
  { key: "m5", x: "46%", y: "67%" }
] as const;

function formatAgo(value?: string | null) {
  if (!value) return "never";
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const secs = Math.floor(delta / 1000);
  if (secs < 2) return "agora";
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}m`;
}

function eventTone(evt: TelemetryEvent) {
  if (evt.status === "error") return "border-pal-red/20 text-pal-red";
  if (evt.status === "warn") return "border-pal-gold/20 text-pal-gold";
  if (evt.status === "success") return "border-pal-green/20 text-pal-green";
  return "border-pal-gold/10 text-pal-text/90";
}

function statusChipClasses(status?: string) {
  if (status === "up") return "border-pal-green/40 text-pal-green bg-emerald-500/10";
  if (status === "degraded") return "border-pal-gold/35 text-pal-gold bg-amber-500/10";
  if (status === "down") return "border-pal-red/35 text-pal-red bg-red-500/10";
  return "border-pal-gold/15 text-pal-muted bg-black/30";
}

function widgetToneClasses(tone: PulseTone, active: boolean) {
  const pulse = active ? "shadow-[0_0_30px_rgba(245,194,90,0.16)]" : "";
  switch (tone) {
    case "green":
      return `border-emerald-300/25 text-emerald-100 ${active ? "ring-1 ring-emerald-300/35" : ""} ${pulse}`;
    case "blue":
      return `border-sky-300/25 text-sky-100 ${active ? "ring-1 ring-sky-300/35" : ""} ${pulse}`;
    case "amber":
      return `border-amber-300/25 text-amber-100 ${active ? "ring-1 ring-amber-300/35" : ""} ${pulse}`;
    case "red":
      return `border-red-300/25 text-red-100 ${active ? "ring-1 ring-red-300/35" : ""} ${pulse}`;
    case "gold":
    default:
      return `border-pal-gold/20 text-pal-text ${active ? "ring-1 ring-pal-gold/30" : ""} ${pulse}`;
  }
}

function missionPhaseFromEvent(evt?: TelemetryEvent) {
  if (!evt) return "IDLE";
  if (evt.payload?.phase_ui) return String(evt.payload.phase_ui);
  if (evt.stage === "mission_invoked" || evt.stage === "mission_started") return "INVOKED";
  if (evt.stage === "mission_queued" || evt.stage === "queued" || evt.stage === "batch_started") return "QUEUED";
  if (evt.stage === "mission_executing") return "EXECUTING";
  if (evt.stage === "mission_completed") return "COMPLETED";
  if (evt.stage === "mission_persisted") return "PERSISTED";
  if (evt.stage === "hero_scored") return "SCORED";
  if (evt.stage === "mission_failed") return "FAILED";
  if (evt.stage === "mission_progress") return "PROCESSING";
  return "ACTIVE";
}

function pulseToneFromEvent(evt: TelemetryEvent): PulseTone {
  if (evt.status === "error") return "red";
  if (evt.status === "warn") return "amber";
  if (evt.status === "success") return "green";
  if (evt.service === "postgres") return "blue";
  return "gold";
}

function eventWidgets(evt: TelemetryEvent): WidgetId[] {
  const widgets: WidgetId[] = [];
  if (evt.kind.startsWith("mission")) widgets.push("missions", "infra");
  if (evt.kind.startsWith("library")) widgets.push("library", "infra");
  if (!widgets.length) widgets.push("infra");
  return [...new Set(widgets)];
}

function eventAgeMs(evt?: TelemetryEvent | null) {
  if (!evt?.created_at) return Number.POSITIVE_INFINITY;
  return Math.max(0, Date.now() - new Date(evt.created_at).getTime());
}

function deriveMissionWidgetView(evt: TelemetryEvent | undefined, pulseLabel: string): MissionWidgetView {
  if (!evt) {
    return {
      mode: "idle",
      phase: "IDLE",
      heroKey: null,
      heroName: null,
      missionType: null,
      progressPct: 0,
      subtitle: "Aguardando missão"
    };
  }
  const age = eventAgeMs(evt);
  const phase = missionPhaseFromEvent(evt);
  const heroKey = (evt.payload?.hero_key as string | undefined) ?? null;
  const heroName = (evt.payload?.hero_display_name as string | undefined) ?? (heroKey ? heroKey.toUpperCase() : null);
  const progressPct = Math.max(
    0,
    Math.min(100, Number(evt.payload?.progress_pct ?? (phase === "COMPLETED" || phase === "SCORED" ? 100 : evt.stage === "mission_queued" ? 10 : 0)))
  );
  const isTerminal = ["COMPLETED", "PERSISTED", "SCORED", "FAILED"].includes(phase);
  if (age > (isTerminal ? 8000 : 6000)) {
    return {
      mode: "idle",
      phase: "IDLE",
      heroKey: null,
      heroName: null,
      missionType: null,
      progressPct: 0,
      subtitle: "Aguardando missão"
    };
  }
  return {
    mode: isTerminal ? "completed_hold" : "active",
    phase,
    heroKey,
    heroName,
    missionType: (evt.payload?.mission_type as string | undefined) ?? null,
    progressPct,
    pointsAwarded: typeof evt.payload?.points_awarded === "number" ? evt.payload.points_awarded : undefined,
    newScore: typeof evt.payload?.new_score === "number" ? evt.payload.new_score : undefined,
    subtitle: pulseLabel || evt.label
  };
}

function deriveLibraryWidgetView(
  latestLibraryEvent: TelemetryEvent | undefined,
  latestScoreEvent: TelemetryEvent | undefined,
  pulseLabel: string,
  counts: { redis_hits?: number; redis_misses?: number; library_events?: number } | undefined
): LibraryWidgetView {
  const scoreAge = eventAgeMs(latestScoreEvent);
  if (latestScoreEvent && scoreAge < 7000) {
    const points = typeof latestScoreEvent.payload?.points_awarded === "number" ? latestScoreEvent.payload.points_awarded : undefined;
    const newScore = typeof latestScoreEvent.payload?.new_score === "number" ? latestScoreEvent.payload.new_score : undefined;
    return {
      mode: "score",
      title: "MISSION REWARD",
      subtitle: pulseLabel || latestScoreEvent.label,
      icon: "✦",
      hitMiss: `${counts?.redis_hits ?? 0}/${counts?.redis_misses ?? 0}`,
      events: Number(counts?.library_events ?? 0),
      heroName: (latestScoreEvent.payload?.hero_display_name as string | undefined) ?? latestScoreEvent.entity_id ?? undefined,
      pointsAwarded: points,
      newScore
    };
  }
  if (latestLibraryEvent && eventAgeMs(latestLibraryEvent) < 7000) {
    const stage = latestLibraryEvent.stage;
    const icon = stage.includes("redis") ? "◌" : stage.includes("leaderboard") ? "✦" : "◇";
    return {
      mode: "cache",
      title: "LIBRARY / ARTIFACTS",
      subtitle: pulseLabel || latestLibraryEvent.label,
      icon,
      hitMiss: `${counts?.redis_hits ?? 0}/${counts?.redis_misses ?? 0}`,
      events: Number(counts?.library_events ?? 0),
    };
  }
  return {
    mode: "idle",
    title: "LIBRARY / ARTIFACTS",
    subtitle: "Aguardando biblioteca",
    icon: "✦",
    hitMiss: `${counts?.redis_hits ?? 0}/${counts?.redis_misses ?? 0}`,
    events: Number(counts?.library_events ?? 0),
  };
}

function formatTimelineLabel(evt: TelemetryEvent): string {
  const hero = (evt.payload?.hero_display_name as string | undefined) ?? (evt.payload?.hero_key as string | undefined);
  const missionType = (evt.payload?.mission_type as string | undefined);
  if (evt.stage === "mission_invoked" && hero && missionType) return `Mission invoked: ${missionType} (${hero})`;
  if (evt.stage === "mission_executing" && hero) return `Hero executing: ${hero}`;
  if (evt.stage === "hero_scored" && hero) {
    const points = typeof evt.payload?.points_awarded === "number" ? `+${evt.payload.points_awarded}` : "";
    const score = typeof evt.payload?.new_score === "number" ? ` -> ${evt.payload.new_score}` : "";
    return `Hero scored ${points}: ${hero}${score}`;
  }
  return evt.label;
}

export function DashboardPage() {
  const overview = usePollingResource(() => api.telemetry.overview().then((r) => r.data), 1500);
  const feed = usePollingResource(() => api.telemetry.feed(50).then((r) => r.data), 1200);
  const ticker = usePollingResource(() => api.telemetry.ticker().then((r) => r.data), 1000);

  const events = feed.data?.events ?? [];
  const services = overview.data?.services ?? [];
  const counts = ticker.data?.counts_60s ?? overview.data?.counts_60s;
  const newestEventAt = ticker.data?.last_event_at ?? events[0]?.created_at ?? null;
  const latestMissionEvent = useMemo(() => events.find((evt) => evt.kind.startsWith("mission")), [events]);
  const latestLibraryEvent = useMemo(() => events.find((evt) => evt.kind.startsWith("library")), [events]);
  const latestScoreEvent = useMemo(() => events.find((evt) => evt.stage === "hero_scored" || evt.stage === "leaderboard_update"), [events]);
  const latestInfraEvent = events[0];
  const missionEvents = events.filter((evt) => evt.kind.startsWith("mission")).slice(0, 6);
  const libraryEvents = events.filter((evt) => evt.kind.startsWith("library")).slice(0, 6);

  const [widgetPulse, setWidgetPulse] = useState<Record<WidgetId, WidgetPulseState>>({
    missions: { at: 0, tone: "gold", label: "Aguardando missão" },
    library: { at: 0, tone: "gold", label: "Aguardando biblioteca" },
    infra: { at: 0, tone: "gold", label: "Aguardando tráfego" }
  });
  const seenEventId = useRef<string | null>(null);

  useEffect(() => {
    const latest = events[0];
    if (!latest) return;
    if (seenEventId.current === latest.id) return;
    seenEventId.current = latest.id;

    const tone = pulseToneFromEvent(latest);
    const now = Date.now();
    setWidgetPulse((prev) => {
      const next = { ...prev };
      for (const id of eventWidgets(latest)) {
        next[id] = { at: now, tone, label: latest.label };
      }
      return next;
    });
  }, [events]);

  const isActivePulse = (id: WidgetId) => Date.now() - widgetPulse[id].at < 1500;
  const infraStrength = Math.min(
    100,
    ((counts?.requests ?? 0) * 2) + ((counts?.mission_events ?? 0) * 3) + ((counts?.library_events ?? 0) * 2)
  );

  const serviceRows = services.slice().sort((a, b) => a.service.localeCompare(b.service));
  const timelineEvents = events.slice(0, 10);
  const missionWidget = deriveMissionWidgetView(latestMissionEvent, widgetPulse.missions.label);
  const libraryWidget = deriveLibraryWidgetView(latestLibraryEvent, latestScoreEvent, widgetPulse.library.label, counts);
  const activeHeroSlotKey = missionWidget.heroKey ? missionWidget.heroKey.slice(0, 2).toUpperCase() : null;

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-pal-gold" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-pal-gold/80">Command Theater</span>
        </div>
        <h1 className="text-2xl font-semibold text-pal-gold">Dashboard - Mapa da Terra-Media</h1>
        <p className="mt-1 max-w-[80ch] text-sm text-pal-text/80">
          Fluxo vivo de missões, biblioteca e infraestrutura. Ações em outras abas acendem widgets no mapa, entram nos registros e atualizam o resumo do sistema.
        </p>
      </div>

      <div className="rounded-xl border border-pal-gold/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
        <div className="text-xs uppercase tracking-[0.14em] text-pal-gold/75">Leitura rápida</div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-2">
            <div className="text-[11px] text-pal-muted">Último evento</div>
            <div className="mt-1 text-sm font-semibold text-pal-text">{formatAgo(newestEventAt)}</div>
          </div>
          <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-2">
            <div className="text-[11px] text-pal-muted">Saúde geral</div>
            <div className="mt-1">
              <span className={["rounded-full border px-2 py-0.5 text-[11px]", statusChipClasses(overview.data?.health.overall_status)].join(" ")}>
                {overview.data?.health.overall_status ?? "loading"}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-2">
            <div className="text-[11px] text-pal-muted">Missões (60s)</div>
            <div className="mt-1 text-sm font-semibold text-amber-200">{counts?.mission_events ?? 0}</div>
          </div>
          <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-2">
            <div className="text-[11px] text-pal-muted">Biblioteca (60s)</div>
            <div className="mt-1 text-sm font-semibold text-emerald-300">{counts?.library_events ?? 0}</div>
          </div>
        </div>
      </div>

      <PageCard>
        <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-pal-gold/10 bg-black/10">
          <img src={assets.ui.mapBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center opacity-85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(245,194,90,0.16),transparent_42%),radial-gradient(circle_at_80%_18%,rgba(71,112,255,0.12),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.7))]" />

          <div className="absolute inset-0">
            {MAP_MARKERS.map((marker) => (
              <div key={marker.key} className="absolute" style={{ left: marker.x, top: marker.y }}>
                <span className={["block h-2.5 w-2.5 rounded-full bg-pal-gold/80", newestEventAt ? "animate-pulse" : ""].join(" ")} />
                <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pal-gold/15" />
              </div>
            ))}
          </div>

          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pal-gold/10 bg-pal-gold/5 shadow-[0_0_50px_rgba(232,178,58,0.08)]" />
          <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pal-gold/10" />

          <div className="absolute left-[7%] top-[16%] w-[23%] max-w-[270px] min-w-[210px]">
            <div className={`rounded-2xl border bg-black/35 p-3 backdrop-blur-sm transition-all ${widgetToneClasses(widgetPulse.missions.tone, isActivePulse("missions"))}`}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-pal-gold/80">Missions</div>
                  <div className="text-sm font-semibold">{missionWidget.phase}</div>
                  <div className="text-[11px] text-pal-muted">{missionWidget.heroName ?? "Sem herói ativo"}</div>
                </div>
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border border-pal-gold/25" />
                  <div
                    className="absolute inset-1 rounded-full"
                    style={{
                      background: `conic-gradient(rgba(232,178,58,0.75) ${Math.min(360, missionWidget.progressPct * 3.6)}deg, rgba(255,255,255,0.05) 0deg)`
                    }}
                  />
                  <div className="absolute inset-3 rounded-full border border-pal-gold/20 bg-black/60" />
                  <div className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-pal-text">
                    {missionWidget.mode === "idle" ? "—" : `${missionWidget.progressPct}%`}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {["aragorn", "legolas", "gandalf", "eowyn", "eagles"].map((hero, idx) => (
                  <div
                    key={hero}
                    className={[
                      "grid h-7 place-items-center rounded-full border text-[9px] uppercase",
                      activeHeroSlotKey && hero.slice(0, 2).toUpperCase() === activeHeroSlotKey
                        ? "border-pal-gold/35 bg-pal-gold/10 text-pal-gold"
                        : "border-pal-gold/10 bg-black/20 text-pal-muted"
                    ].join(" ")}
                  >
                    {hero.slice(0, 2)}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-pal-muted line-clamp-1">{missionWidget.subtitle}</div>
              {missionWidget.pointsAwarded ? (
                <div className="mt-1 text-[11px] text-emerald-300">+{missionWidget.pointsAwarded} pts {missionWidget.newScore ? `• score ${missionWidget.newScore}` : ""}</div>
              ) : null}
            </div>
          </div>

          <div className="absolute right-[7%] top-[17%] w-[21%] max-w-[245px] min-w-[190px]">
            <div className={`rounded-2xl border bg-black/35 p-3 backdrop-blur-sm transition-all ${widgetToneClasses(widgetPulse.library.tone, isActivePulse("library"))}`}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-pal-gold/80">Library / Artifacts</div>
                  <div className="text-sm font-semibold">{libraryWidget.mode === "score" ? "SCORED" : latestLibraryEvent ? latestLibraryEvent.stage.toUpperCase() : "IDLE"}</div>
                  <div className="text-[11px] text-pal-muted">{libraryWidget.heroName ?? (latestLibraryEvent?.entity_id ?? " ")}</div>
                </div>
                <div className="relative h-12 w-12 rounded-full border border-pal-gold/20 bg-black/50">
                  <div className="absolute inset-1 rounded-full border border-pal-gold/15" />
                  <div className={["absolute inset-2 rounded-full", isActivePulse("library") ? "animate-pulse bg-emerald-400/15" : "bg-pal-gold/10"].join(" ")} />
                  <div className="absolute inset-0 grid place-items-center text-lg">{libraryWidget.icon}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-2">
                  <div className="text-pal-muted">Hit/Miss</div>
                  <div className="mt-1 font-semibold text-pal-gold">{libraryWidget.hitMiss}</div>
                </div>
                <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-2">
                  <div className="text-pal-muted">{libraryWidget.mode === "score" ? "Pontos" : "Eventos"}</div>
                  <div className="mt-1 font-semibold text-emerald-300">
                    {libraryWidget.mode === "score" && libraryWidget.pointsAwarded ? `+${libraryWidget.pointsAwarded}` : libraryWidget.events}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-pal-muted line-clamp-1">{libraryWidget.subtitle}</div>
              {libraryWidget.newScore ? <div className="mt-1 text-[11px] text-pal-gold">score {libraryWidget.newScore}</div> : null}
            </div>
          </div>

          <div className="absolute left-1/2 bottom-[13%] w-[22%] max-w-[255px] min-w-[210px] -translate-x-1/2">
            <div className={`rounded-2xl border bg-black/35 p-3 backdrop-blur-sm transition-all ${widgetToneClasses(widgetPulse.infra.tone, isActivePulse("infra"))}`}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-pal-gold/80">Infra Pulse</div>
                  <div className="text-sm font-semibold">runtime</div>
                  <div className="text-[11px] text-pal-muted">infra embaixo nos registros</div>
                </div>
                <span className={["rounded-full border px-2 py-0.5 text-[10px]", statusChipClasses(overview.data?.health.overall_status)].join(" ")}>
                  {overview.data?.health.overall_status ?? "—"}
                </span>
              </div>
              <div className="relative h-16 overflow-hidden rounded-xl border border-pal-gold/10 bg-black/20">
                <div className="absolute inset-0 grid place-items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={[
                        "absolute rounded-full border",
                        isActivePulse("infra") ? "animate-pulse border-pal-gold/25" : "border-pal-gold/10"
                      ].join(" ")}
                      style={{ width: `${28 + i * 22}px`, height: `${28 + i * 22}px` }}
                    />
                  ))}
                  <div className="text-[11px] font-semibold text-pal-text">{infraStrength}%</div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                  <div className="h-1.5 flex-1 rounded bg-sky-400/25">
                    <div className="h-full rounded bg-sky-300/70" style={{ width: `${Math.min(100, (counts?.requests ?? 0) * 4)}%` }} />
                  </div>
                  <div className="h-1.5 flex-1 rounded bg-emerald-400/20">
                    <div className="h-full rounded bg-emerald-300/70" style={{ width: `${Math.min(100, (counts?.library_events ?? 0) * 8)}%` }} />
                  </div>
                  <div className="h-1.5 flex-1 rounded bg-amber-400/20">
                    <div className="h-full rounded bg-amber-300/70" style={{ width: `${Math.min(100, (counts?.mission_events ?? 0) * 8)}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-pal-muted line-clamp-1">{widgetPulse.infra.label}</div>
            </div>
          </div>
        </div>
      </PageCard>

      <PageCard>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Registros</h3>
          <span className="text-xs text-pal-muted">efeito {"->"} registro {"->"} status</span>
        </div>
        <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
          {timelineEvents.length === 0 ? <p className="text-sm text-pal-muted">Sem eventos ainda. Dispare ações em Missões/Biblioteca.</p> : null}
          {timelineEvents.map((evt, idx) => (
            <div
              key={evt.id}
              className={[
                "rounded-lg border bg-black/15 px-3 py-2 text-xs transition-colors",
                eventTone(evt),
                idx === 0 ? "shadow-[0_0_20px_rgba(232,178,58,0.08)]" : ""
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-pal-text">{formatTimelineLabel(evt)}</span>
                <span className="text-pal-muted">{formatAgo(evt.created_at)}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-pal-muted">
                <span>{evt.service}</span>
                <span>{evt.stage}</span>
                {evt.entity_id ? <span>• {evt.entity_id}</span> : null}
                {evt.latency_ms ? <span>• {evt.latency_ms}ms</span> : null}
                {evt.payload?.hero_display_name ? <span className="rounded-full border border-pal-gold/10 px-1.5 py-0.5">{String(evt.payload.hero_display_name)}</span> : null}
                {evt.payload?.artifact_key ? <span className="rounded-full border border-pal-blue/15 px-1.5 py-0.5">{String(evt.payload.artifact_key)}</span> : null}
                {typeof evt.payload?.points_awarded === "number" ? <span className="rounded-full border border-pal-green/15 px-1.5 py-0.5">+{evt.payload.points_awarded} pts</span> : null}
              </div>
            </div>
          ))}
        </div>
      </PageCard>

      <PageCard>
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-pal-gold/80">Status</div>
            <div className="flex flex-wrap gap-2">
              {serviceRows.length > 0 ? (
                serviceRows.map((svc) => (
                  <span
                    key={svc.service}
                    className={["rounded-full border px-3 py-1 text-xs", statusChipClasses(svc.status)].join(" ")}
                  >
                    {svc.service}: {svc.status}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-pal-gold/10 px-3 py-1 text-xs text-pal-muted">Carregando status...</span>
              )}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-pal-gold/80">Counters</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Requests (60s)", value: counts?.requests ?? 0, tone: "text-sky-300" },
                { label: "Mission events", value: counts?.mission_events ?? 0, tone: "text-amber-200" },
                { label: "Library events", value: counts?.library_events ?? 0, tone: "text-emerald-300" },
                { label: "Redis hits/miss", value: `${counts?.redis_hits ?? 0}/${counts?.redis_misses ?? 0}`, tone: "text-pal-gold" }
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-pal-gold/10 bg-black/20 px-3 py-2 text-xs">
                  <div className="text-pal-muted">{item.label}</div>
                  <div className={["mt-1 text-sm font-semibold", item.tone].join(" ")}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageCard>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <PageCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Missões Ativas</h3>
            <span className={["text-xs", newestEventAt ? "text-amber-200" : "text-pal-muted"].join(" ")}>fila viva</span>
          </div>
          <div className="space-y-2">
            {missionEvents.length === 0 ? <p className="text-sm text-pal-muted">Inicie uma missão para ver progresso aqui.</p> : null}
            {missionEvents.map((evt) => (
              <div key={evt.id} className="rounded-lg border border-pal-gold/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-pal-text">{evt.label}</span>
                  <span className={["rounded-full border px-2 py-0.5 text-[10px]", eventTone(evt)].join(" ")}>{evt.status}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/5">
                  <div
                    className="h-full rounded bg-gradient-to-r from-pal-gold/70 via-amber-300/70 to-pal-gold/70 transition-all"
                    style={{ width: `${Math.min(100, Number(evt.payload?.progress_pct ?? (evt.stage.includes("completed") ? 100 : 12)))}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-pal-muted">{evt.stage} • {formatAgo(evt.created_at)}</div>
              </div>
            ))}
          </div>
        </PageCard>

        <PageCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Biblioteca / Cache</h3>
            <span className="text-xs text-pal-muted">Redis + Postgres</span>
          </div>
          <div className="space-y-2">
            {libraryEvents.length === 0 ? <p className="text-sm text-pal-muted">Faça buscas/knocks/feat na Biblioteca para alimentar este painel.</p> : null}
            {libraryEvents.map((evt) => (
              <div key={evt.id} className="rounded-lg border border-pal-gold/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-pal-text">{evt.label}</span>
                  <span className={["rounded-full border px-2 py-0.5 text-[10px]", eventTone(evt)].join(" ")}>{evt.service}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-pal-muted">
                  <span>{evt.stage}</span>
                  {evt.entity_id ? <span>• {evt.entity_id}</span> : null}
                  {evt.latency_ms ? <span>• {evt.latency_ms}ms</span> : null}
                </div>
              </div>
            ))}
          </div>
        </PageCard>

        <PageCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resumo Operacional</h3>
            <span className="text-xs text-pal-muted">fluxo completo</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-pal-gold/80">Missão</div>
              <div className="mt-1 text-pal-text">{missionWidget.phase}</div>
              <div className="text-xs text-pal-muted">{missionWidget.heroName ? `${missionWidget.heroName} • ${missionWidget.missionType ?? ""}` : "Sem missão recente"}</div>
            </div>
            <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-pal-gold/80">Artefato / Cache</div>
              <div className="mt-1 text-pal-text">{libraryWidget.mode === "score" ? "score handoff" : (latestLibraryEvent?.stage ?? "idle")}</div>
              <div className="text-xs text-pal-muted">{libraryWidget.heroName ? `${libraryWidget.heroName}${libraryWidget.pointsAwarded ? ` +${libraryWidget.pointsAwarded}` : ""}` : (latestLibraryEvent?.label ?? "Sem evento de biblioteca")}</div>
            </div>
            <div className="rounded-lg border border-pal-gold/10 bg-black/20 p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-pal-gold/80">Infra</div>
              <div className="mt-1 text-pal-text">{latestInfraEvent?.service ?? "runtime"}</div>
              <div className="text-xs text-pal-muted">{widgetPulse.infra.label}</div>
            </div>
          </div>
        </PageCard>
      </div>

      {(overview.error || feed.error || ticker.error) ? (
        <PageCard>
          <div className="text-sm text-pal-red">
            Telemetry errors:
            {overview.error ? ` overview=${overview.error}` : ""}
            {feed.error ? ` feed=${feed.error}` : ""}
            {ticker.error ? ` ticker=${ticker.error}` : ""}
          </div>
        </PageCard>
      ) : null}
    </div>
  );
}
