import { useState } from 'react';
import { Search, Send } from 'lucide-react';
import CodeTerminal from '../components/api/CodeTerminal';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  hasBody: boolean;
  bodyExample?: Record<string, unknown>;
}

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/pets', description: 'Listar todos os pets', hasBody: false },
  { method: 'GET', path: '/pets/{id}', description: 'Buscar pet por ID', hasBody: false },
  { method: 'POST', path: '/pets', description: 'Criar novo pet', hasBody: true, bodyExample: { name: 'Rex', species: 'dog', age: 3 } },
  { method: 'PATCH', path: '/pets/{id}', description: 'Atualizar pet parcialmente', hasBody: true, bodyExample: { name: 'Rex II' } },
  { method: 'DELETE', path: '/pets/{id}', description: 'Excluir pet', hasBody: false },
  { method: 'POST', path: '/pets/{id}/feed', description: 'Alimentar pet', hasBody: false },
  { method: 'POST', path: '/pets/{id}/play', description: 'Brincar com pet', hasBody: false },
  { method: 'GET', path: '/stats', description: 'Obter estatisticas', hasBody: false },
  { method: 'GET', path: '/activity', description: 'Obter log de atividades', hasBody: false },
];

interface ApiResponse {
  status: number;
  statusText?: string;
  data: unknown;
  duration: number;
}

export default function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [pathId, setPathId] = useState('1');
  const [queryParams, setQueryParams] = useState('limit=10&offset=0');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function getMethodClass(method: string) {
    return `method-${method.toLowerCase()}`;
  }

  function getPathWithId(path: string) {
    return path.replace('{id}', pathId);
  }

  async function sendRequest() {
    setLoading(true);
    const startTime = performance.now();

    try {
      let url = `/api${getPathWithId(selectedEndpoint.path)}`;
      if (selectedEndpoint.method === 'GET' && queryParams) {
        url += `?${queryParams}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (selectedEndpoint.hasBody && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const endTime = performance.now();

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
        duration: Math.round(endTime - startTime),
      });
    } catch (error) {
      const endTime = performance.now();
      setResponse({
        status: 0,
        data: { error: String(error) },
        duration: Math.round(endTime - startTime),
      });
    } finally {
      setLoading(false);
    }
  }

  function handleEndpointSelect(endpoint: Endpoint) {
    setSelectedEndpoint(endpoint);
    if (endpoint.bodyExample) {
      setRequestBody(JSON.stringify(endpoint.bodyExample, null, 2));
    } else {
      setRequestBody('');
    }
    setResponse(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Search size={28} />
          API Explorer
        </h1>
        <p className="page-subtitle">
          Teste os endpoints da API e veja as respostas em tempo real
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Endpoints</h3>
          <div className="endpoint-list">
            {ENDPOINTS.map((ep) => (
              <div
                key={`${ep.method}-${ep.path}`}
                className={`endpoint-item ${selectedEndpoint === ep ? 'active' : ''}`}
                onClick={() => handleEndpointSelect(ep)}
              >
                <span className={`method ${getMethodClass(ep.method)}`}>{ep.method}</span>
                <span style={{ fontSize: '0.875rem' }}>{ep.path}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid" style={{ gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Requisicao</h3>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <span className={`method ${getMethodClass(selectedEndpoint.method)}`}>
                {selectedEndpoint.method}
              </span>
              <code style={{ background: 'var(--pet-brown-100)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontFamily: 'monospace' }}>
                {getPathWithId(selectedEndpoint.path)}
              </code>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {selectedEndpoint.description}
              </span>
            </div>

            {selectedEndpoint.path.includes('{id}') && (
              <div className="form-group">
                <label className="form-label">Pet ID</label>
                <input
                  className="form-input"
                  type="number"
                  value={pathId}
                  onChange={(e) => setPathId(e.target.value)}
                  style={{ width: '100px' }}
                />
              </div>
            )}

            {selectedEndpoint.method === 'GET' && selectedEndpoint.path === '/pets' && (
              <div className="form-group">
                <label className="form-label">Parametros de Query</label>
                <input
                  className="form-input"
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                  placeholder="limit=10&offset=0&species=dog"
                />
              </div>
            )}

            {selectedEndpoint.hasBody && (
              <div className="form-group">
                <label className="form-label">Corpo da Requisicao (JSON)</label>
                <textarea
                  className="form-input"
                  rows={6}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={sendRequest}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Send size={16} />
              {loading ? 'Enviando...' : 'Enviar Requisicao'}
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Resposta</h3>
              {response && (
                <div className="response-status">
                  <span className={`status-badge ${response.status >= 200 && response.status < 300 ? 'status-200' : 'status-400'}`}>
                    {response.status}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {response.duration}ms
                  </span>
                </div>
              )}
            </div>

            {response ? (
              <>
                <pre className="code-block">
                  {JSON.stringify(response.data, null, 2)}
                </pre>

                {response.data && typeof response.data === 'object' && 'cached' in response.data && (
                  <div className="lesson-box">
                    <h4>{response.data.cached ? 'Cache Hit!' : 'Cache Miss'}</h4>
                    <p>
                      {response.data.cached
                        ? `Esta resposta veio do cache Redis. Note o tempo de resposta (~${response.duration}ms).`
                        : 'Esta resposta veio direto do banco de dados. Faca a mesma requisicao novamente para ver o cache em acao.'}
                    </p>
                  </div>
                )}

                {response.status === 422 && (
                  <div className="lesson-box">
                    <h4>Erro de Validacao (422)</h4>
                    <p>
                      Pydantic valida automaticamente a entrada e retorna 422 quando a validacao falha.
                      Verifique o array "detail" para ver quais campos falharam.
                    </p>
                  </div>
                )}

                {response.status === 404 && (
                  <div className="lesson-box">
                    <h4>Nao Encontrado (404)</h4>
                    <p>
                      O recurso solicitado nao existe. Isso e diferente de 400 (requisicao invalida)
                      ou 422 (erro de validacao) - a requisicao era valida, mas nao existe pet com este ID.
                    </p>
                  </div>
                )}

                <CodeTerminal
                  title="Detalhes da Requisicao"
                  request={{
                    method: selectedEndpoint.method,
                    url: `/api${getPathWithId(selectedEndpoint.path)}`,
                    body: selectedEndpoint.hasBody && requestBody ? JSON.parse(requestBody) : null,
                  }}
                  response={response}
                />
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>
                Envie uma requisicao para ver a resposta
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
