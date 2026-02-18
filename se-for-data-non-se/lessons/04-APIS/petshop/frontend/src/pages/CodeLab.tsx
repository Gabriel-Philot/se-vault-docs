import { useState } from 'react';
import { Code, Play, RotateCcw } from 'lucide-react';

interface Exercise {
  id: number;
  title: string;
  description: string;
  code: string;
  hint?: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 1,
    title: 'Listar todos os pets',
    description: 'Faca uma requisicao GET para listar todos os pets',
    code: `import httpx

response = httpx.get("http://api:8000/pets")
data = response.json()

print("Status:", response.status_code)
print("Pets encontrados:", len(data.get("pets", [])))

for pet in data.get("pets", [])[:3]:
    print(f"  - {pet['name']} ({pet['species']})")`,
  },
  {
    id: 2,
    title: 'Criar um novo pet',
    description: 'Use POST para criar um pet com dados personalizados',
    code: `import httpx

novo_pet = {
    "name": "Mel",
    "species": "cat",
    "age": 2
}

response = httpx.post(
    "http://api:8000/pets",
    json=novo_pet
)

print("Status:", response.status_code)
pet_criado = response.json()
print("Pet criado:", pet_criado['name'])
print("ID:", pet_criado['id'])`,
  },
  {
    id: 3,
    title: 'Alimentar um pet',
    description: 'Use POST para alimentar um pet e reduzir sua fome',
    code: `import httpx

pet_id = 1  # ID do pet a alimentar

response = httpx.post(
    f"http://api:8000/pets/{pet_id}/feed"
)

print("Status:", response.status_code)
pet = response.json()
print(f"{pet['name']} foi alimentado!")
print(f"Fome atual: {pet['hunger_level']}%")
print(f"Felicidade: {pet['happiness']}%")`,
  },
  {
    id: 4,
    title: 'Brincar com um pet',
    description: 'Use POST para brincar e aumentar a felicidade',
    code: `import httpx

pet_id = 1  # ID do pet

response = httpx.post(
    f"http://api:8000/pets/{pet_id}/play"
)

print("Status:", response.status_code)
pet = response.json()
print(f"Voce brincou com {pet['name']}!")
print(f"Felicidade: {pet['happiness']}%")
print(f"Fome: {pet['hunger_level']}%")`,
  },
  {
    id: 5,
    title: 'Verificar cache Redis',
    description: 'Compare tempo de resposta com e sem cache',
    code: `import httpx
import time

# Primeira requisicao (sem cache)
start = time.time()
response1 = httpx.get("http://api:8000/stats")
time1 = (time.time() - start) * 1000

# Segunda requisicao (com cache)
start = time.time()
response2 = httpx.get("http://api:8000/stats")
time2 = (time.time() - start) * 1000

print(f"Primeira requisicao: {time1:.1f}ms")
print(f"  cached: {response1.json().get('cached')}")

print(f"Segunda requisicao: {time2:.1f}ms")
print(f"  cached: {response2.json().get('cached')}")

print(f"\\nMelhoria: {((time1 - time2) / time1 * 100):.1f}% mais rapido!")`,
  },
];

export default function CodeLab() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(EXERCISES[0]);
  const [code, setCode] = useState(selectedExercise.code);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [outputType, setOutputType] = useState<'success' | 'error'>('success');

  function handleSelectExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setCode(exercise.code);
    setOutput('');
  }

  async function runCode() {
    setIsRunning(true);
    setOutput('Executando...');
    
    try {
      const res = await fetch('/executor/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setOutput(data.output || '(sem output)');
        setOutputType('success');
      } else {
        setOutput(`Erro:\n${data.error || 'Erro desconhecido'}`);
        setOutputType('error');
      }
    } catch (error) {
      setOutput(`Erro de conexao: ${error}`);
      setOutputType('error');
    } finally {
      setIsRunning(false);
    }
  }

  function resetCode() {
    setCode(selectedExercise.code);
    setOutput('');
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Code size={28} />
          Code Lab
        </h1>
        <p className="page-subtitle">
          Aprenda a consumir APIs com Python e httpx
        </p>
      </div>

      <div className="codelab-container">
        <div className="codelab-editor">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Exercicios</h3>
            </div>
            <div className="codelab-exercises">
              {EXERCISES.map((ex) => (
                <div
                  key={ex.id}
                  className={`exercise-item ${selectedExercise.id === ex.id ? 'active' : ''}`}
                  onClick={() => handleSelectExercise(ex)}
                >
                  <div className="exercise-title">
                    {ex.id}. {ex.title}
                  </div>
                  <div className="exercise-desc">{ex.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Codigo Python</h3>
            </div>
            <div className="codelab-monaco">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#1e1e1e',
                  color: '#e0e0e0',
                  border: 'none',
                  padding: '1rem',
                  fontFamily: 'Monaco, Menlo, monospace',
                  fontSize: '0.875rem',
                  resize: 'none',
                }}
              />
            </div>
            <div className="codelab-toolbar">
              <button
                className="btn btn-primary"
                onClick={runCode}
                disabled={isRunning}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Play size={16} />
                {isRunning ? 'Executando...' : 'Executar'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={resetCode}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RotateCcw size={16} />
                Resetar
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Output</h3>
          </div>
          <div className={`codelab-output ${outputType}`}>
            {output || 'Clique em "Executar" para ver o resultado'}
          </div>

          {selectedExercise.hint && (
            <div className="lesson-box" style={{ marginTop: '1rem' }}>
              <h4>Dica</h4>
              <p>{selectedExercise.hint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
