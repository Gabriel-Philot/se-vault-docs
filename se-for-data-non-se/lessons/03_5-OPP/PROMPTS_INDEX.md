# Modulo 035: OPP para Engenharia de Dados (Foco em Patterns)

## Visao Geral

Bloco curto e aprofundado para decisao arquitetural em dados.
Nao repete fundamentos do `03-OPP`; especializa em aplicacao pratica e trade-off.

| Aula | Tema | Duracao sugerida | Foco |
|---|---|---:|---|
| 3.5.1 | Strategy para Regras Volateis | 25min | Variacao de regra sem quebrar fluxo |
| 3.5.2 | Factory para Connectors | 25min | Criacao desacoplada de fonte/destino |
| 3.5.3 | Template Method vs Composicao | 30min | Ordem fixa vs montagem flexivel |
| 3.5.4 | Adapter e Facade | 25min | Integracoes externas estaveis |
| 3.5.5 | Observer/PubSub + Idempotencia | 30min | Eventos e duplicidade segura |
| 3.5.6 | Pipes/Filters + Router/Translator/Aggregator | 30min | Fluxos de integracao modulares |

---

## Formula didatica obrigatoria

Cada mini-aula deve conter:

1. Problema real de dados
2. Conceito em linguagem simples
3. Exemplo Python curto
4. Anti-exemplo comum
5. Decisao: quando usar / quando nao usar + trade-off
6. Teste minimo esperado
7. Bloco didatico: cenario, checkpoint, aplicacao imediata
8. Resumo curto

---

## Prompts prontos por mini-aula

### Mini-Aula 3.5.1

```text
Refine a mini-aula 3.5.1 (Strategy para Regras Volateis) para engenheiros de dados.
Mantenha foco em: regras por cliente/pais, reducao de if/elif, teste por estrategia e quando NAO usar.
Nao repita conceitos basicos do 03-OPP.
```

### Mini-Aula 3.5.2

```text
Refine a mini-aula 3.5.2 (Factory para Connectors) com exemplos de fonte e destino.
Inclua risco de factory deus, criterio de uso, e testes minimos de registry.
```

### Mini-Aula 3.5.3

```text
Refine a mini-aula 3.5.3 (Template Method vs Composicao em ETL).
Inclua decisao objetiva: fluxo fixo vs fluxo variavel, com anti-exemplo de heranca profunda.
```

### Mini-Aula 3.5.4

```text
Refine a mini-aula 3.5.4 (Adapter e Facade para integracoes externas).
Mostre mapeamento de payload externo para contrato interno e teste minimo de timeout/erro.
```

### Mini-Aula 3.5.5

```text
Refine a mini-aula 3.5.5 (Observer/PubSub e Idempotent Consumer).
Foque em retries, duplicidade, chave idempotente e efeito colateral desacoplado.
```

### Mini-Aula 3.5.6

```text
Refine a mini-aula 3.5.6 (Pipes/Filters + Router/Translator/Aggregator).
Inclua scenario multi-canal, traducao de schema, roteamento e agregacao com testes minimos.
```

---

## Checklist de qualidade do bloco

- Sem alteracao em `03-OPP`
- Cada aula explicita "o que e novo vs 03-OPP"
- Todas as aulas com "quando nao usar"
- Todas as aulas com teste minimo esperado
- Conteudo tool-agnostic com Python primeiro

