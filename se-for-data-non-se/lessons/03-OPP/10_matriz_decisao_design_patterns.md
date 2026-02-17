# Mini-Aula 3.10: Matriz de Decisao de Design Patterns (Engenharia para Dados)

> **Objetivo:** Ensinar como decidir se vale usar design pattern em contexto real de dados, com trade-offs explicitos de velocidade, manutencao e risco.

---

## 1. Premissa de engenharia

Nao e sobre decorar todos os patterns.
E sobre tomar boa decisao sob restricao:

- prazo curto vs sustentabilidade
- prototipo ad hoc vs servico recorrente
- custo de falha baixo vs alto
- time pequeno vs multiplos times

---

## 2. Matriz 1: Vale usar design pattern agora?

Use esta matriz antes de introduzir qualquer padrao.

| Pergunta | Sinal verde (sim) | Sinal amarelo (depende) | Sinal vermelho (nao) | Acao recomendada |
|---|---|---|---|---|
| Esse codigo deve durar varios meses? | Sim, longa vida util | Nao sei ainda | E descartavel | Se verde, desenhar contrato minimo |
| Mais de 1 pessoa/time vai manter? | Sim, ownership compartilhado | Time pode crescer | So 1 autor temporario | Se verde, priorizar clareza e padrao |
| Requisito muda com frequencia? | Sim, mudanca recorrente | Mudanca eventual | Quase estatico | Se verde, reduzir acoplamento |
| Custo de falha e alto (SLA, financeiro)? | Alto | Medio | Baixo | Se verde, estruturar para teste e rollback |
| Ja existe `if/elif` por tipo crescendo? | Sim, padrao recorrente | Aparecendo agora | Nao existe | Se verde, avaliar polimorfismo/factory |
| Precisa de testes rigorosos/regressao? | Sim, obrigatorio | Parcial | Nao critico | Se verde, usar fronteiras claras |
| Entropia do repo esta subindo? | Sim, estilos divergentes | Sinais iniciais | Nao | Se verde, padronizar arquitetura |

Regra de bolso:

- 5+ respostas em verde: usar pattern tende a compensar
- 3-4 verdes: aplicar apenas o minimo necessario
- 0-2 verdes: manter simples, adiar pattern

---

## 3. Heuristicas praticas (para nao overengineerar)

1. **YAGNI**: nao introduza abstracao sem dor atual ou previsao forte.
2. **Dor recorrente > gosto pessoal**: use pattern para resolver repeticao de problema.
3. **Contrato primeiro, hierarquia depois**: simplifica refactor futuro.
4. **Teste junto com pattern**: sem teste, pattern vira complexidade sem seguranca.
5. **Adiar e uma decisao valida**: registre gatilho de refactor para revisitar.

---

## 4. Matriz 2: Patterns mais comuns em engenharia de dados

| Cenario comum de dados | Pattern recomendado | Beneficio principal | Custo/risco | Teste minimo esperado | Sinal de overengineering |
|---|---|---|---|---|---|
| Varias origens (`CSV/API/Parquet`) com mesmo fluxo | Factory Method + Polimorfismo | Troca de source sem mexer no loop | Registry virar \"deus\" se mal cuidado | Troca de source mantendo comportamento do pipeline | Factory para apenas 1 tipo estavel |
| Regras de transformacao por cliente/pais | Strategy | Troca de regra por configuracao | Explosao de estrategias sem governance | Teste por estrategia + contrato comum | Criar estrategia para regra unica e fixa |
| Fluxo ETL fixo com passos variaveis | Template Method | Sequencia padrao com pontos de extensao | Heranca profunda e rigida | Teste do fluxo base + hooks sobrescritos | Muitos niveis de classe filha |
| Pipeline por composicao de etapas | Composition (Pipeline) | Baixo acoplamento, montagem flexivel | Integracao entre passos mal definida | Teste de contrato de cada etapa + integracao curta | Abstracao demais sem necessidade |
| Integrar lib externa com interface diferente | Adapter | Reuso sem reescrever cliente | Camadas extras sem ganho se interface ja bate | Teste do adaptador mapeando entrada/saida | Adapter quando nao ha incompatibilidade |
| Eventos de execucao (monitoramento/notificacao) | Observer (ou pub/sub interno) | Baixo acoplamento entre core e listeners | Debug mais dificil com eventos demais | Teste de emissao e consumo de evento critico | Eventificar tudo, ate fluxo simples |

---

## 5. Casos menos comuns e edge cases (nota de rodape)

- **Uber (DOMA)**: uso de camadas/gateways para reduzir acoplamento entre muitos servicos e escalar ownership.
- **Netflix (Data Gateway / Data Bridge)**: camadas de abstracao para padronizar acesso e movimento de dados em ambientes grandes.

Licao para aula: o pattern certo depende da escala e do custo de mudanca; copiar arquitetura de big tech em contexto pequeno costuma gerar sobrecarga.

---

## 6. Bloco: Engenharia + AI Coding

Pattern melhora resultado com IA quando o prompt inclui decisao explicita.

Checklist de prompt para IA:

1. Contexto do dominio (pipeline de dados, batch/stream, SLA).
2. Dor atual (ex.: `if/elif` crescendo, baixa testabilidade).
3. Matriz escolhida (porque aplicar ou nao aplicar pattern).
4. Restricoes (prazo, equipe, compatibilidade).
5. Criterios de aceitacao (testes e comportamento esperado).

Exemplo curto de prompt:

```text
Refatore este pipeline para Strategy apenas se reduzir if/elif por tipo sem aumentar complexidade desnecessaria.
Contexto: 3 clientes, regras mudam mensalmente, SLA diario.
Criterios: manter loop principal estavel, testes por estrategia, sem heranca profunda.
```

---

## 7. Checkpoint final (3 cenarios)

1. Script ad hoc de 1 semana, 1 autor, baixo risco: manter simples, sem pattern pesado.
2. Pipeline recorrente com multiplas fontes e mudancas frequentes: Factory + Polimorfismo.
3. Regras por cliente variando todo mes: Strategy + testes por contrato.

---

## 8. Conexao com dados (mini matriz objetiva de cenarios)

Use como check rapido: some 1 ponto para cada `Sim`.

Criticos:
- C1: Horizonte > 3 meses
- C2: Mudanca frequente de regra/fonte
- C3: Multiplos mantenedores
- C4: Custo de falha alto (SLA/financeiro/compliance)

Regra de acao:
- 0-1: acelerar com solucao simples
- 2-3: estruturar o minimo (contrato + testes essenciais)
- 4: estruturar para evolucao (pattern + testes de regressao + observabilidade)

| Cenario comum em dados | C1 | C2 | C3 | C4 | Score | Decisao objetiva |
|---|---|---|---|---|---|---|
| Script ad hoc para analise de incidente (1 dia) | Nao | Nao | Nao | Nao | 0 | Simples, sem pattern |
| Job batch diario de ingestao multi-fonte (`CSV/API/S3`) | Sim | Sim | Sim | Sim | 4 | Factory/Strategy + contrato por fonte |
| Transformacao por cliente com regra mensal | Sim | Sim | Sim | Medio/Sim | 3-4 | Strategy + suite de testes por cliente |
| ETL interno de backoffice estavel (1 dono) | Sim | Nao | Nao | Nao | 1 | Simples com boa organizacao de funcoes |
| Pipeline CDC para replicacao entre bancos | Sim | Sim | Sim | Sim | 4 | Contratos claros, idempotencia, retries |
| Streaming de eventos para deteccao de fraude | Sim | Sim | Sim | Sim | 4 | Arquitetura orientada a eventos + testes de carga |
| Dashboard semanal com fonte unica estavel | Sim | Nao | Sim | Nao | 2 | Estrutura minima, evitar hierarquia complexa |
| Integracao one-off de vendor com API instavel | Nao | Sim | Nao | Medio | 1-2 | Adapter simples + logs + timeout/retry |
| MLOps feature pipeline para varios modelos | Sim | Sim | Sim | Sim | 4 | Componentizacao por etapa + contratos/versionamento |
| Migracao legado para lakehouse por ondas | Sim | Sim | Sim | Sim | 4 | Padrao por dominio, rollback por lote |

Resumo pratico:
- Engenheiro de dados forte acelera quando score e baixo.
- Engenheiro de dados forte estrutura quando score sobe.
- Sempre registra trade-off e usa IA para ampliar execucao, nao para terceirizar criterio.

---

## 9. Referencias

- Refactoring Guru - Factory Method: https://refactoring.guru/design-patterns/factory-method
- Martin Fowler - YAGNI: https://martinfowler.com/bliki/Yagni.html
- Martin Fowler - Test Pyramid: https://martinfowler.com/bliki/TestPyramid.html
- Uber Engineering (microservice architecture / domain boundaries): https://www.uber.com/en-US/blog/microservice-architecture/
- Netflix TechBlog - Data Gateway: https://netflixtechblog.medium.com/data-gateway-a-platform-for-growing-and-protecting-the-data-tier-f1ed8db8f5c6
- Netflix TechBlog - Data Bridge: https://netflixtechblog.medium.com/data-bridge-how-netflix-simplifies-data-movement-36d10d91c313
