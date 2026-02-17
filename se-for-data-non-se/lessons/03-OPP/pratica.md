# Pratica - Modulo 03 (OOP Teorico)

> **Objetivo:** Consolidar os conceitos de M3 e preparar o terreno para M4.

---

## Desafio 1: Procedural -> OOP

### Enunciado

Voce recebeu um script ETL procedural com funcoes soltas e estado global.
Refatore para classes com responsabilidades claras:

- `Source`
- `Transform`
- `Sink`

### Criterios de aceitacao

- Sem variaveis globais de estado
- Cada classe com responsabilidade unica
- Loop principal legivel

---

## Desafio 2: Troca por Polimorfismo

### Enunciado

Implemente `CsvSource` e `ApiSource` com mesmo contrato.
Troque uma pela outra sem alterar o loop.

### Criterios de aceitacao

- Loop principal identico para as duas fontes
- Nao usar `if/elif` no cliente para decidir comportamento

---

## Desafio 3: Introduzir Factory Method

### Enunciado

Crie uma factory para instanciar stages por nome.

### Criterios de aceitacao

- Cliente nao instancia classes concretas diretamente
- Novo stage exige apenas classe + registro na factory

---

## Desafio 4: Caça a Smells

### Enunciado

Identifique pelo menos 2 OOP smells no seu codigo e aplique refactor.

### Sugestoes de smells

- God object
- if/elif por tipo
- heranca desnecessaria
- interface sem uso

### Criterios de aceitacao

- Documentar smell encontrado
- Documentar refactor aplicado
- Explicar ganho (acoplamento/testabilidade/clareza)

---

## Desafio 5: Matriz de decisao de patterns

### Enunciado

Escolha um modulo real (ou simulado) de pipeline e aplique as 2 matrizes da aula 3.10:

1. Matriz simples: decidir se vale usar pattern agora.
2. Matriz de mapeamento: escolher qual pattern melhor atende o cenario.

### Criterios de aceitacao

- Responder pelo menos 6 perguntas da matriz simples
- Escolher 1 pattern com justificativa de trade-off
- Definir teste minimo esperado para validar a decisao
- Registrar um \"sinal de overengineering\" que voce quer evitar

---

## Dicas

- Comece simples e refatore em passos pequenos
- Teste contrato por contrato
- Nao introduza abstracoes sem necessidade imediata

---

## Gabarito resumido (direcao esperada)

- Design final com contratos estaveis (`Stage` ou `Source/Transform/Sink`)
- Loop central sem `if/elif` estrutural
- Factory concentrando instanciacao
- Smells reduzidos com separacao de responsabilidade

---

## Entrega sugerida

1. Codigo final
2. Lista de decisoes de design
3. 3 aprendizados praticos do modulo
4. 1 decisao arquitetural justificada pela matriz

---

## Contexto de negocio (engenharia de dados)

Imagine um pipeline de ingestao diario com multiplas origens e SLA de manha.
O objetivo da pratica e reduzir risco de mudanca, e nao apenas reorganizar codigo.

Metas praticas:

- Trocar fonte sem alterar orquestrador
- Conter impacto de mudanca em modulo pequeno
- Melhorar testabilidade por contrato

---

## Rubrica de avaliacao (rapida)

| Criterio | Peso |
|---------|------|
| Clareza de contratos (`Source/Transform/Sink`) | 30% |
| Reducao de acoplamento no loop principal | 30% |
| Uso correto de polimorfismo/factory | 25% |
| Justificativa tecnica dos refactors | 15% |
