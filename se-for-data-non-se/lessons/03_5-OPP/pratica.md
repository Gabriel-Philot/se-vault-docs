# Pratica - Modulo 035 (OPP para Dados)

## Desafio integrado: Pipeline de Pedidos Multi-Canal

### Contexto

Voce recebe eventos de pedidos de tres canais:
- app mobile
- web
- parceiro externo

Objetivo: montar pipeline robusto, extensivel e testavel usando pelo menos 3 patterns do bloco.

---

## Requisitos tecnicos

1. Use **Factory** para criar connector de entrada por tipo de canal.
2. Use **Strategy** para aplicar regra fiscal por pais.
3. Use **Adapter** para normalizar payload do parceiro externo.
4. Use **Router** para separar pedidos de alto valor.
5. Use **Aggregator** para consolidar total por cliente.
6. Use **Idempotent Consumer** para evitar duplicidade por `event_id`.

---

## Entrega esperada

1. Arquitetura em diagrama simples (ASCII ou markdown)
2. Codigo Python minimo com contratos claros por componente
3. Registro de decisoes (trade-off em 6-10 linhas)
4. Suite minima de testes

---

## Testes obrigatorios

1. Factory cria connector correto para 2 canais
2. Strategy muda calculo para BR e US
3. Adapter converte payload externo para schema interno
4. Router classifica corretamente limiar de alto valor
5. Idempotencia ignora evento duplicado
6. Aggregator soma corretamente 3 eventos do mesmo cliente

---

## Critica de engenharia (obrigatoria)

Responda em texto curto:

1. Onde voce escolheu simplicidade em vez de abstracao?
2. Qual pattern quase virou overengineering e por que?
3. Qual mudanca de requisito seu design absorve melhor?

---

## Rubrica rapida

- Clareza de contratos: 0-2
- Escolha de patterns com criterio: 0-2
- Cobertura de testes minimos: 0-2
- Trade-off documentado com honestidade: 0-2
- Coesao e baixo acoplamento: 0-2

Pontuacao maxima: 10

