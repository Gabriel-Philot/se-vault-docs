import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import CodeTerminal from '../components/api/CodeTerminal';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  hasBody: boolean;
  bodyExample?: Record<string, unknown>;
}

const GROUPS: Array<{ title: string; endpoints: Endpoint[] }> = [
  {
    title: 'Carte & Menus',
    endpoints: [
      { method: 'GET', path: '/dishes', description: 'Liste des plats', hasBody: false },
      { method: 'GET', path: '/dishes/{id}', description: 'Detail d un plat', hasBody: false },
      {
        method: 'POST',
        path: '/dishes',
        description: 'Creer un plat',
        hasBody: true,
        bodyExample: { name: 'Tarte Tatin', category: 'dessert', price: 14, preparation_time: 18 },
      },
      { method: 'PATCH', path: '/dishes/{id}', description: 'Modifier un plat', hasBody: true, bodyExample: { price: 16.5 } },
      { method: 'DELETE', path: '/dishes/{id}', description: 'Supprimer un plat', hasBody: false },
    ],
  },
  {
    title: 'Service en Salle',
    endpoints: [
      { method: 'POST', path: '/dishes/{id}/prepare', description: 'Preparer', hasBody: false },
      { method: 'POST', path: '/dishes/{id}/serve', description: 'Servir', hasBody: false },
      { method: 'POST', path: '/dishes/{id}/archive', description: 'Archiver', hasBody: false },
      { method: 'POST', path: '/dishes/{id}/reactivate', description: 'Reactiver', hasBody: false },
    ],
  },
  {
    title: 'La Cave',
    endpoints: [{ method: 'POST', path: '/sql', description: 'SQL read-only', hasBody: true, bodyExample: { query: 'SELECT * FROM dishes' } }],
  },
  {
    title: 'Statistiques',
    endpoints: [
      { method: 'GET', path: '/stats', description: 'Statistiques globales', hasBody: false },
      { method: 'GET', path: '/activity', description: 'Historique des actions', hasBody: false },
    ],
  },
];

interface ApiResponse {
  status: number;
  data: unknown;
  duration: number;
}

export default function LaCuisine() {
  const allEndpoints = useMemo(() => GROUPS.flatMap((group) => group.endpoints), []);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(allEndpoints[0]);
  const [pathId, setPathId] = useState('1');
  const [queryParams, setQueryParams] = useState('limit=10&offset=0');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function getMethodClass(method: string) {
    return `method method-${method.toLowerCase()}`;
  }

  function getPathWithId(path: string) {
    return path.replace('{id}', pathId);
  }

  function selectEndpoint(endpoint: Endpoint) {
    setSelectedEndpoint(endpoint);
    setResponse(null);
    if (endpoint.bodyExample) {
      setRequestBody(JSON.stringify(endpoint.bodyExample, null, 2));
    } else {
      setRequestBody('');
    }
  }

  async function sendRequest() {
    setLoading(true);
    const start = performance.now();

    try {
      let url = `/api${getPathWithId(selectedEndpoint.path)}`;
      if (selectedEndpoint.method === 'GET' && selectedEndpoint.path === '/dishes' && queryParams.trim()) {
        url += `?${queryParams}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (selectedEndpoint.hasBody && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      setResponse({ status: res.status, data, duration: Math.round(performance.now() - start) });
    } catch (error) {
      setResponse({ status: 0, data: { error: String(error) }, duration: Math.round(performance.now() - start) });
    } finally {
      setLoading(false);
    }
  }

  function safeBodyParse() {
    if (!selectedEndpoint.hasBody || !requestBody.trim()) return null;
    try {
      return JSON.parse(requestBody);
    } catch {
      return { invalid_json: requestBody };
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">La Cuisine</h1>
        <p className="page-subtitle">Explorez les endpoints de l API cuisine dans un tableau de commande central.</p>
      </div>

      <div className="cuisine-layout">
        <aside className="cuisine-left">
          <h3 className="card-title" style={{ marginBottom: '0.65rem' }}>Endpoints</h3>
          <div className="endpoint-list">
            {GROUPS.map((group) => (
              <div key={group.title} className="endpoint-group">
                <div className="endpoint-group-title">{group.title}</div>
                {group.endpoints.map((endpoint) => (
                  <button
                    key={`${group.title}-${endpoint.method}-${endpoint.path}`}
                    className={`endpoint-item ${selectedEndpoint === endpoint ? 'active' : ''}`}
                    onClick={() => selectEndpoint(endpoint)}
                  >
                    <span className={getMethodClass(endpoint.method)}>{endpoint.method}</span>
                    <span style={{ fontSize: '0.77rem' }}>{endpoint.path}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <section className="cuisine-right">
          <div className="request-panel">
            <div className="request-tabs">
              <span className="request-tab active">Requete</span>
              <span className="request-tab">Headers</span>
              <span className="request-tab">Auth</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.55rem' }}>
              <span className={getMethodClass(selectedEndpoint.method)}>{selectedEndpoint.method}</span>
              <input
                className="form-input"
                style={{ background: '#11171d', borderColor: '#36414c', color: '#eff4f8' }}
                value={`/api${getPathWithId(selectedEndpoint.path)}`}
                readOnly
              />
              <button className="btn btn-primary" onClick={sendRequest} disabled={loading}><Send size={14} /> {loading ? 'Envoi...' : 'Envoyer'}</button>
            </div>

            {selectedEndpoint.path.includes('{id}') && (
              <div className="form-group" style={{ marginBottom: '0.55rem' }}>
                <label className="form-label" style={{ color: '#b8c5d3' }}>Dish ID</label>
                <input className="form-input" type="number" value={pathId} onChange={(event) => setPathId(event.target.value)} style={{ width: 130, background: '#11171d', borderColor: '#36414c', color: '#eff4f8' }} />
              </div>
            )}

            {selectedEndpoint.method === 'GET' && selectedEndpoint.path === '/dishes' && (
              <div className="form-group" style={{ marginBottom: '0.55rem' }}>
                <label className="form-label" style={{ color: '#b8c5d3' }}>Query Params</label>
                <input className="form-input" value={queryParams} onChange={(event) => setQueryParams(event.target.value)} style={{ background: '#11171d', borderColor: '#36414c', color: '#eff4f8' }} />
              </div>
            )}

            {selectedEndpoint.hasBody && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#b8c5d3' }}>JSON Body</label>
                <textarea className="form-input" rows={6} style={{ fontFamily: 'var(--font-mono)', background: '#11171d', borderColor: '#36414c', color: '#eff4f8' }} value={requestBody} onChange={(event) => setRequestBody(event.target.value)} />
              </div>
            )}
          </div>

          <div className="response-card">
            <div className="card-header" style={{ marginBottom: '0.65rem' }}>
              <h3 className="card-title">Reponse JSON</h3>
              {response && <span className={`status-badge ${response.status >= 200 && response.status < 300 ? 'status-200' : 'status-400'}`}>{response.status}</span>}
            </div>

            {response ? (
              <>
                <pre className="code-block" style={{ marginBottom: '0.65rem' }}>{JSON.stringify(response.data, null, 2)}</pre>
                <CodeTerminal
                  request={{
                    method: selectedEndpoint.method,
                    url: `/api${getPathWithId(selectedEndpoint.path)}`,
                    body: safeBodyParse(),
                  }}
                  response={response}
                />
              </>
            ) : (
              <p className="page-subtitle">Executez une requete pour afficher la reponse detaillee.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
