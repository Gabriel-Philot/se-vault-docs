import { useState } from "react";

import { PageCard } from "../components/shared/PageCard";
import { usePollingResource } from "../hooks/usePollingResource";
import { api, HttpError } from "../lib/api";
import { assets } from "../lib/assets";
import type { GateKnockEnvelope, LeaderboardEntry, RegionEnvelope, SqlQueryResultEnvelope } from "../lib/types";

const SQL_PRESETS = [
  {
    id: "telemetry_recent",
    label: "Telemetry recente",
    description: "Últimos eventos do sistema",
    query: `SELECT id, created_at, kind, stage, service, status, entity_id
FROM telemetry_events
ORDER BY created_at DESC
LIMIT 30`
  },
  {
    id: "telemetry_event_types",
    label: "Eventos por tipo",
    description: "Agregado por kind/stage",
    query: `SELECT kind, stage, COUNT(*) AS total
FROM telemetry_events
GROUP BY kind, stage
ORDER BY total DESC, kind, stage
LIMIT 50`
  },
  {
    id: "telemetry_by_service",
    label: "Por serviço",
    description: "Contagem por service/status",
    query: `SELECT service, status, COUNT(*) AS total
FROM telemetry_events
GROUP BY service, status
ORDER BY service, status`
  },
  {
    id: "heroes_leaderboard_raw",
    label: "Heroes raw",
    description: "Pontuação no Postgres",
    query: `SELECT hero_key, display_name, score, updated_at
FROM heroes
ORDER BY score DESC, hero_key
LIMIT 20`
  },
  {
    id: "missions_recent",
    label: "Missions raw",
    description: "Missões persistidas",
    query: `SELECT id, mission_type, status, progress_pct, created_at, updated_at
FROM missions
ORDER BY created_at DESC
LIMIT 30`
  },
  {
    id: "mission_reward_events",
    label: "Reward events",
    description: "Persistência + score + leaderboard",
    query: `SELECT created_at, kind, stage, service, entity_id, payload_json
FROM telemetry_events
WHERE stage IN ('hero_scored', 'leaderboard_update', 'mission_persisted')
ORDER BY created_at DESC
LIMIT 40`
  }
] as const;

function asCell(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function LibraryPage() {
  const [regionData, setRegionData] = useState<RegionEnvelope | null>(null);
  const [knockData, setKnockData] = useState<GateKnockEnvelope | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState<string>(SQL_PRESETS[0].query);
  const [selectedPreset, setSelectedPreset] = useState<string>(SQL_PRESETS[0].id);
  const [sqlBusy, setSqlBusy] = useState(false);
  const [sqlError, setSqlError] = useState<string>("");
  const [sqlResult, setSqlResult] = useState<SqlQueryResultEnvelope | null>(null);

  const stats = usePollingResource(() => api.library.stats().then((r) => r.data), 3000);

  const loadRegion = async (region: string) => {
    try {
      const res = await api.library.region(region);
      setRegionData(res.data);
      setMsg(`Regiao carregada: ${res.data.title}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Falha ao buscar regiao");
    }
  };

  const knock = async () => {
    try {
      const res = await api.library.knock();
      setKnockData(res.data);
      setMsg(`Gate: ${res.data.message}`);
    } catch (err) {
      if (err instanceof HttpError && err.payload?.error?.details) {
        const details = err.payload.error.details as Partial<GateKnockEnvelope>;
        setKnockData({
          allowed: false,
          message: "Gate closed",
          remaining: Number(details.remaining ?? 0),
          limit: Number(details.limit ?? 5),
          reset_in_seconds: Number(details.reset_in_seconds ?? 60)
        });
        setMsg(`Gate bloqueado (429) - aguarde ${details.reset_in_seconds ?? 60}s`);
      } else {
        setMsg(err instanceof Error ? err.message : "Falha no gate");
      }
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await api.library.leaderboard();
      setEntries(res.data.entries);
      setMsg("Leaderboard carregado");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Falha ao carregar leaderboard");
    }
  };

  const addRandomFeat = async () => {
    const heroKeys = Object.keys(assets.heroes);
    const hero = heroKeys[Math.floor(Math.random() * heroKeys.length)];
    const points = [5, 10, 15, 20][Math.floor(Math.random() * 4)];
    try {
      const res = await api.library.feat(hero, points);
      setMsg(`Feat registrado: ${hero} +${points} (novo score ${res.data.new_score})`);
      const lb = await api.library.leaderboard();
      setEntries(lb.data.entries);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Falha ao registrar feat");
    }
  };

  const runSql = async () => {
    setSqlBusy(true);
    setSqlError("");
    try {
      const res = await api.library.sql(sqlQuery);
      setSqlResult(res.data);
      setMsg(`Query executada: ${res.data.row_count} linhas`);
    } catch (err) {
      setSqlResult(null);
      setSqlError(err instanceof Error ? err.message : "Falha ao executar SQL");
    } finally {
      setSqlBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="px-1">
        <p className="text-xs uppercase tracking-[0.25em] text-pal-gold/80">Lore / Cache / Records</p>
        <h1 className="mt-1 text-3xl font-semibold text-pal-gold drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">Biblioteca de Rivendell</h1>
        <p className="mt-1 text-sm text-pal-text/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
          Cache, rate limiting, leaderboard e acesso histórico às tabelas do sistema (read-only).
        </p>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-pal-gold/10">
        <img src={assets.ui.libraryBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-28" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(0,0,0,0.10),transparent_35%),radial-gradient(circle_at_75%_30%,rgba(0,0,0,0.22),transparent_42%),radial-gradient(circle_at_55%_70%,rgba(0,0,0,0.18),transparent_40%)]" />
        <div className="relative space-y-4 p-4">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded-lg border border-pal-gold/12 bg-black/28 px-3 py-2 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-wide text-pal-text/65">keys_estimate</div>
              <div className="text-lg font-semibold text-pal-gold drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">{String(stats.data?.keys_estimate ?? "-")}</div>
            </div>
            <div className="rounded-lg border border-pal-gold/12 bg-black/28 px-3 py-2 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-wide text-pal-text/65">cache_hit_rate_pct</div>
              <div className="text-lg font-semibold text-pal-gold drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">{String(stats.data?.cache_hit_rate_pct ?? "-")}</div>
            </div>
            <div className="rounded-lg border border-pal-gold/12 bg-black/28 px-3 py-2 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-wide text-pal-text/65">redis</div>
              <div className={stats.data?.redis_connected ? "text-lg font-semibold text-pal-green" : "text-lg font-semibold text-pal-red"}>
                {String(stats.data?.redis_connected ?? false)}
              </div>
            </div>
            <div className="rounded-lg border border-pal-gold/12 bg-black/28 px-3 py-2 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="text-[11px] uppercase tracking-wide text-pal-text/65">postgres</div>
              <div className={stats.data?.postgres_connected ? "text-lg font-semibold text-pal-green" : "text-lg font-semibold text-pal-red"}>
                {String(stats.data?.postgres_connected ?? false)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.9fr]">
            <div className="rounded-xl border border-pal-gold/12 bg-black/26 p-3 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-pal-text drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">Cache Demo</h2>
                  <p className="text-xs text-pal-text/75">Escolha uma região e observe hit/miss/TTL.</p>
                </div>
                {regionData ? (
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${regionData.cached ? "border-pal-green/30 text-pal-green" : "border-pal-gold/25 text-pal-gold"}`}>
                    {regionData.cached ? "cache hit" : "cache miss"}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ["mordor", assets.regions.mordor],
                  ["rohan", assets.regions.rohan],
                  ["gondor", assets.regions.gondor],
                  ["shire", assets.regions.shire],
                  ["rivendell", assets.regions.rivendell]
                ] as const).map(([region, src]) => (
                  <button
                    key={region}
                    onClick={() => void loadRegion(region)}
                    className="group relative overflow-hidden rounded-lg border border-pal-blue/20 text-left"
                  >
                    <img src={src} alt="" aria-hidden="true" className="h-20 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <span className="absolute bottom-1 left-2 text-xs font-medium uppercase tracking-wide text-pal-text">{region}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                <div className="overflow-hidden rounded-lg border border-pal-gold/10 bg-black/15">
                  <img
                    src={regionData ? `/images/${regionData.image_key}` : assets.regions.rivendell}
                    alt=""
                    aria-hidden="true"
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="rounded-lg border border-pal-gold/12 bg-black/24 p-3 text-sm backdrop-blur-sm">
                  {regionData ? (
                    <>
                      <div className="font-medium text-pal-text drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">{regionData.title}</div>
                      <div className="mt-1 text-pal-text/80">{regionData.description}</div>
                      <div className="mt-2 space-y-1 text-xs text-pal-text/70">
                        <div>cached: {String(regionData.cached)}</div>
                        <div>latency: {regionData.source_latency_ms}ms</div>
                        <div>ttl: {regionData.ttl_seconds_remaining ?? "-"}s</div>
                      </div>
                    </>
                  ) : (
                    <p className="text-pal-text/75">Selecione uma região para abrir os registros da biblioteca.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-pal-gold/12 bg-black/26 p-3 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-pal-text drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">Rate Limit Demo</h2>
                    <p className="text-xs text-pal-text/75">Nginx guarda o portão.</p>
                  </div>
                  <button onClick={() => void knock()} className="rounded-md border border-pal-gold/20 px-3 py-1.5 text-xs hover:bg-pal-gold/10">
                    Bater no portão
                  </button>
                </div>
                <div className="mt-3 rounded-lg border border-pal-gold/12 bg-black/24 p-3 text-sm backdrop-blur-sm">
                  {knockData ? (
                    <>
                      <div className={knockData.allowed ? "text-pal-green" : "text-pal-red"}>{knockData.message}</div>
                      <div className="mt-1 text-pal-text/75">remaining: {knockData.remaining}/{knockData.limit}</div>
                      <div className="text-pal-text/75">reset: {knockData.reset_in_seconds}s</div>
                    </>
                  ) : (
                    <p className="text-pal-text/75">Sem tentativa ainda.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-pal-gold/12 bg-black/26 p-3 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
                <h2 className="font-semibold text-pal-text drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">Leitura rápida</h2>
                <p className="text-xs text-pal-text/75">Resumo operacional da biblioteca.</p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg border border-pal-gold/12 bg-black/24 p-2 backdrop-blur-sm">
                    <div className="text-[11px] uppercase tracking-wide text-pal-text/65">Último acesso</div>
                    <div className="text-sm text-pal-text drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]">{regionData ? regionData.title : "Nenhuma região aberta"}</div>
                  </div>
                  <div className="rounded-lg border border-pal-gold/12 bg-black/24 p-2 backdrop-blur-sm">
                    <div className="text-[11px] uppercase tracking-wide text-pal-text/65">Cache status</div>
                    <div className="text-sm text-pal-text drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]">
                      {regionData ? (regionData.cached ? "Hit confirmado" : "Miss -> fonte -> cache write") : "Aguardando leitura"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-pal-gold/12 bg-black/24 p-2 backdrop-blur-sm">
                    <div className="text-[11px] uppercase tracking-wide text-pal-text/65">Gate</div>
                    <div className={`text-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] ${knockData?.allowed === false ? "text-pal-red" : "text-pal-text"}`}>
                      {knockData ? `${knockData.message} (${knockData.remaining}/${knockData.limit})` : "Sem tentativas"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-pal-gold/12 bg-black/26 p-3 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-pal-text drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">Leaderboard</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => void addRandomFeat()} className="rounded-md border border-pal-gold/20 px-2 py-1 text-xs hover:bg-pal-gold/10">
                    +Feat
                  </button>
                  <button onClick={() => void loadLeaderboard()} className="rounded-md border border-pal-green/20 px-2 py-1 text-xs hover:bg-pal-green/10">
                    Carregar
                  </button>
                </div>
              </div>
              {entries.length === 0 ? (
                <p className="mt-3 text-sm text-pal-text/75">Top 10 heróis. Dispare feats ou missões para atualizar.</p>
              ) : (
                <ol className="mt-3 space-y-1.5 text-sm">
                  {entries.slice(0, 8).map((entry) => (
                    <li key={entry.hero} className="flex items-center justify-between rounded-md border border-pal-gold/10 bg-black/10 px-2 py-1.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <img
                          src={(assets.heroes as Record<string, string>)[entry.hero] ?? `/images/${entry.avatar_key}`}
                          alt=""
                          aria-hidden="true"
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <span className="truncate">{entry.rank}. {entry.display_name}</span>
                      </span>
                      <span className="text-pal-gold">{entry.score}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </section>

      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pal-gold/70">Acesse Informações Antigas</p>
            <h2 className="text-xl font-semibold">Explorador SQL (somente leitura)</h2>
            <p className="text-sm text-pal-muted">
              Inspiração no chat-pt de APIs: consultas read-only para tabelas de sistema, missões e eventos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runSql()}
            disabled={sqlBusy}
            className="rounded-md border border-pal-gold/20 px-3 py-1.5 text-sm hover:bg-pal-gold/10 disabled:opacity-60"
          >
            {sqlBusy ? "Executando..." : "Executar query"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-pal-gold/10 bg-black/20 p-2">
            <div className="mb-2 px-2 text-xs uppercase tracking-[0.2em] text-pal-muted">Presets</div>
            <div className="space-y-1">
              {SQL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setSqlQuery(preset.query);
                  }}
                  className={`w-full rounded-lg border p-2 text-left ${selectedPreset === preset.id ? "border-pal-gold/25 bg-pal-gold/5" : "border-pal-gold/10 bg-black/10 hover:bg-black/20"}`}
                >
                  <div className="text-sm font-medium">{preset.label}</div>
                  <div className="text-[11px] text-pal-muted">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-pal-gold/10 bg-black/20 p-3">
              <label htmlFor="sql-query" className="mb-2 block text-xs uppercase tracking-[0.2em] text-pal-muted">
                Query
              </label>
              <textarea
                id="sql-query"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-pal-gold/10 bg-black/35 px-3 py-2 font-mono text-xs leading-5 text-pal-text outline-none focus:border-pal-gold/30"
                spellCheck={false}
              />
              <p className="mt-2 text-xs text-pal-muted">
                SELECT only · tabelas permitidas: <code>telemetry_events</code>, <code>heroes</code>, <code>missions</code>
              </p>
            </div>

            {sqlError ? (
              <div className="rounded-xl border border-pal-red/20 bg-pal-red/5 px-3 py-2 text-sm text-pal-red">{sqlError}</div>
            ) : null}

            <div className="rounded-xl border border-pal-gold/10 bg-black/20">
              <div className="flex items-center justify-between gap-2 border-b border-pal-gold/10 px-3 py-2">
                <div className="text-sm font-medium">Resultados</div>
                <div className="text-xs text-pal-muted">
                  {sqlResult ? `${sqlResult.row_count} linhas` : "Execute um preset ou query manual"}
                </div>
              </div>
              <div className="max-h-[420px] overflow-auto">
                {!sqlResult ? (
                  <div className="p-4 text-sm text-pal-muted">Nenhum resultado ainda.</div>
                ) : sqlResult.columns.length === 0 ? (
                  <div className="p-4 text-sm text-pal-muted">Query executada sem colunas retornadas.</div>
                ) : (
                  <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 bg-black/50 backdrop-blur">
                      <tr>
                        {sqlResult.columns.map((column) => (
                          <th key={column} className="border-b border-pal-gold/10 px-3 py-2 font-medium text-pal-gold">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows.map((row, idx) => (
                        <tr key={`row-${idx}`} className="odd:bg-black/10">
                          {row.map((cell, cellIdx) => (
                            <td key={`cell-${idx}-${cellIdx}`} className="max-w-[280px] border-b border-pal-gold/5 px-3 py-2 align-top text-pal-text/90">
                              <div className="line-clamp-3 break-words">{asCell(cell)}</div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
