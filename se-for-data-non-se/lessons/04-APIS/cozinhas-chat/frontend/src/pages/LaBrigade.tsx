import { Code, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface Exercise {
  id: number;
  title: string;
  description: string;
  code: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 1,
    title: 'Lister les plats',
    description: 'GET /dishes',
    code: `import httpx\n\nres = httpx.get("http://api:8000/dishes")\nprint("status:", res.status_code)\nprint("total:", res.json().get("total"))`,
  },
  {
    id: 2,
    title: 'Creer un plat',
    description: 'POST /dishes',
    code: `import httpx\n\npayload = {"name": "Volaille roti", "category": "plat", "price": 31, "preparation_time": 28}\nres = httpx.post("http://api:8000/dishes", json=payload)\nprint(res.status_code)\nprint(res.json())`,
  },
  {
    id: 3,
    title: 'Preparer un plat',
    description: 'POST /dishes/{id}/prepare',
    code: `import httpx\n\nid_dish = 1\nres = httpx.post(f"http://api:8000/dishes/{id_dish}/prepare")\nprint(res.status_code)\nprint(res.json())`,
  },
  {
    id: 4,
    title: 'Servir un plat',
    description: 'POST /dishes/{id}/serve',
    code: `import httpx\n\nid_dish = 1\nres = httpx.post(f"http://api:8000/dishes/{id_dish}/serve")\nprint(res.status_code)\nprint(res.json())`,
  },
  {
    id: 5,
    title: 'Verifier le cache',
    description: 'GET /stats x2',
    code: `import httpx\n\nr1 = httpx.get("http://api:8000/stats").json()\nr2 = httpx.get("http://api:8000/stats").json()\nprint("1:", r1.get("cached"))\nprint("2:", r2.get("cached"))`,
  },
];

export default function LaBrigade() {
  const [selected, setSelected] = useState<Exercise>(EXERCISES[0]);
  const [code, setCode] = useState(EXERCISES[0].code);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  function selectExercise(ex: Exercise) {
    setSelected(ex);
    setCode(ex.code);
    setOutput('');
  }

  async function runCode() {
    setRunning(true);
    setOutput('Execution en cours...');
    try {
      const res = await fetch('/executor/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setOutput(data.output || '(sans sortie)');
      } else {
        setOutput(`Erreur:\n${data.error || 'Erreur inconnue'}`);
      }
    } catch (err) {
      setOutput(String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Code size={26} /> La Brigade</h1>
        <p className="page-subtitle">Exercices Python httpx executes dans le sandbox.</p>
      </div>

      <div className="codelab-container">
        <div className="grid">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Exercices</h3></div>
            <div className="codelab-exercises">
              {EXERCISES.map((ex) => (
                <button key={ex.id} className={`exercise-item ${selected.id === ex.id ? 'active' : ''}`} onClick={() => selectExercise(ex)}>
                  <div className="exercise-title">{ex.id}. {ex.title}</div>
                  <div className="exercise-desc">{ex.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Code Python</h3></div>
            <div className="codelab-monaco">
              <textarea
                className="form-input"
                style={{ height: '100%', resize: 'none', fontFamily: 'var(--font-mono)', background: '#1b1f23', color: '#e2e7ec' }}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            <div className="codelab-toolbar">
              <button className="btn btn-primary" onClick={runCode} disabled={running}><Play size={14} /> {running ? 'Execution...' : 'Executer'}</button>
              <button className="btn btn-secondary" onClick={() => setCode(selected.code)}><RotateCcw size={14} /> Reinitialiser</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Sortie</h3></div>
          <pre className="codelab-output">{output || 'Cliquez sur "Executer" pour lancer le script.'}</pre>
        </div>
      </div>
    </div>
  );
}
