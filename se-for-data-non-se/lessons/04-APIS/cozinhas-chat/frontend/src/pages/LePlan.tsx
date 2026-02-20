import { Boxes, Database, Globe, Server, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';

type NodeId = 'browser' | 'nginx' | 'api' | 'redis' | 'postgres' | 'executor';

interface Node {
  id: NodeId;
  title: string;
  subtitle: string;
  port: string;
  category: 'client' | 'gateway' | 'service' | 'data';
  x: number;
  y: number;
}

interface Edge {
  id: string;
  from: NodeId;
  to: NodeId;
  label: string;
  detail: string;
  dashed?: boolean;
}

const NODES: Node[] = [
  { id: 'browser', title: 'Browser', subtitle: 'React + Vite', port: 'user', category: 'client', x: 24, y: 112 },
  { id: 'nginx', title: 'Nginx', subtitle: 'Reverse Proxy', port: '80', category: 'gateway', x: 222, y: 112 },
  { id: 'api', title: 'FastAPI', subtitle: 'Python API', port: '8000', category: 'service', x: 420, y: 112 },
  { id: 'redis', title: 'Redis', subtitle: 'Cache Layer', port: '6379', category: 'data', x: 618, y: 34 },
  { id: 'postgres', title: 'PostgreSQL', subtitle: 'Primary DB', port: '5432', category: 'data', x: 618, y: 192 },
  { id: 'executor', title: 'Executor', subtitle: 'Sandbox Python', port: '8001', category: 'service', x: 222, y: 248 },
];

const EDGES: Edge[] = [
  { id: 'e1', from: 'browser', to: 'nginx', label: 'HTTP :80', detail: 'Entrada de tráfego do cliente.' },
  { id: 'e2', from: 'nginx', to: 'api', label: 'proxy /api/*', detail: 'Nginx encaminha chamadas da API.' },
  { id: 'e3', from: 'api', to: 'redis', label: 'GET/SET', detail: 'Leituras com cache-aside.', dashed: true },
  { id: 'e4', from: 'api', to: 'postgres', label: 'SQL', detail: 'Persistência de dados transacionais.' },
  { id: 'e5', from: 'nginx', to: 'executor', label: 'proxy /executor/*', detail: 'Roteamento para execução de código.' },
  { id: 'e6', from: 'executor', to: 'api', label: 'http://api:8000', detail: 'Exercícios podem chamar API internamente.', dashed: true },
];

const CATEGORY_LABEL: Record<Node['category'], string> = {
  client: 'Client',
  gateway: 'Gateway',
  service: 'Service',
  data: 'Data Store',
};

export default function LePlan() {
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId>('api');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const selectedNode = useMemo(() => NODES.find((node) => node.id === selectedNodeId)!, [selectedNodeId]);
  const selectedEdge = useMemo(() => EDGES.find((edge) => edge.id === selectedEdgeId) || null, [selectedEdgeId]);

  function selectNode(id: NodeId) {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  }

  function selectEdge(id: string) {
    setSelectedEdgeId(id);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Boxes size={26} /> Le Plan</h1>
        <p className="page-subtitle">Diagrama arquitetural da plataforma e fluxo entre serviços em runtime.</p>
      </div>

      <div className="arch-layout">
        <section className="card arch-card">
          <div className="arch-topbar">
            <span className="arch-chip"><Workflow size={13} /> Fluxo de Containers</span>
            <span className="arch-chip muted">Clique em um nó ou conexão para detalhes</span>
          </div>

          <svg className="arch-svg" viewBox="0 0 820 360" role="img" aria-label="Arquitetura do sistema">
            <defs>
              <marker id="archArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
              </marker>
            </defs>

            {EDGES.map((edge) => {
              const from = NODES.find((node) => node.id === edge.from)!;
              const to = NODES.find((node) => node.id === edge.to)!;
              const active = selectedEdgeId === edge.id;

              return (
                <g key={edge.id} onClick={() => selectEdge(edge.id)} style={{ cursor: 'pointer', color: active ? '#d4641a' : '#7a8590' }}>
                  <line
                    x1={from.x + 82}
                    y1={from.y + 33}
                    x2={to.x + 82}
                    y2={to.y + 33}
                    stroke="currentColor"
                    strokeWidth={active ? 2.8 : 1.8}
                    strokeDasharray={edge.dashed ? '7 5' : undefined}
                    markerEnd="url(#archArrow)"
                  />
                  <text
                    x={(from.x + to.x) / 2 + 82}
                    y={(from.y + to.y) / 2 + 12}
                    textAnchor="middle"
                    fill="currentColor"
                    style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {NODES.map((node) => {
              const active = selectedNodeId === node.id;
              return (
                <g key={node.id} className={`arch-node arch-${node.category} ${active ? 'active' : ''}`} onClick={() => selectNode(node.id)}>
                  <rect x={node.x} y={node.y} width="164" height="66" rx="8" />
                  <text x={node.x + 14} y={node.y + 25} className="arch-node-title">{node.title}</text>
                  <text x={node.x + 14} y={node.y + 43} className="arch-node-subtitle">{node.subtitle}</text>
                  <text x={node.x + 14} y={node.y + 58} className="arch-node-port">:{node.port}</text>
                </g>
              );
            })}
          </svg>
        </section>

        <aside className="card arch-detail">
          {selectedEdge ? (
            <>
              <h3 className="card-title">Conexão Selecionada</h3>
              <p className="page-subtitle" style={{ marginBottom: '0.4rem' }}>{selectedEdge.label}</p>
              <p>{selectedEdge.detail}</p>
            </>
          ) : (
            <>
              <h3 className="card-title">Serviço Selecionado</h3>
              <p className="page-subtitle" style={{ marginBottom: '0.35rem' }}>{selectedNode.title}</p>
              <p>{selectedNode.subtitle}</p>
              <div className="arch-meta-grid">
                <span className="badge badge-gray">Categoria: {CATEGORY_LABEL[selectedNode.category]}</span>
                <span className="badge badge-gray">Porta: {selectedNode.port}</span>
              </div>
            </>
          )}

          <div className="lesson-box">
            <h4>Fluxos Principais</h4>
            <p>Leitura: Browser → Nginx → API → Redis/PostgreSQL.</p>
            <p>Escrita: API persiste no PostgreSQL e invalida cache Redis.</p>
            <p>Code Lab: Nginx encaminha para Executor, com chamadas internas à API quando necessário.</p>
          </div>

          <div className="arch-legend">
            <span className="arch-legend-item"><Globe size={13} /> Client</span>
            <span className="arch-legend-item"><Server size={13} /> Service</span>
            <span className="arch-legend-item"><Database size={13} /> Data</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
