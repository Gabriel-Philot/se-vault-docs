import { useMemo, useState } from 'react';
import { Box } from 'lucide-react';

type ViewMode = 'container' | 'runtime';
type NodeCategory = 'client' | 'gateway' | 'service' | 'datastore';
type EdgeStyle = 'solid' | 'dashed';
type EdgeCondition = 'always' | 'cache-hit' | 'cache-miss' | 'optional';
type NodeId = 'browser' | 'nginx' | 'fastapi' | 'redis' | 'postgres' | 'executor';

interface ArchitectureNode {
  id: NodeId;
  name: string;
  icon: string;
  port: string;
  responsibility: string;
  tech: string;
  category: NodeCategory;
}

interface ArchitectureEdge {
  id: string;
  from: NodeId;
  to: NodeId;
  label: string;
  description: string;
  style: EdgeStyle;
  condition: EdgeCondition;
}

interface RuntimeStep {
  title: string;
  description: string;
  edgeIds: string[];
}

interface RuntimeFlow {
  id: string;
  title: string;
  description: string;
  edges: ArchitectureEdge[];
  steps: RuntimeStep[];
}

const NODES: ArchitectureNode[] = [
  {
    id: 'browser',
    name: 'Browser',
    icon: '🌐',
    port: 'user',
    responsibility: 'Frontend React consumindo APIs do sistema',
    tech: 'React 19 + Vite',
    category: 'client',
  },
  {
    id: 'nginx',
    name: 'Nginx',
    icon: '🧭',
    port: '80',
    responsibility: 'Gateway e reverse proxy para API e Executor',
    tech: 'Nginx',
    category: 'gateway',
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    icon: '⚡',
    port: '8000',
    responsibility: 'Regras de negocio, CRUD e estatisticas',
    tech: 'Python 3.12 + FastAPI + SQLModel',
    category: 'service',
  },
  {
    id: 'redis',
    name: 'Redis',
    icon: '🧠',
    port: '6379',
    responsibility: 'Cache de respostas para leituras frequentes',
    tech: 'Redis 7',
    category: 'datastore',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    icon: '🐘',
    port: '5432',
    responsibility: 'Persistencia transacional dos dados',
    tech: 'PostgreSQL 16',
    category: 'datastore',
  },
  {
    id: 'executor',
    name: 'Executor',
    icon: '🐍',
    port: '8001',
    responsibility: 'Sandbox Python para executar codigo de aprendizado',
    tech: 'FastAPI + subprocess + httpx',
    category: 'service',
  },
];

const CONTAINER_EDGES: ArchitectureEdge[] = [
  {
    id: 'c1',
    from: 'browser',
    to: 'nginx',
    label: 'HTTP :80',
    description: 'Cliente acessa a aplicacao via Nginx.',
    style: 'solid',
    condition: 'always',
  },
  {
    id: 'c2',
    from: 'nginx',
    to: 'fastapi',
    label: 'proxy /api/*',
    description: 'Nginx encaminha rotas da API para o backend.',
    style: 'solid',
    condition: 'always',
  },
  {
    id: 'c3',
    from: 'nginx',
    to: 'executor',
    label: 'proxy /executor/*',
    description: 'Nginx encaminha execucoes Python para o Executor.',
    style: 'solid',
    condition: 'always',
  },
  {
    id: 'c4',
    from: 'fastapi',
    to: 'redis',
    label: 'Redis GET/SET',
    description: 'FastAPI consulta e atualiza cache quando aplicavel.',
    style: 'dashed',
    condition: 'optional',
  },
  {
    id: 'c5',
    from: 'fastapi',
    to: 'postgres',
    label: 'SQL',
    description: 'FastAPI consulta e persiste dados no banco.',
    style: 'solid',
    condition: 'always',
  },
  {
    id: 'c6',
    from: 'executor',
    to: 'fastapi',
    label: 'http://api:8000',
    description: 'Scripts no Executor podem chamar a API internamente.',
    style: 'dashed',
    condition: 'optional',
  },
];

const RUNTIME_FLOWS: RuntimeFlow[] = [
  {
    id: 'read',
    title: 'Leitura com Cache (GET /api/pets)',
    description: 'Fluxo de consulta com branch de cache-hit e cache-miss.',
    edges: [
      {
        id: 'r1',
        from: 'browser',
        to: 'nginx',
        label: 'GET /api/pets',
        description: 'Cliente inicia leitura.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'r2',
        from: 'nginx',
        to: 'fastapi',
        label: 'proxy /api/*',
        description: 'Nginx encaminha para FastAPI.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'r3',
        from: 'fastapi',
        to: 'redis',
        label: 'GET cache key',
        description: 'Backend verifica se resposta ja esta em cache.',
        style: 'dashed',
        condition: 'always',
      },
      {
        id: 'r4',
        from: 'redis',
        to: 'fastapi',
        label: 'cache hit',
        description: 'Em cache-hit, retorna dados sem consultar banco.',
        style: 'dashed',
        condition: 'cache-hit',
      },
      {
        id: 'r5',
        from: 'fastapi',
        to: 'postgres',
        label: 'SELECT',
        description: 'Em cache-miss, executa consulta SQL.',
        style: 'solid',
        condition: 'cache-miss',
      },
      {
        id: 'r6',
        from: 'fastapi',
        to: 'redis',
        label: 'SET ttl=5s',
        description: 'Resultado e armazenado no Redis para proximas consultas.',
        style: 'dashed',
        condition: 'cache-miss',
      },
      {
        id: 'r7',
        from: 'fastapi',
        to: 'nginx',
        label: 'JSON response',
        description: 'Backend responde com payload final.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'r8',
        from: 'nginx',
        to: 'browser',
        label: 'HTTP 200',
        description: 'Cliente recebe a resposta.',
        style: 'solid',
        condition: 'always',
      },
    ],
    steps: [
      {
        title: 'Entrada da requisicao',
        description: 'Browser envia para Nginx e Nginx encaminha para FastAPI.',
        edgeIds: ['r1', 'r2'],
      },
      {
        title: 'Checagem de cache',
        description: 'FastAPI consulta Redis com a chave da requisicao.',
        edgeIds: ['r3'],
      },
      {
        title: 'Ramo cache-hit',
        description: 'Se houver valor no Redis, FastAPI responde diretamente.',
        edgeIds: ['r4', 'r7', 'r8'],
      },
      {
        title: 'Ramo cache-miss',
        description: 'Se nao houver cache, consulta PostgreSQL, grava no Redis e responde.',
        edgeIds: ['r5', 'r6', 'r7', 'r8'],
      },
    ],
  },
  {
    id: 'write',
    title: 'Escrita + Invalidacao (POST/PATCH/DELETE)',
    description: 'Fluxo de alteracao de dados com invalidacao de cache.',
    edges: [
      {
        id: 'w1',
        from: 'browser',
        to: 'nginx',
        label: 'PATCH /api/pets/{id}',
        description: 'Cliente envia alteracao.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'w2',
        from: 'nginx',
        to: 'fastapi',
        label: 'proxy /api/*',
        description: 'Gateway encaminha para o backend.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'w3',
        from: 'fastapi',
        to: 'postgres',
        label: 'UPDATE/INSERT/DELETE',
        description: 'FastAPI persiste mudanca no banco.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'w4',
        from: 'fastapi',
        to: 'redis',
        label: 'DEL list_pets:* / get_stats:*',
        description: 'Backend invalida chaves de cache apos escrita.',
        style: 'dashed',
        condition: 'always',
      },
      {
        id: 'w5',
        from: 'fastapi',
        to: 'nginx',
        label: '200/201/204',
        description: 'Backend confirma operacao.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'w6',
        from: 'nginx',
        to: 'browser',
        label: 'HTTP response',
        description: 'Cliente recebe status final.',
        style: 'solid',
        condition: 'always',
      },
    ],
    steps: [
      {
        title: 'Entrada de escrita',
        description: 'Browser e Nginx encaminham a requisicao para FastAPI.',
        edgeIds: ['w1', 'w2'],
      },
      {
        title: 'Persistencia',
        description: 'FastAPI executa escrita no PostgreSQL.',
        edgeIds: ['w3'],
      },
      {
        title: 'Coerencia de cache',
        description: 'FastAPI invalida chaves relacionadas no Redis.',
        edgeIds: ['w4'],
      },
      {
        title: 'Retorno ao cliente',
        description: 'Resposta volta por Nginx para o Browser.',
        edgeIds: ['w5', 'w6'],
      },
    ],
  },
  {
    id: 'executor',
    title: 'Code Lab via Executor (/executor/execute)',
    description: 'Fluxo do sandbox Python com chamada opcional a API interna.',
    edges: [
      {
        id: 'x1',
        from: 'browser',
        to: 'nginx',
        label: 'POST /executor/execute',
        description: 'Frontend envia codigo Python.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'x2',
        from: 'nginx',
        to: 'executor',
        label: 'proxy /executor/*',
        description: 'Nginx encaminha para o container executor.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'x3',
        from: 'executor',
        to: 'fastapi',
        label: 'httpx opcional',
        description: 'Script pode chamar API interna, se o codigo fizer request.',
        style: 'dashed',
        condition: 'optional',
      },
      {
        id: 'x4',
        from: 'fastapi',
        to: 'executor',
        label: 'JSON API',
        description: 'API devolve resposta para o script no executor.',
        style: 'dashed',
        condition: 'optional',
      },
      {
        id: 'x5',
        from: 'executor',
        to: 'nginx',
        label: 'output / error',
        description: 'Executor retorna resultado da execucao.',
        style: 'solid',
        condition: 'always',
      },
      {
        id: 'x6',
        from: 'nginx',
        to: 'browser',
        label: 'response',
        description: 'Frontend recebe output final.',
        style: 'solid',
        condition: 'always',
      },
    ],
    steps: [
      {
        title: 'Envio de codigo',
        description: 'Browser envia para Nginx e Nginx entrega ao Executor.',
        edgeIds: ['x1', 'x2'],
      },
      {
        title: 'Execucao em sandbox',
        description: 'Executor roda o script com timeout e ambiente isolado.',
        edgeIds: [],
      },
      {
        title: 'Integracao opcional com API',
        description: 'Se o script usar httpx para /api, ocorre chamada interna.',
        edgeIds: ['x3', 'x4'],
      },
      {
        title: 'Retorno ao frontend',
        description: 'Executor devolve output pelo Nginx para o Browser.',
        edgeIds: ['x5', 'x6'],
      },
    ],
  },
];

const NODE_POSITIONS: Record<ViewMode, Record<NodeId, { x: number; y: number }>> = {
  container: {
    browser: { x: 120, y: 100 },
    nginx: { x: 315, y: 100 },
    fastapi: { x: 510, y: 100 },
    redis: { x: 705, y: 100 },
    postgres: { x: 900, y: 100 },
    executor: { x: 315, y: 285 },
  },
  runtime: {
    browser: { x: 120, y: 100 },
    nginx: { x: 315, y: 100 },
    fastapi: { x: 510, y: 100 },
    redis: { x: 705, y: 50 },
    postgres: { x: 705, y: 185 },
    executor: { x: 315, y: 285 },
  },
};

const CONDITION_LABEL: Record<EdgeCondition, string> = {
  always: 'Sempre',
  optional: 'Opcional',
  'cache-hit': 'Cache hit',
  'cache-miss': 'Cache miss',
};

export default function Architecture() {
  const [view, setView] = useState<ViewMode>('container');
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>('nginx');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string>(RUNTIME_FLOWS[0].id);
  const [stepIndex, setStepIndex] = useState(0);

  const selectedFlow = RUNTIME_FLOWS.find((flow) => flow.id === selectedFlowId) ?? RUNTIME_FLOWS[0];
  const edges = view === 'container' ? CONTAINER_EDGES : selectedFlow.edges;
  const positions = NODE_POSITIONS[view];
  const activeStep = view === 'runtime' ? selectedFlow.steps[stepIndex] : null;

  const selectedNode = selectedNodeId ? NODES.find((node) => node.id === selectedNodeId) ?? null : null;
  const selectedEdge = selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) ?? null : null;

  const highlightedEdgeIds = useMemo(() => {
    const ids = new Set<string>();

    if (view === 'runtime' && activeStep) {
      activeStep.edgeIds.forEach((edgeId) => ids.add(edgeId));
    }

    if (selectedNodeId) {
      edges
        .filter((edge) => edge.from === selectedNodeId || edge.to === selectedNodeId)
        .forEach((edge) => ids.add(edge.id));
    }

    if (selectedEdgeId) {
      ids.add(selectedEdgeId);
    }

    return ids;
  }, [activeStep, edges, selectedEdgeId, selectedNodeId, view]);

  const nodeConnections = useMemo(() => {
    if (!selectedNode) {
      return { inbound: [] as ArchitectureEdge[], outbound: [] as ArchitectureEdge[] };
    }

    return {
      inbound: edges.filter((edge) => edge.to === selectedNode.id),
      outbound: edges.filter((edge) => edge.from === selectedNode.id),
    };
  }, [edges, selectedNode]);

  function selectNode(id: NodeId) {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  }

  function selectEdge(id: string) {
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  }

  function switchView(nextView: ViewMode) {
    setView(nextView);
    setSelectedEdgeId(null);
    setSelectedNodeId(nextView === 'container' ? 'nginx' : 'fastapi');
  }

  function changeFlow(flowId: string) {
    setSelectedFlowId(flowId);
    setStepIndex(0);
    setSelectedEdgeId(null);
    setSelectedNodeId('fastapi');
  }

  function onEdgeKeyDown(event: React.KeyboardEvent<SVGGElement>, edgeId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectEdge(edgeId);
    }
  }

  return (
    <div className="arch-page">
      <div className="page-header">
        <h1 className="page-title">
          <Box size={28} />
          Arquitetura do Sistema
        </h1>
        <p className="page-subtitle">
          Visualizacao C4 simplificada com visao estrutural e fluxo de runtime.
        </p>
      </div>

      <div className="card arch-controls">
        <div className="arch-view-tabs" role="tablist" aria-label="Selecionar visualizacao">
          <button
            className={`arch-tab ${view === 'container' ? 'active' : ''}`}
            onClick={() => switchView('container')}
            role="tab"
            aria-selected={view === 'container'}
          >
            Visao de Containers
          </button>
          <button
            className={`arch-tab ${view === 'runtime' ? 'active' : ''}`}
            onClick={() => switchView('runtime')}
            role="tab"
            aria-selected={view === 'runtime'}
          >
            Fluxo em Runtime
          </button>
        </div>

        {view === 'runtime' && (
          <div className="arch-flow-picker">
            {RUNTIME_FLOWS.map((flow) => (
              <button
                key={flow.id}
                className={`arch-flow-btn ${flow.id === selectedFlow.id ? 'active' : ''}`}
                onClick={() => changeFlow(flow.id)}
              >
                {flow.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="arch-layout">
        <div className="card arch-diagram-card">
          <div className="arch-diagram-header">
            <h3>{view === 'container' ? 'Container View' : selectedFlow.title}</h3>
            <p>{view === 'container' ? 'Relacoes entre componentes e seus protocolos principais.' : selectedFlow.description}</p>
          </div>

          <div className="arch-diagram-scroll">
            <div className="arch-diagram-canvas">
              <svg className="arch-edges" viewBox="0 0 980 420" aria-label="Fluxo entre servicos">
                <defs>
                  <marker id="arch-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" />
                  </marker>
                </defs>

                {edges.map((edge) => {
                  const start = positions[edge.from];
                  const end = positions[edge.to];
                  const isHighlighted = highlightedEdgeIds.has(edge.id);
                  const isSelected = selectedEdgeId === edge.id;
                  const labelX = (start.x + end.x) / 2;
                  const labelY = (start.y + end.y) / 2 - 8;

                  return (
                    <g
                      key={edge.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectEdge(edge.id)}
                      onKeyDown={(event) => onEdgeKeyDown(event, edge.id)}
                      aria-label={`Aresta ${edge.label}`}
                    >
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        markerEnd="url(#arch-arrow)"
                        className={[
                          'arch-edge-line',
                          edge.style === 'dashed' ? 'dashed' : '',
                          isHighlighted ? 'highlighted' : '',
                          isSelected ? 'selected' : '',
                        ].join(' ')}
                      />
                      <text x={labelX} y={labelY} textAnchor="middle" className="arch-edge-label">
                        {edge.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {NODES.map((node) => {
                const position = positions[node.id];
                const isSelected = selectedNodeId === node.id;
                const hasRelation = highlightedEdgeIds.size > 0
                  && edges.some(
                    (edge) =>
                      highlightedEdgeIds.has(edge.id)
                      && (edge.from === node.id || edge.to === node.id),
                  );

                return (
                  <button
                    key={node.id}
                    className={[
                      'arch-node',
                      `cat-${node.category}`,
                      isSelected ? 'selected' : '',
                      hasRelation ? 'related' : '',
                    ].join(' ')}
                    style={{ left: `${position.x}px`, top: `${position.y}px` }}
                    onClick={() => selectNode(node.id)}
                  >
                    <span className="arch-node-icon">{node.icon}</span>
                    <span className="arch-node-name">{node.name}</span>
                    <span className="arch-node-port">:{node.port}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="arch-legend">
            <div className="arch-legend-item"><span className="chip client" /> Client</div>
            <div className="arch-legend-item"><span className="chip gateway" /> Gateway</div>
            <div className="arch-legend-item"><span className="chip service" /> Service</div>
            <div className="arch-legend-item"><span className="chip datastore" /> Data Store</div>
            <div className="arch-legend-item"><span className="line solid" /> Fluxo obrigatorio</div>
            <div className="arch-legend-item"><span className="line dashed" /> Fluxo condicional/opcional</div>
          </div>
        </div>

        <div className="card arch-detail-card">
          {selectedNode && (
            <>
              <div className="arch-detail-head">
                <span className="arch-detail-icon">{selectedNode.icon}</span>
                <div>
                  <h3>{selectedNode.name}</h3>
                  <p>{selectedNode.responsibility}</p>
                </div>
              </div>
              <div className="arch-detail-grid">
                <div>
                  <div className="arch-label">Tecnologia</div>
                  <div>{selectedNode.tech}</div>
                </div>
                <div>
                  <div className="arch-label">Porta</div>
                  <div>:{selectedNode.port}</div>
                </div>
                <div>
                  <div className="arch-label">Categoria</div>
                  <div className="arch-cap">{selectedNode.category}</div>
                </div>
              </div>
              <div className="arch-io-list">
                <div>
                  <h4>Entradas</h4>
                  {nodeConnections.inbound.length === 0 && <p>Nenhuma entrada neste contexto.</p>}
                  {nodeConnections.inbound.map((edge) => (
                    <div className="arch-io-item" key={edge.id}>
                      {NODES.find((node) => node.id === edge.from)?.name} → {edge.label}
                    </div>
                  ))}
                </div>
                <div>
                  <h4>Saidas</h4>
                  {nodeConnections.outbound.length === 0 && <p>Nenhuma saida neste contexto.</p>}
                  {nodeConnections.outbound.map((edge) => (
                    <div className="arch-io-item" key={edge.id}>
                      {edge.label} → {NODES.find((node) => node.id === edge.to)?.name}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!selectedNode && selectedEdge && (
            <>
              <h3>Conexao Selecionada</h3>
              <p className="arch-edge-title">
                {NODES.find((node) => node.id === selectedEdge.from)?.name}
                {' '}
                →
                {' '}
                {NODES.find((node) => node.id === selectedEdge.to)?.name}
              </p>
              <div className="arch-detail-grid">
                <div>
                  <div className="arch-label">Canal</div>
                  <div>{selectedEdge.label}</div>
                </div>
                <div>
                  <div className="arch-label">Condicao</div>
                  <div>{CONDITION_LABEL[selectedEdge.condition]}</div>
                </div>
                <div>
                  <div className="arch-label">Tipo de linha</div>
                  <div>{selectedEdge.style === 'solid' ? 'Solida' : 'Tracejada'}</div>
                </div>
              </div>
              <p>{selectedEdge.description}</p>
            </>
          )}

          {!selectedNode && !selectedEdge && (
            <>
              <h3>Resumo</h3>
              <p>Selecione um componente ou conexao para ver detalhes tecnicos.</p>
            </>
          )}
        </div>
      </div>

      {view === 'runtime' && (
        <div className="card arch-runtime-card">
          <div className="arch-runtime-head">
            <h3>Passo a Passo do Fluxo</h3>
            <div className="arch-runtime-controls">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
                disabled={stepIndex === 0}
              >
                Anterior
              </button>
              <span>{stepIndex + 1} / {selectedFlow.steps.length}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setStepIndex((index) => Math.min(index + 1, selectedFlow.steps.length - 1))}
                disabled={stepIndex >= selectedFlow.steps.length - 1}
              >
                Proximo
              </button>
            </div>
          </div>
          <div className="arch-step-list">
            {selectedFlow.steps.map((step, index) => (
              <button
                key={step.title}
                className={`arch-step-item ${index === stepIndex ? 'active' : ''}`}
                onClick={() => setStepIndex(index)}
              >
                <span className="arch-step-badge">{index + 1}</span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
