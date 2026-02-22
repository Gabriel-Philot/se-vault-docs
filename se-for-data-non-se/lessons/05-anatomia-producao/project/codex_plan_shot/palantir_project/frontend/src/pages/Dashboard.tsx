import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PageCard } from "../components/shared/PageCard";
import { PageTitleBlock } from "../components/shared/PageTitleBlock";
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

const HERO_SIGILS: Record<string, string> = {
  aragorn: "AR",
  legolas: "LE",
  gandalf: "GD",
  galadriel: "GL",
  faramir: "FA",
  samwise: "SA",
  boromir: "BO",
  eowyn: "EO",
  frodo: "FR",
  eagles: "EA",
};

function heroSigil(heroKey: string | null | undefined) {
  if (!heroKey) return "--";
  return HERO_SIGILS[heroKey] ?? heroKey.slice(0, 2).toUpperCase();
}

function heroSlotAvatar(heroKey: string) {
  if (heroKey in assets.heroes) {
    return (assets.heroes as Record<string, string>)[heroKey];
  }
  if (heroKey === "eagles") return assets.locations.eagles;
  return null;
}

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

function dashboardPanelSkin(kind: "log" | "missions" | "library" | "summary") {
  switch (kind) {
    case "log":
      return {
        wrap: "relative overflow-hidden rounded-2xl border border-pal-gold/[0.04] bg-black/22 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(0,0,0,0.16)]",
        overlays: (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015),transparent_24%),radial-gradient(circle_at_14%_18%,rgba(232,178,58,0.05),transparent_36%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]" />
          </>
        )
      };
    case "missions":
      return {
        wrap: "relative overflow-hidden rounded-2xl border border-pal-gold/[0.045] bg-black/20 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(0,0,0,0.14)]",
        overlays: (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_14%,rgba(232,178,58,0.09),transparent_42%),radial-gradient(circle_at_88%_80%,rgba(251,191,36,0.03),transparent_36%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pal-gold/22 to-transparent" />
          </>
        )
      };
    case "library":
      return {
        wrap: "relative overflow-hidden rounded-2xl border border-pal-blue/[0.05] bg-black/20 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(0,0,0,0.14)]",
        overlays: (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(56,189,248,0.06),transparent_40%),radial-gradient(circle_at_86%_82%,rgba(16,185,129,0.05),transparent_38%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(to_right,rgba(125,211,252,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
          </>
        )
      };
    case "summary":
    default:
      return {
        wrap: "relative overflow-hidden rounded-2xl border border-white/[0.025] bg-black/18 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(0,0,0,0.14)]",
        overlays: (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.02),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.012),transparent_28%)]" />
          </>
        )
      };
  }
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
  const activeHeroSlotKey = missionWidget.heroKey ? heroSigil(missionWidget.heroKey) : null;
  const activeHeroSlotKeys = useMemo(() => {
    const latestByMission = new Map<string, TelemetryEvent>();
    for (const evt of events) {
      if (!evt.kind.startsWith("mission")) continue;
      const missionId = typeof evt.payload?.mission_id === "string" ? evt.payload.mission_id : (evt.entity_id ?? "");
      if (!missionId || latestByMission.has(missionId)) continue;
      latestByMission.set(missionId, evt);
    }

    const activeStages = new Set([
      "mission_invoked",
      "mission_queued",
      "mission_executing",
      "mission_progress",
      "mission_started",
      "queued",
      "batch_started",
    ]);
    const terminalStages = new Set(["mission_completed", "mission_persisted", "hero_scored", "leaderboard_update", "mission_failed"]);

    const slots = new Set<string>();
    for (const evt of latestByMission.values()) {
      const heroKey = typeof evt.payload?.hero_key === "string" ? evt.payload.hero_key : null;
      if (!heroKey) continue;
      const slot = heroSigil(heroKey);
      const age = eventAgeMs(evt);
      if (activeStages.has(evt.stage) && age < 20000) {
        slots.add(slot);
        continue;
      }
      if (terminalStages.has(evt.stage) && age < 5000) {
        slots.add(slot);
      }
    }
    return slots;
  }, [events]);
  const logSkin = dashboardPanelSkin("log");
  const missionsSkin = dashboardPanelSkin("missions");
  const librarySkin = dashboardPanelSkin("library");
  const summarySkin = dashboardPanelSkin("summary");
  const timelineAnimationKey = `${timelineEvents[0]?.id ?? "empty"}-${timelineEvents.length}`;
  const heroSlots = useMemo(() => {
    const keys = Object.keys(assets.heroes);
    return [...new Set([...keys, "eagles"])];
  }, []);
  const quickReadCards = [
    {
      label: "Último evento",
      value: formatAgo(newestEventAt),
      tone: "text-pal-text",
      accent: "from-pal-gold/35 via-pal-gold/10 to-transparent"
    },
    {
      label: "Saúde geral",
      value: overview.data?.health.overall_status ?? "loading",
      tone: overview.data?.health.overall_status === "up" ? "text-pal-green" : overview.data?.health.overall_status === "down" ? "text-pal-red" : "text-pal-gold",
      accent:
        overview.data?.health.overall_status === "up"
          ? "from-emerald-400/30 via-emerald-300/10 to-transparent"
          : overview.data?.health.overall_status === "down"
            ? "from-red-400/30 via-red-300/10 to-transparent"
            : "from-pal-gold/35 via-pal-gold/10 to-transparent"
    },
    {
      label: "Missões (60s)",
      value: String(counts?.mission_events ?? 0),
      tone: "text-amber-200",
      accent: "from-amber-300/30 via-amber-200/10 to-transparent"
    },
    {
      label: "Biblioteca (60s)",
      value: String(counts?.library_events ?? 0),
      tone: "text-emerald-300",
      accent: "from-emerald-300/30 via-emerald-200/10 to-transparent"
    }
  ] as const;

  return (
    <div className="space-y-4">
      <PageTitleBlock
        eyebrow="Command Theater"
        title="Dashboard - Mapa da Terra-Media"
        subtitle="Fluxo vivo de missões, biblioteca e infraestrutura. Ações em outras abas acendem widgets no mapa, entram nos registros e atualizam o resumo do sistema."
        accent="gold"
        leadDot
      />

      <div className="rounded-xl border border-pal-gold/10 bg-black/18 p-2 backdrop-blur-sm">
        <div className="px-2 pt-1 text-xs uppercase tracking-[0.14em] text-pal-gold/75">Leitura rápida</div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickReadCards.map((card, idx) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-lg border border-pal-gold/10 bg-black/20 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 hover:border-pal-gold/20"
            >
              <div className={`pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${card.accent}`} />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-[-35%] w-[38%] skew-x-[-16deg] opacity-50"
                animate={{ x: ["0%", "360%"] }}
                transition={{ duration: 6.2, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: idx * 0.55 }}
              >
                <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_45%,rgba(255,255,255,0.14)_52%,rgba(255,255,255,0.05)_60%,transparent_100%)]" />
              </motion.div>
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_50%,rgba(232,178,58,0.06),transparent_45%)]" />
              </div>
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] text-pal-text/65">{card.label}</div>
                  <div className={`mt-1 text-base font-semibold leading-none ${card.tone}`}>{card.value}</div>
                </div>
                {card.label === "Saúde geral" ? (
                  <span className={["shrink-0 rounded-full border px-2 py-0.5 text-[10px]", statusChipClasses(overview.data?.health.overall_status)].join(" ")}>
                    {overview.data?.health.overall_status ?? "loading"}
                  </span>
                ) : (
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-pal-gold/10 bg-black/25 text-[10px] text-pal-gold/70">
                    •
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-transparent p-0">
        <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-transparent bg-black/5 shadow-[0_22px_55px_rgba(0,0,0,0.34)]">
          <img src={assets.ui.mapBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center opacity-85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(245,194,90,0.16),transparent_42%),radial-gradient(circle_at_80%_18%,rgba(71,112,255,0.12),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.7))]" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.32),inset_0_18px_36px_rgba(0,0,0,0.14),inset_0_-18px_30px_rgba(0,0,0,0.10)]" />

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

          <div className="absolute left-[7%] top-[15%] w-[25%] max-w-[310px] min-w-[240px]">
            <div className={`rounded-2xl border bg-black/35 p-3.5 backdrop-blur-sm transition-all ${widgetToneClasses(widgetPulse.missions.tone, isActivePulse("missions"))}`}>
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
              <div className="grid grid-cols-5 gap-1.5">
                {heroSlots.map((hero) => (
                  (() => {
                    const avatar = heroSlotAvatar(hero);
                    const isPrimary = activeHeroSlotKey && heroSigil(hero) === activeHeroSlotKey;
                    const isActive = activeHeroSlotKeys.has(heroSigil(hero));
                    return (
                  <div
                    key={hero}
                    className={[
                      "relative mx-auto grid h-8 w-8 overflow-hidden rounded-full border text-[8px] font-semibold uppercase tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                      isPrimary
                        ? "border-emerald-300/70 bg-emerald-400/12 text-emerald-100 ring-2 ring-emerald-300/60 shadow-[0_0_14px_rgba(16,185,129,0.35),0_0_28px_rgba(34,197,94,0.22)]"
                        : isActive
                          ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-100 ring-1 ring-emerald-300/35 shadow-[0_0_10px_rgba(16,185,129,0.22)]"
                          : "border-pal-gold/10 bg-black/25 text-pal-muted"
                    ].join(" ")}
                    title={hero}
                  >
                    {avatar ? (
                      <>
                        <img
                          src={avatar}
                          alt=""
                          aria-hidden="true"
                          className={[
                            "absolute inset-0 h-full w-full scale-110 object-cover object-center transition",
                            isPrimary ? "brightness-125 saturate-125" : isActive ? "brightness-105 saturate-105" : "brightness-75 saturate-[0.55]"
                          ].join(" ")}
                        />
                        <div
                          className={[
                            "absolute inset-0",
                            isPrimary
                              ? "bg-emerald-400/12"
                              : isActive
                                ? "bg-black/34"
                                : "bg-black/82"
                          ].join(" ")}
                        />
                      </>
                    ) : null}
                    <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">{heroSigil(hero)}</span>
                  </div>
                    );
                  })()
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
      </section>

      <div className={logSkin.wrap}>
        {logSkin.overlays}
        <div className="relative p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Registros</h3>
          <span className="text-xs text-pal-muted">efeito {"->"} registro {"->"} status</span>
        </div>
        <motion.div
          key={timelineAnimationKey}
          initial={false}
          animate="show"
          variants={{
            show: {
              transition: {
                staggerChildren: 0.045,
                delayChildren: 0.01
              }
            }
          }}
          className="max-h-[220px] space-y-2 overflow-auto pr-1"
        >
          {timelineEvents.length === 0 ? <p className="text-sm text-pal-muted">Sem eventos ainda. Dispare ações em Missões/Biblioteca.</p> : null}
          <AnimatePresence initial={false} mode="popLayout">
            {timelineEvents.map((evt, idx) => (
              <motion.div
                key={evt.id}
                layout="position"
                variants={{
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)"
                  }
                }}
                initial={{ opacity: 0, y: -16, scale: 0.985, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, scale: 0.99, filter: "blur(4px)" }}
                transition={{
                  layout: { type: "spring", stiffness: 360, damping: 30, mass: 0.7 },
                  opacity: { duration: 0.22, ease: "easeOut", delay: idx < 5 ? idx * 0.02 : 0 },
                  y: { type: "spring", stiffness: 420, damping: 32, mass: 0.6, delay: idx < 5 ? idx * 0.02 : 0 },
                  scale: { duration: 0.2, ease: "easeOut" },
                  filter: { duration: 0.22, ease: "easeOut" }
                }}
                className={[
                  "group relative overflow-hidden rounded-lg border bg-black/15 px-3 py-2 text-xs transition-colors",
                  eventTone(evt),
                  idx === 0 ? "shadow-[0_0_20px_rgba(232,178,58,0.08)]" : ""
                ].join(" ")}
              >
                {idx < 2 ? (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    initial={{ opacity: 0.38 }}
                    animate={{ opacity: [0.26, 0.04, 0.14] }}
                    transition={{ duration: 2.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_18%,rgba(232,178,58,0.08),transparent_46%)]" />
                  </motion.div>
                ) : null}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-[-30%] w-[32%] skew-x-[-18deg] opacity-0 group-hover:opacity-100"
                  animate={{ x: ["0%", "420%"] }}
                  transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.04)_45%,rgba(255,255,255,0.12)_52%,rgba(255,255,255,0.04)_60%,transparent_100%)]" />
                </motion.div>
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
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <div className={missionsSkin.wrap}>
          {missionsSkin.overlays}
          <div className="relative p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Missões Ativas</h3>
            <span className={["text-xs", newestEventAt ? "text-amber-200" : "text-pal-muted"].join(" ")}>fila viva</span>
          </div>
          <div className="space-y-2">
            {missionEvents.length === 0 ? <p className="text-sm text-pal-muted">Inicie uma missão para ver progresso aqui.</p> : null}
            {missionEvents.map((evt) => (
              <div key={evt.id} className="group relative overflow-hidden rounded-lg border border-pal-gold/10 bg-black/20 p-3">
                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_12%_20%,rgba(232,178,58,0.08),transparent_40%)]" />
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-[-32%] w-[34%] skew-x-[-18deg] opacity-0 group-hover:opacity-100"
                  animate={{ x: ["0%", "400%"] }}
                  transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,226,164,0.11)_52%,rgba(255,255,255,0.03)_60%,transparent_100%)]" />
                </motion.div>
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
          </div>
        </div>

        <div className={librarySkin.wrap}>
          {librarySkin.overlays}
          <div className="relative p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Biblioteca / Cache</h3>
            <span className="text-xs text-pal-muted">Redis + Postgres</span>
          </div>
          <div className="space-y-2">
            {libraryEvents.length === 0 ? <p className="text-sm text-pal-muted">Faça buscas/knocks/feat na Biblioteca para alimentar este painel.</p> : null}
            {libraryEvents.map((evt) => (
              <div key={evt.id} className="group relative overflow-hidden rounded-lg border border-pal-gold/10 bg-black/20 p-3">
                <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,0.08),transparent_40%)]" />
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-[-32%] w-[34%] skew-x-[-18deg] opacity-0 group-hover:opacity-100"
                  animate={{ x: ["0%", "400%"] }}
                  transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(125,211,252,0.11)_52%,rgba(255,255,255,0.03)_60%,transparent_100%)]" />
                </motion.div>
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
          </div>
        </div>

        <div className={summarySkin.wrap}>
          {summarySkin.overlays}
          <div className="relative p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resumo Operacional</h3>
            <span className="text-xs text-pal-muted">fluxo completo</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="group relative overflow-hidden rounded-lg border border-pal-gold/10 bg-black/20 p-3">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_10%_14%,rgba(232,178,58,0.07),transparent_42%)]" />
              <div className="text-xs uppercase tracking-[0.14em] text-pal-gold/80">Missão</div>
              <div className="mt-1 text-pal-text">{missionWidget.phase}</div>
              <div className="text-xs text-pal-muted">{missionWidget.heroName ? `${missionWidget.heroName} • ${missionWidget.missionType ?? ""}` : "Sem missão recente"}</div>
            </div>
            <div className="group relative overflow-hidden rounded-lg border border-pal-gold/10 bg-black/20 p-3">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_10%_14%,rgba(56,189,248,0.06),transparent_42%)]" />
              <div className="text-xs uppercase tracking-[0.14em] text-pal-gold/80">Artefato / Cache</div>
              <div className="mt-1 text-pal-text">{libraryWidget.mode === "score" ? "score handoff" : (latestLibraryEvent?.stage ?? "idle")}</div>
              <div className="text-xs text-pal-muted">{libraryWidget.heroName ? `${libraryWidget.heroName}${libraryWidget.pointsAwarded ? ` +${libraryWidget.pointsAwarded}` : ""}` : (latestLibraryEvent?.label ?? "Sem evento de biblioteca")}</div>
            </div>
            <div className="group relative overflow-hidden rounded-lg border border-pal-gold/10 bg-black/20 p-3">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 bg-[radial-gradient(circle_at_10%_14%,rgba(16,185,129,0.06),transparent_42%)]" />
              <div className="text-xs uppercase tracking-[0.14em] text-pal-gold/80">Infra</div>
              <div className="mt-1 text-pal-text">{latestInfraEvent?.service ?? "runtime"}</div>
              <div className="text-xs text-pal-muted">{widgetPulse.infra.label}</div>
            </div>
          </div>
          </div>
        </div>
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
