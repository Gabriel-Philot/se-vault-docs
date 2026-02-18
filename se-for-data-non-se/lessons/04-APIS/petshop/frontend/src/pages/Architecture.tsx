import { useState, useEffect } from 'react';
import { Box, ArrowDown } from 'lucide-react';

interface ServiceStatus {
  name: string;
  icon: string;
  port: string;
  status: 'healthy' | 'warning' | 'unknown';
  description: string;
  tech: string;
}

const SERVICES: ServiceStatus[] = [
  { name: 'Browser', icon: '🌐', port: '3000', status: 'healthy', description: 'React Frontend', tech: 'React + Vite' },
  { name: 'Nginx', icon: '🔒', port: '80', status: 'healthy', description: 'Reverse Proxy', tech: 'Nginx 1.25' },
  { name: 'FastAPI', icon: '⚡', port: '8000', status: 'healthy', description: 'API Backend', tech: 'Python 3.12 + FastAPI' },
  { name: 'Executor', icon: '🐍', port: '8001', status: 'healthy', description: 'Python Sandbox', tech: 'Python 3.12 + httpx' },
  { name: 'Redis', icon: '🔴', port: '6379', status: 'healthy', description: 'Cache Layer', tech: 'Redis 7' },
  { name: 'PostgreSQL', icon: '🐘', port: '5432', status: 'healthy', description: 'Database', tech: 'PostgreSQL 16' },
];

export default function Architecture() {
  const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null);
  const [animatedLines, setAnimatedLines] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedLines(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Box size={28} />
          Arquitetura do Sistema
        </h1>
        <p className="page-subtitle">
          Entenda como os componentes se comunicam no Pet Shop API
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="architecture-diagram">
          <div className="arch-row">
            <div 
              className={`arch-service ${selectedService?.name === 'Browser' ? 'active' : ''}`}
              onClick={() => setSelectedService(SERVICES[0])}
            >
              <div className="arch-service-icon">🌐</div>
              <div className="arch-service-name">Browser</div>
              <div className="arch-service-port">:3000</div>
              <span className="arch-service-status healthy" />
            </div>
          </div>

          <div className="arch-arrow">
            <ArrowDown size={24} className={animatedLines ? 'animate' : ''} />
          </div>

          <div className="arch-row">
            <div 
              className={`arch-service ${selectedService?.name === 'Nginx' ? 'active' : ''}`}
              onClick={() => setSelectedService(SERVICES[1])}
            >
              <div className="arch-service-icon">🔒</div>
              <div className="arch-service-name">Nginx</div>
              <div className="arch-service-port">:80</div>
              <span className="arch-service-status healthy" />
            </div>
          </div>

          <div className="arch-arrow">
            <ArrowDown size={24} className={animatedLines ? 'animate' : ''} />
          </div>

          <div className="arch-row" style={{ gap: '4rem' }}>
            <div 
              className={`arch-service ${selectedService?.name === 'FastAPI' ? 'active' : ''}`}
              onClick={() => setSelectedService(SERVICES[2])}
            >
              <div className="arch-service-icon">⚡</div>
              <div className="arch-service-name">FastAPI</div>
              <div className="arch-service-port">:8000</div>
              <span className="arch-service-status healthy" />
            </div>
            <div 
              className={`arch-service ${selectedService?.name === 'Executor' ? 'active' : ''}`}
              onClick={() => setSelectedService(SERVICES[3])}
            >
              <div className="arch-service-icon">🐍</div>
              <div className="arch-service-name">Executor</div>
              <div className="arch-service-port">:8001</div>
              <span className="arch-service-status healthy" />
            </div>
          </div>

          <div className="arch-row" style={{ gap: '3rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowDown size={20} className={animatedLines ? 'animate' : ''} />
              <div 
                className={`arch-service ${selectedService?.name === 'Redis' ? 'active' : ''}`}
                onClick={() => setSelectedService(SERVICES[4])}
              >
                <div className="arch-service-icon">🔴</div>
                <div className="arch-service-name">Redis</div>
                <div className="arch-service-port">:6379</div>
                <span className="arch-service-status healthy" />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowDown size={20} className={animatedLines ? 'animate' : ''} />
              <div 
                className={`arch-service ${selectedService?.name === 'PostgreSQL' ? 'active' : ''}`}
                onClick={() => setSelectedService(SERVICES[5])}
              >
                <div className="arch-service-icon">🐘</div>
                <div className="arch-service-name">PostgreSQL</div>
                <div className="arch-service-port">:5432</div>
                <span className="arch-service-status healthy" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedService && (
        <div className="arch-details">
          <h3 className="arch-details-title">
            <span style={{ fontSize: '1.5rem' }}>{selectedService.icon}</span>
            {selectedService.name}
          </h3>
          <div className="arch-details-grid">
            <div className="arch-detail-item">
              <div className="arch-detail-label">Porta</div>
              <div className="arch-detail-value">{selectedService.port}</div>
            </div>
            <div className="arch-detail-item">
              <div className="arch-detail-label">Tecnologia</div>
              <div className="arch-detail-value">{selectedService.tech}</div>
            </div>
            <div className="arch-detail-item">
              <div className="arch-detail-label">Funcao</div>
              <div className="arch-detail-value">{selectedService.description}</div>
            </div>
            <div className="arch-detail-item">
              <div className="arch-detail-label">Status</div>
              <div className="arch-detail-value" style={{ color: '#22c55e' }}>
                Saudavel
              </div>
            </div>
          </div>

          {selectedService.name === 'Nginx' && (
            <div className="lesson-box" style={{ marginTop: '1rem' }}>
              <h4>Por que Nginx?</h4>
              <p>
                Nginx atua como reverse proxy, roteando requisicoes para o backend correto.
                Ele tambem pode servir arquivos estaticos, fazer load balancing e SSL termination.
              </p>
            </div>
          )}

          {selectedService.name === 'Redis' && (
            <div className="lesson-box" style={{ marginTop: '1rem' }}>
              <h4>Cache com Redis</h4>
              <p>
                Redis armazena dados em memoria para acesso ultra-rapido.
                Use para cachear queries frequentes, sessoes e dados de alta leitura.
              </p>
            </div>
          )}

          {selectedService.name === 'Executor' && (
            <div className="lesson-box" style={{ marginTop: '1rem' }}>
              <h4>Executor Python</h4>
              <p>
                O Executor e um microservico sandbox que roda codigo Python de forma isolada.
                Usado pelo Code Lab para executar exemplos com httpx, com timeout de 5 segundos.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Fluxo de uma Requisicao</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { step: 1, text: 'Browser envia requisicao HTTP para http://localhost/api/pets' },
            { step: 2, text: 'Nginx recebe na porta 80 e repassa para FastAPI (porta 8000)' },
            { step: 3, text: 'FastAPI verifica se o resultado esta em cache (Redis)' },
            { step: 4, text: 'Se nao estiver em cache, consulta PostgreSQL' },
            { step: 5, text: 'Resultado e armazenado em cache e retornado ao cliente' },
          ].map((item) => (
            <div 
              key={item.step}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '0.75rem 1rem',
                background: 'var(--pet-brown-50)',
                borderRadius: '0.5rem'
              }}
            >
              <span style={{ 
                background: 'var(--pet-green-500)', 
                color: 'white', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {item.step}
              </span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
