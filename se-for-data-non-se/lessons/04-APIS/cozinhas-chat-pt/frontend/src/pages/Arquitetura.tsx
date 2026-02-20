import { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Boxes, Database, Globe, Server, Sparkles, Workflow } from 'lucide-react';

type ServiceId = 'browser' | 'nginx' | 'api' | 'redis' | 'postgres' | 'executor';
type FlowMode = 'runtime' | 'read' | 'write' | 'brigade';

type ServiceNodeData = {
  title: string;
  subtitle: string;
  port: string;
  tone: 'client' | 'gateway' | 'service' | 'data';
};

const FLOW_LABELS: Record<FlowMode, string> = {
  runtime: 'Runtime completo',
  read: 'Leitura',
  write: 'Escrita',
  brigade: 'Brigada',
};

const MODE_EDGE_IDS: Record<FlowMode, string[]> = {
  runtime: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'],
  read: ['e1', 'e2', 'e3'],
  write: ['e1', 'e2', 'e4', 'e3'],
  brigade: ['e1', 'e5', 'e6'],
};

const FLOW_DETAILS: Record<FlowMode, string[]> = {
  runtime: [
    'Browser entra por Nginx e distribui para API e Executor.',
    'API integra Redis (cache) e PostgreSQL (persistencia).',
    'Brigada usa sandbox com chamadas internas para API.',
  ],
  read: [
    'Browser -> Nginx -> API para consultas.',
    'API tenta Redis primeiro para respostas rapidas.',
    'Fallback para banco ocorre apenas se o cache estiver vazio.',
  ],
  write: [
    'Browser -> Nginx -> API para mutacao.',
    'Escrita persiste em PostgreSQL.',
    'Chaves Redis relacionadas sao invalidadas em seguida.',
  ],
  brigade: [
    'Nginx encaminha /executor para sandbox isolado.',
    'Script da Brigada chama a API interna quando necessario.',
    'Fluxo seguro sem expor portas internas ao cliente final.',
  ],
};

const BASE_NODES: Node<ServiceNodeData>[] = [
  {
    id: 'browser',
    position: { x: 20, y: 140 },
    type: 'service',
    data: { title: 'Browser', subtitle: 'React + Vite', port: 'user', tone: 'client' },
  },
  {
    id: 'nginx',
    position: { x: 260, y: 140 },
    type: 'service',
    data: { title: 'Nginx', subtitle: 'Reverse Proxy', port: '80', tone: 'gateway' },
  },
  {
    id: 'api',
    position: { x: 500, y: 140 },
    type: 'service',
    data: { title: 'FastAPI', subtitle: 'Regras + Fluxo', port: '8000', tone: 'service' },
  },
  {
    id: 'redis',
    position: { x: 760, y: 48 },
    type: 'service',
    data: { title: 'Redis', subtitle: 'Cache quente', port: '6379', tone: 'data' },
  },
  {
    id: 'postgres',
    position: { x: 760, y: 232 },
    type: 'service',
    data: { title: 'PostgreSQL', subtitle: 'Persistencia', port: '5432', tone: 'data' },
  },
  {
    id: 'executor',
    position: { x: 260, y: 280 },
    type: 'service',
    data: { title: 'Executor', subtitle: 'Sandbox code', port: '8001', tone: 'service' },
  },
];

const BASE_EDGES: Edge[] = [
  { id: 'e1', source: 'browser', sourceHandle: 'source-right', target: 'nginx', targetHandle: 'target-left', label: 'HTTP :80', type: 'smoothstep' },
  { id: 'e2', source: 'nginx', sourceHandle: 'source-right', target: 'api', targetHandle: 'target-left', label: 'proxy /api/*', type: 'smoothstep' },
  { id: 'e3', source: 'api', sourceHandle: 'source-top', target: 'redis', targetHandle: 'target-left', label: 'GET/SET cache', type: 'smoothstep' },
  { id: 'e4', source: 'api', sourceHandle: 'source-right', target: 'postgres', targetHandle: 'target-left', label: 'SQL write/read', type: 'smoothstep' },
  { id: 'e5', source: 'nginx', sourceHandle: 'source-bottom', target: 'executor', targetHandle: 'target-top', label: 'proxy /executor/*', type: 'smoothstep' },
  { id: 'e6', source: 'executor', sourceHandle: 'source-right', target: 'api', targetHandle: 'target-bottom', label: 'http://api:8000', type: 'smoothstep' },
];

const EDGE_DETAIL: Record<string, string> = {
  e1: 'Entrada oficial dos clientes web.',
  e2: 'Roteamento para endpoints da API.',
  e3: 'Leituras cacheadas e invalidadas em mutacoes.',
  e4: 'Persistencia de menu, salao, cozinha e eventos.',
  e5: 'Execucao de codigo isolado da Brigada.',
  e6: 'Sandbox acessa API interna sem expor credenciais.',
};

const TONE_STYLES: Record<ServiceNodeData['tone'], string> = {
  client: 'border-[#6f89a6] bg-[#102033]',
  gateway: 'border-[#b3854d] bg-[#2b1f14]',
  service: 'border-[#d4641a] bg-[#2c1a13]',
  data: 'border-[#3f8a6f] bg-[#112821]',
};

function ServiceNode({ data, selected }: NodeProps<Node<ServiceNodeData>>) {
  return (
    <>
      <Handle id="target-left" type="target" position={Position.Left} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <Handle id="target-right" type="target" position={Position.Right} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <Handle id="target-top" type="target" position={Position.Top} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <Handle id="target-bottom" type="target" position={Position.Bottom} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <Handle id="source-left" type="source" position={Position.Left} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <Handle id="source-right" type="source" position={Position.Right} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <Handle id="source-top" type="source" position={Position.Top} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <Handle id="source-bottom" type="source" position={Position.Bottom} style={{ width: 8, height: 8, background: '#f59d52', opacity: 0 }} />
      <div
        className={`min-w-[190px] rounded-xl border p-3 text-left shadow-[0_10px_25px_rgba(0,0,0,0.28)] ${TONE_STYLES[data.tone]} ${
          selected ? 'ring-2 ring-[#f59d52]' : ''
        }`}
      >
        <p className="text-sm font-bold text-[#f6eadf]">{data.title}</p>
        <p className="mt-0.5 text-xs text-[#d8c5b3]">{data.subtitle}</p>
        <p className="mt-2 inline-flex rounded-md bg-black/30 px-2 py-0.5 font-mono text-[11px] text-[#f3d6b6]">:{data.port}</p>
      </div>
    </>
  );
}

const nodeTypes: NodeTypes = { service: ServiceNode };

export default function Arquitetura() {
  const [selectedNodeId, setSelectedNodeId] = useState<ServiceId>('api');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [flowMode, setFlowMode] = useState<FlowMode>('runtime');

  const activeEdges = MODE_EDGE_IDS[flowMode];

  const nodes = useMemo(
    () =>
      BASE_NODES.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [selectedNodeId],
  );

  const edges = useMemo(
    () =>
      BASE_EDGES.map((edge) => {
        const active = activeEdges.includes(edge.id);
        const selected = selectedEdgeId === edge.id;
        return {
          ...edge,
          animated: active || selected,
          style: {
            stroke: selected ? '#ffb979' : active ? '#f59d52' : '#5d6b78',
            strokeWidth: selected ? 3 : active ? 2.4 : 1.4,
            strokeDasharray: edge.id === 'e3' || edge.id === 'e6' ? '7 5' : undefined,
          },
          labelStyle: { fill: '#d9e4ee', fontSize: 11, fontWeight: 600 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: selected ? '#ffb979' : active ? '#f59d52' : '#5d6b78',
          },
        };
      }),
    [activeEdges, selectedEdgeId],
  );

  const selectedNode = BASE_NODES.find((node) => node.id === selectedNodeId)!;
  const selectedEdge = selectedEdgeId ? BASE_EDGES.find((edge) => edge.id === selectedEdgeId) || null : null;

  function setMode(mode: FlowMode) {
    setFlowMode(mode);
    setSelectedEdgeId(null);
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#121923] p-5 text-[#e8eef5]">
      <div>
        <h1 className="flex items-center gap-2 font-display text-5xl">
          <Boxes size={32} /> Arquitetura
        </h1>
        <p className="mt-1 text-sm text-[#b9c6d3]">Mapa interativo de runtime com foco nos fluxos de Cardapio, Salao e Cozinha.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.38fr_1fr]">
        <section className="rounded-xl border border-white/10 bg-[#0f141a] p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-md bg-[#1d2733] px-2 py-1 text-xs text-[#ced9e4]">
              <Workflow size={13} /> Runtime map
            </span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FLOW_LABELS) as FlowMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMode(mode)}
                  className={`rounded-md px-2.5 py-1 text-xs ${
                    flowMode === mode ? 'bg-[#8f1f2e] text-white' : 'bg-white/10 text-[#d4e0ec] hover:bg-white/20'
                  }`}
                >
                  {FLOW_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[470px] overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_20%_10%,#1e2b39,transparent_45%),radial-gradient(circle_at_80%_90%,#2a1d17,transparent_35%),#10151b]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.12 }}
              nodesConnectable={false}
              nodesDraggable={false}
              onNodeClick={(_, node) => {
                setSelectedNodeId(node.id as ServiceId);
                setSelectedEdgeId(null);
              }}
              onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
            >
              <MiniMap
                pannable
                zoomable
                nodeBorderRadius={8}
                maskColor="rgba(7, 10, 15, 0.65)"
                nodeColor={(node) => {
                  if (node.id === 'api') return '#d4641a';
                  if (node.id === 'redis' || node.id === 'postgres') return '#3f8a6f';
                  if (node.id === 'nginx') return '#b3854d';
                  return '#70859b';
                }}
              />
              <Controls position="bottom-left" />
              <Background gap={16} size={1} color="#2a3440" />
            </ReactFlow>
          </div>
        </section>

        <aside className="space-y-3">
          <section className="rounded-xl border border-white/10 bg-[#0f141a] p-4">
            {selectedEdge ? (
              <>
                <h3 className="font-display text-3xl">Conexao selecionada</h3>
                <p className="mt-2 text-sm text-[#e9d2bf]">{selectedEdge.label}</p>
                <p className="mt-1 text-sm text-[#b9c6d3]">{EDGE_DETAIL[selectedEdge.id]}</p>
              </>
            ) : (
              <>
                <h3 className="font-display text-3xl">Servico selecionado</h3>
                <p className="mt-2 text-sm text-[#e9d2bf]">{selectedNode.data.title}</p>
                <p className="mt-1 text-sm text-[#b9c6d3]">{selectedNode.data.subtitle}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-white/10 px-2 py-1">Porta: {selectedNode.data.port}</span>
                  <span className="rounded-md bg-white/10 px-2 py-1">Modo: {FLOW_LABELS[flowMode]}</span>
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0f141a] p-4">
            <h3 className="mb-2 font-display text-2xl">Fluxo ativo</h3>
            <ul className="space-y-1 text-sm text-[#c7d2de]">
              {FLOW_DETAILS[flowMode].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5" size={14} />
                  <span>{item}</span>
                </li>
              ))}
              <li className="mt-2 flex items-start gap-2 text-[#aebdcb]">
                <Globe className="mt-0.5" size={14} />
                <span>Cardapio e Salao criam demanda; Cozinha consome tickets; tudo rastreavel por API e SQL.</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0f141a] p-4">
            <h3 className="mb-2 font-display text-2xl">Garantias</h3>
            <ul className="space-y-1 text-sm text-[#c7d2de]">
              <li className="flex items-center gap-2">
                <Server size={14} /> Nginx centraliza entrada e roteamento.
              </li>
              <li className="flex items-center gap-2">
                <Database size={14} /> PostgreSQL persiste dados de menu, mesas e tickets.
              </li>
              <li className="flex items-center gap-2">
                <Workflow size={14} /> Redis acelera leitura com invalidacao em mutacoes.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
