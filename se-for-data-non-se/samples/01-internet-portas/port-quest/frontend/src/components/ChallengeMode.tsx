import React, { useState, useEffect } from 'react';
import { ChallengeData, ChallengeResult } from '../types/city';

const CHALLENGES: ChallengeData[] = [
  {
    id: 'wrong-port',
    title: '1. Wrong Port',
    description:
      'A service is running on the wrong port! The API server should listen on port 8000, but someone misconfigured it. Which port should it be on?',
    hints: ['Standard HTTP APIs usually run on port 8000 or 8080', 'Check the building labels'],
    type: 'port_match',
  },
  {
    id: 'invasion',
    title: '2. The Invasion',
    description:
      'Malicious packets are attacking the database directly! Configure the firewall to block external traffic to port 5432.',
    hints: [
      'PostgreSQL default port is 5432',
      'Only internal services should reach the database',
    ],
    type: 'firewall',
  },
  {
    id: 'dns-down',
    title: '3. DNS Down',
    description:
      'DNS resolution is failing! Trace the DNS resolution path to find where it breaks.',
    hints: [
      'DNS resolves names left to right: .com -> example.com -> api.example.com',
      'Check each resolver step',
    ],
    type: 'dns',
  },
  {
    id: 'protocol-race',
    title: '4. Protocol Race',
    description:
      'REST vs gRPC - which protocol delivers the response faster? Watch the packets race!',
    hints: ['gRPC uses HTTP/2 and binary serialization', 'REST uses JSON over HTTP/1.1'],
    type: 'protocol',
  },
];

export default function ChallengeMode({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<ChallengeData | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    setAnswer('');
    setResult(null);
  }, [active]);

  const submit = async () => {
    if (!active) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/challenges/${active.id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: active.id, answer }),
      });
      const data: ChallengeResult = await res.json();
      setResult(data);
      if (data.correct) {
        setScores((s) => ({ ...s, [active.id]: data.score }));
      }
    } catch {
      setResult({ correct: false, message: 'Error', explanation: 'Failed to connect to server', score: 0 });
    } finally {
      setLoading(false);
    }
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>CHALLENGE MODE</h2>
          <span style={styles.score}>Score: {totalScore}</span>
          <button onClick={onClose} style={styles.closeBtn}>
            X
          </button>
        </div>

        {!active ? (
          <div style={styles.list}>
            {CHALLENGES.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActive(ch)}
                style={{
                  ...styles.challengeBtn,
                  borderColor: scores[ch.id] ? '#00ff88' : 'rgba(100,100,200,0.3)',
                }}
              >
                <span style={styles.challengeTitle}>{ch.title}</span>
                <span style={styles.challengeDesc}>{ch.description.slice(0, 60)}...</span>
                {scores[ch.id] && (
                  <span style={styles.completed}>+{scores[ch.id]} pts</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div style={styles.challengeView}>
            <button onClick={() => setActive(null)} style={styles.backBtn}>
              &larr; Back
            </button>
            <h3 style={styles.challengeName}>{active.title}</h3>
            <p style={styles.challengeText}>{active.description}</p>

            <div style={styles.hints}>
              {active.hints.map((h, i) => (
                <div key={i} style={styles.hint}>
                  Hint: {h}
                </div>
              ))}
            </div>

            <div style={styles.inputRow}>
              {active.type === 'port_match' && (
                <select
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select port...</option>
                  <option value="80">80 (HTTP)</option>
                  <option value="443">443 (HTTPS)</option>
                  <option value="3000">3000 (Dev)</option>
                  <option value="5432">5432 (PostgreSQL)</option>
                  <option value="8000">8000 (API)</option>
                  <option value="8080">8080 (Alt HTTP)</option>
                </select>
              )}
              {active.type === 'firewall' && (
                <select
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select rule...</option>
                  <option value="block-external-5432">Block external -&gt; :5432</option>
                  <option value="block-all-5432">Block all -&gt; :5432</option>
                  <option value="allow-internal-5432">Allow only internal -&gt; :5432</option>
                  <option value="block-external-80">Block external -&gt; :80</option>
                </select>
              )}
              {active.type === 'dns' && (
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Which DNS step fails? (1-4)"
                  style={styles.textInput}
                />
              )}
              {active.type === 'protocol' && (
                <select
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select faster protocol...</option>
                  <option value="REST">REST (HTTP/1.1 + JSON)</option>
                  <option value="gRPC">gRPC (HTTP/2 + Protobuf)</option>
                </select>
              )}

              <button onClick={submit} disabled={loading || !answer} style={styles.submitBtn}>
                {loading ? '...' : 'SUBMIT'}
              </button>
            </div>

            {result && (
              <div
                style={{
                  ...styles.resultBox,
                  borderColor: result.correct ? '#00ff88' : '#ff4444',
                  background: result.correct
                    ? 'rgba(0,255,100,0.08)'
                    : 'rgba(255,50,50,0.08)',
                }}
              >
                <span
                  style={{
                    fontWeight: 'bold',
                    color: result.correct ? '#00ff88' : '#ff4444',
                    fontSize: 14,
                  }}
                >
                  {result.correct ? 'CORRECT!' : 'WRONG!'}
                </span>
                <p style={{ margin: '6px 0 0', color: '#bbb', fontSize: 12 }}>
                  {result.explanation}
                </p>
                {result.correct && result.score > 0 && (
                  <span style={{ color: '#00ff88', fontSize: 11 }}>+{result.score} pts</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#0c0c20',
    border: '1px solid rgba(100,100,200,0.4)',
    borderRadius: 10,
    width: 520,
    maxHeight: '80vh',
    overflow: 'auto',
    padding: 20,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    margin: 0,
    fontSize: 16,
    color: '#bb66ff',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  score: {
    color: '#00ff88',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 18,
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  challengeBtn: {
    background: 'rgba(20,20,50,0.8)',
    border: '1px solid',
    borderRadius: 6,
    padding: 12,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  challengeTitle: {
    color: '#e0e0ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
  },
  challengeDesc: { color: '#777', fontSize: 11 },
  completed: { color: '#00ff88', fontSize: 11, fontFamily: 'monospace' },
  challengeView: { display: 'flex', flexDirection: 'column', gap: 10 },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#8888cc',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'monospace',
    alignSelf: 'flex-start',
    padding: 0,
  },
  challengeName: {
    margin: 0,
    color: '#e0e0ff',
    fontFamily: 'monospace',
    fontSize: 15,
  },
  challengeText: { color: '#aaa', fontSize: 12, lineHeight: 1.6, margin: 0 },
  hints: { display: 'flex', flexDirection: 'column', gap: 4 },
  hint: {
    fontSize: 11,
    color: '#ccaa44',
    fontFamily: 'monospace',
    padding: '4px 8px',
    background: 'rgba(200,170,60,0.08)',
    borderRadius: 3,
  },
  inputRow: { display: 'flex', gap: 8, alignItems: 'center' },
  select: {
    flex: 1,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(80,80,160,0.3)',
    borderRadius: 4,
    padding: '6px 8px',
    color: '#e0e0ff',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  textInput: {
    flex: 1,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(80,80,160,0.3)',
    borderRadius: 4,
    padding: '6px 8px',
    color: '#e0e0ff',
    fontFamily: 'monospace',
    fontSize: 12,
    outline: 'none',
  },
  submitBtn: {
    background: 'rgba(100,50,200,0.2)',
    border: '1px solid rgba(150,80,255,0.4)',
    color: '#bb66ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 12,
    padding: '6px 16px',
    borderRadius: 4,
    cursor: 'pointer',
  },
  resultBox: {
    border: '1px solid',
    borderRadius: 6,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
};
