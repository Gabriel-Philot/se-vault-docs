import PatternCard from "../components/learn/PatternCard";

const cards = [
  {
    id: "strategy",
    name: "Strategy",
    why: "Apply country-specific pricing/tax logic without changing pipeline control flow.",
    where: "TaxStrategyFactory in backend chooses BR/US/default behavior.",
    runtimeEvidence: "`transformed` events include `taxed_total` after strategy execution.",
    antiPattern: "Huge if/elif chain for country logic inside the request handler.",
    testHint: "Assert BR and US produce different taxed totals for the same base amount.",
    codeRef: {
      file: "backend/app/state.py",
      snippet: "class BrTaxStrategy(TaxStrategy):\n    def apply(self, amount: float) -> float:\n        return round(amount * 1.17, 2)",
    },
  },
  {
    id: "factory",
    name: "Factory",
    why: "Centralize connector/sink creation and keep routing logic clean.",
    where: "SinkFactory maps `audit` and `warehouse` to concrete sink classes.",
    runtimeEvidence: "`sink_written` events identify which sink processed data.",
    antiPattern: "Instantiate concrete sink classes inline in every route.",
    testHint: "Verify unknown sink type fails fast with clear error.",
    codeRef: {
      file: "backend/app/state.py",
      snippet: "class SinkFactory:\n    _registry = {\n        \"audit\": AuditSink,\n        \"warehouse\": WarehouseSink,\n    }",
    },
  },
  {
    id: "adapter",
    name: "Adapter",
    why: "Normalize Debezium-like envelope into one canonical structure for downstream stages.",
    where: "DebeziumAdapter.to_canonical translates nested CDC payload fields.",
    runtimeEvidence: "`translated` events show canonical order event fields.",
    antiPattern: "Each stage reading raw CDC envelope shape directly.",
    testHint: "Validate mapping from payload.after.* to canonical fields.",
    codeRef: {
      file: "backend/app/state.py",
      snippet: "class DebeziumAdapter:\n    @staticmethod\n    def to_canonical(envelope: dict[str, Any]) -> dict[str, Any]:\n        payload = envelope[\"payload\"]",
    },
  },
  {
    id: "observer",
    name: "Observer / PubSub",
    why: "Decouple producer and consumers for runtime events and timeline updates.",
    where: "AppState maintains subscriber queues and publishes events asynchronously.",
    runtimeEvidence: "Timeline receives events in near real time via SSE.",
    antiPattern: "Tight coupling where business logic calls UI-specific code.",
    testHint: "Subscribe two listeners and ensure both receive the same event.",
    codeRef: {
      file: "backend/app/state.py",
      snippet: "async def publish(self, event_type: str, data: dict[str, Any]) -> None:\n    event = {\"event_type\": event_type, \"timestamp\": utc_now_iso(), \"data\": data}",
    },
  },
  {
    id: "idempotent",
    name: "Idempotent Consumer",
    why: "Prevent duplicate processing when replay/retry sends same event id.",
    where: "`processed_event_ids` guard in API route before pipeline stages.",
    runtimeEvidence: "Clicking Replay emits `duplicate_skipped` instead of duplicating aggregates.",
    antiPattern: "Blindly applying every incoming event to analytics sink.",
    testHint: "Process same event twice and assert totals do not change.",
    codeRef: {
      file: "backend/app/routers/api.py",
      snippet: "if event_id in state.processed_event_ids:\n    await state.publish(\"duplicate_skipped\", {\"event_id\": event_id})\n    return",
    },
  },
  {
    id: "router",
    name: "Router / Translator / Aggregator",
    why: "Route by value, translate message format, then aggregate business totals.",
    where: "`_emit_cdc_for_order` performs routing and analytics updates on COMPLETED.",
    runtimeEvidence: "`routed`, `translated`, and `aggregated` events in timeline.",
    antiPattern: "One giant function mixing parsing, branching, and aggregation with no boundaries.",
    testHint: "Set threshold low/high and assert route output changes.",
    codeRef: {
      file: "backend/app/routers/api.py",
      snippet: "route = \"high_value\" if canonical[\"total_price\"] >= state.route_threshold else \"normal\"\nawait state.publish(\"routed\", {\"order_id\": canonical[\"order_id\"], \"route\": route})",
    },
  },
  {
    id: "template",
    name: "Template Method + Composition",
    why: "Keep lifecycle order fixed while composing independent processing stages.",
    where: "Order lifecycle progression calls shared CDC emission flow at each state transition.",
    runtimeEvidence: "Repeated sequence of stage events across CREATED/PAYMENT_PENDING/COMPLETED.",
    antiPattern: "Copy/paste pipeline logic for each status transition.",
    testHint: "Assert event sequence order remains stable across statuses.",
    codeRef: {
      file: "backend/app/routers/api.py",
      snippet: "await _emit_cdc_for_order(order_id, old, order.status)\n# called in each lifecycle transition",
    },
  },
];

export default function LearnPage() {
  return (
    <div className="learn-wrap">
      <header className="learn-hero">
        <h2>Pattern Guide</h2>
        <p>
          This page maps each design pattern to concrete files and runtime evidence in the DataFlow Lab.
        </p>
      </header>

      <div className="learn-grid">
        {cards.map((card) => (
          <PatternCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
