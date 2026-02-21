# 🧠 Módulo 03: OOP Teórico (com ponte para M4)

## 📊 Visão Geral

| Mini-Aula | Tema | Duração | Tipo | Status |
|-----------|------|---------|------|--------|
| 3.0 | OOP Mental Model para Dados | 20min | Teórico | [ ] |
| 3.1 | Classes, Objetos e Estado | 25min | Teórico | [ ] |
| 3.2 | Encapsulamento de Verdade | 25min | Teórico | [ ] |
| 3.3 | Herança sem Dor | 25min | Teórico | [ ] |
| 3.4 | Polimorfismo em Pipeline | 25min | Teórico | [ ] |
| 3.5 | Abstração com ABC e Protocol | 30min | Teórico | [ ] |
| 3.6 | Composição vs Herança | 25min | Teórico | [ ] |
| 3.7 | Factory Method (Design Patterns Guru) | 30min | Teórico | [ ] |
| 3.8 | OOP Smells e Anti-Patterns | 20min | Teórico | [ ] |
| 3.9 | Ponte para M4 (OOP em Dados) | 20min | Teórico | [ ] |
| 3.10 | Matriz de Decisao de Design Patterns | 30min | Teórico | [ ] |
| 3.11 | Extra: Patterns Complementares (Adapter, Observer, Pipes) | 35min | Teórico | [x] |
| 3.12 | SOLID — Voce Ja Sabe (recap formal) | 25min | Teórico | [x] |
| Prática | Consolidacao M3 + Blueprint M4 | 40min | Hands-on | [ ] |
| **TOTAL** | | **6h15** | | |

---

## 🎯 Objetivo do Módulo

- Consolidar os fundamentos de OOP com foco em engenharia de dados
- Ensinar o uso pragmático dos pilares (sem dogma)
- Introduzir Factory Method com linguagem alinhada ao Design Patterns Guru
- Entregar base pronta para M4 (OOP aplicado em pipelines)

---

## 🧭 Fórmula Didática Padrão (usar em todas as aulas)

1. Contexto real do problema
2. Conceito central
3. Exemplo curto em Python
4. Anti-exemplo comum
5. Conexão com dados
6. Resumo/cheat sheet

---

## 🗂️ PROMPTS PARA PRÓXIMAS SESSÕES

### Mini-Aula 3.0: OOP Mental Model para Dados
**Prompt:**
```text
Crie a mini-aula 3.0 (OOP Mental Model para Dados).

Estrutura:
1. Por que OOP existe (manutenibilidade e evolucao)
2. Quando OOP ajuda e quando atrapalha
3. Procedural vs OOP vs funcional (visao pragmatica)
4. Conexao com pipelines de dados reais

Formato:
- Maximo 160 linhas
- Estilo didatico e direto
- Incluir um quadro de "quando usar"

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/00_oop_mental_model.md
```

### Mini-Aula 3.1: Classes, Objetos e Estado
**Prompt:**
```text
Crie a mini-aula 3.1 (Classes, Objetos e Estado).

Estrutura:
1. Classe vs instancia
2. self e ciclo de vida do objeto
3. Estado mutavel e efeitos colaterais
4. Exemplo com DataSource simples

Formato:
- Maximo 180 linhas
- Inclua tabela "erro comum -> correcao"

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/01_classes_objetos_estado.md
```

### Mini-Aula 3.2: Encapsulamento de Verdade
**Prompt:**
```text
Crie a mini-aula 3.2 (Encapsulamento de Verdade).

Estrutura:
1. Encapsulamento como controle de invariantes
2. API publica minima
3. Getters/setters: quando usar e quando nao usar
4. Exemplo com credenciais/validacao

Formato:
- Maximo 180 linhas
- Incluir um anti-exemplo de "anemia de objeto"

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/02_encapsulamento_de_verdade.md
```

### Mini-Aula 3.3: Herança sem Dor
**Prompt:**
```text
Crie a mini-aula 3.3 (Heranca sem Dor).

Estrutura:
1. Reuso por heranca
2. Override e super()
3. Risco de hierarquia profunda
4. Regras praticas para heranca saudavel

Formato:
- Maximo 180 linhas
- Incluir comparacao "heranca boa vs ruim"

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/03_heranca_sem_dor.md
```

### Mini-Aula 3.4: Polimorfismo em Pipeline
**Prompt:**
```text
Crie a mini-aula 3.4 (Polimorfismo em Pipeline).

Estrutura:
1. Mesmo contrato, implementacoes diferentes
2. Duck typing em Python
3. Interface unificada em loops de pipeline
4. Exemplo com CsvSource, ApiSource, ParquetSource

Formato:
- Maximo 180 linhas
- Incluir comparacao "if/elif chain vs polimorfismo"

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/04_polimorfismo_pipeline.md
```

### Mini-Aula 3.5: Abstração com ABC e Protocol
**Prompt:**
```text
Crie a mini-aula 3.5 (Abstracao com ABC e Protocol).

Estrutura:
1. O que e abstracao na pratica
2. ABC com abstractmethod
3. typing.Protocol e subtipagem estrutural
4. Quando usar ABC vs Protocol

Formato:
- Maximo 200 linhas
- Incluir tabela de decisao ABC x Protocol

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/05_abstracao_abc_protocol.md
```

### Mini-Aula 3.6: Composição vs Herança
**Prompt:**
```text
Crie a mini-aula 3.6 (Composicao vs Heranca).

Estrutura:
1. Favor composition over inheritance
2. Strategy basico para transformacoes
3. Exemplo de pipeline com componentes plugaveis
4. Criticos de acoplamento

Formato:
- Maximo 180 linhas
- Incluir checklist de decisao

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/06_composicao_vs_heranca.md
```

### Mini-Aula 3.7: Factory Method (Guru)
**Prompt:**
```text
Crie a mini-aula 3.7 (Factory Method) alinhada ao Design Patterns Guru.

Estrutura:
1. Problema de criacao de objetos
2. Estrutura Creator / ConcreteCreator / Product / ConcreteProduct
3. Como o cliente depende da abstracao
4. Exemplo para pipeline de dados (create_stage)

Formato:
- Maximo 220 linhas
- Incluir mini diagrama ASCII do pattern
- Linguagem fiel a terminologia do Guru

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/07_factory_method_guru.md
```

### Mini-Aula 3.8: OOP Smells e Anti-Patterns
**Prompt:**
```text
Crie a mini-aula 3.8 (OOP Smells e Anti-Patterns).

Estrutura:
1. God Object
2. Heranca acidental
3. Abstracao prematura
4. if/elif infinito por tipo
5. Refactors simples para cada smell

Formato:
- Maximo 160 linhas
- Incluir tabela "smell -> impacto -> correcao"

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/08_oop_smells.md
```

### Mini-Aula 3.9: Ponte para M4
**Prompt:**
```text
Crie a mini-aula 3.9 (Ponte para M4: OOP em Dados).

Estrutura:
1. Recap dos pilares aplicados
2. Blueprint ETL orientado a objetos
3. Contratos de Source, Transform, Sink
4. Proximos passos para modulo pratico

Formato:
- Maximo 150 linhas
- Entregar um esqueleto de classes para usar no M4

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/09_ponte_m4_oop_dados.md
```

### Mini-Aula 3.10: Matriz de Decisao de Design Patterns
**Prompt:**
```text
Crie a mini-aula 3.10 (Matriz de Decisao de Design Patterns para Engenharia de Dados).

Estrutura:
1. Premissa de engenharia: decidir sob trade-offs
2. Matriz 1: quando vale usar pattern (perguntas de decisao)
3. Heuristicas para evitar overengineering (YAGNI, gatilho de refactor)
4. Matriz 2: patterns mais comuns em dados (cenario -> pattern -> custo -> teste minimo)
5. Notas de edge cases (exemplos Uber/Netflix)
6. Bloco de AI coding: como escrever prompts melhores com criterio de engenharia

Formato:
- Maximo 240 linhas
- Incluir 2 tabelas (simples + avancada)
- Manter foco em decisao, nao em decoracao de catalogo

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/10_matriz_decisao_design_patterns.md
```

### Prática do Módulo 03
**Prompt:**
```text
Crie o arquivo de pratica do modulo 03 (OOP).

Desafios:
1. Refatorar script procedural para classes
2. Trocar source via polimorfismo sem alterar loop
3. Introduzir factory method para criar stages
4. Identificar e corrigir 2 OOP smells

Formato:
- Hands-on com enunciado + criterios de aceitacao
- Incluir dicas e gabarito resumido

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/pratica.md
```

### Mini-Aula 3.11 (Extra): Patterns Complementares para Dados
**Prompt:**
```text
Crie a mini-aula 3.11 (Extra: Patterns Complementares para Engenharia de Dados).

Estrutura em 3 blocos:
A. Adapter e Facade (Guru): participantes, diagrama, exemplo de vendor externo, Facade para subsistema
B. Observer/PubSub + Idempotent Consumer: terminologia Publisher/Subscriber, exemplo com EventBus e dedup
C. Pipes/Filters + Router/Translator/Aggregator: EIP, pipeline multi-canal com teste por etapa

Formato:
- Maximo 400 linhas
- Seguir formula didatica do modulo (problema, conceito, exemplo, anti-exemplo, pros/cons, relacoes, conexao com dados)
- Testes minimos e bloco didatico com checkpoint + aplicacao imediata

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/11_extra_patterns_dados.md
```

### Mini-Aula 3.12: SOLID — Voce Ja Sabe (recap formal)
**Prompt:**
```text
Crie a mini-aula 3.12 (SOLID — Voce Ja Sabe).

Abordagem: recap formal — o aluno ja praticou todos os principios ao longo do modulo 3.
Para cada principio (SRP, OCP, LSP, ISP, DIP):
1. Citacao original do autor
2. "Onde voce ja aprendeu" — referencia cruzada com aulas anteriores
3. Exemplo antes/depois em Python
4. Conexao com dados

Incluir secao final de YAGNI (quando SOLID e overengineering).
Bloco didatico com 5 perguntas de checkpoint (1 por principio).

Salvar em: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/12_solid_voce_ja_sabe.md
```

---

## ✅ Checklist de Criação

- [ ] 3.0 - OOP Mental Model
- [ ] 3.1 - Classes, Objetos e Estado
- [ ] 3.2 - Encapsulamento de Verdade
- [ ] 3.3 - Herança sem Dor
- [ ] 3.4 - Polimorfismo em Pipeline
- [ ] 3.5 - Abstração com ABC e Protocol
- [ ] 3.6 - Composição vs Herança
- [ ] 3.7 - Factory Method (Guru)
- [ ] 3.8 - OOP Smells
- [ ] 3.9 - Ponte para M4
- [ ] 3.10 - Matriz de Decisao de Design Patterns
- [x] 3.11 - Extra: Patterns Complementares (Adapter, Observer, Pipes)
- [x] 3.12 - SOLID — Voce Ja Sabe (recap formal)
- [ ] Prática
