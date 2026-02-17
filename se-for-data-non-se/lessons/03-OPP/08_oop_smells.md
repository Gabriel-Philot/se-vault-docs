# Mini-Aula 3.8: OOP Smells e Anti-Patterns

> **Objetivo:** Reconhecer sinais de design fragil em OOP e aplicar correcoes simples.

---

## 1. Smells principais

1. **God Object**: uma classe faz tudo
2. **Heranca acidental**: classe filha sem relacao real
3. **Abstracao prematura**: interfaces sem necessidade
4. **if/elif infinito por tipo**: ausencia de polimorfismo

---

## 2. smell -> impacto -> correcao

| Smell | Impacto | Correcao |
|-------|---------|----------|
| God Object | Alto acoplamento, testes caros | Separar por responsabilidade |
| Heranca acidental | Quebra ao mudar pai | Trocar por composicao |
| Abstracao prematura | Complexidade sem ganho | Voltar para implementacao simples |
| if/elif por tipo | Codigo rigido | Introduzir contrato + polimorfismo |

---

## 3. Exemplo curto de refactor

Antes:

```python
def run(step_type, data):
    if step_type == "filter":
        return filter_data(data)
    if step_type == "map":
        return map_data(data)
```

Depois:

```python
class Step:
    def run(self, data):
        raise NotImplementedError

class FilterStep(Step):
    def run(self, data):
        return filter_data(data)
```

---

## 4. Conexao com dados

- Smells em pipelines aparecem cedo em times crescendo
- Detectar e corrigir cedo reduz custo de evolucao
- Refactors pequenos e frequentes funcionam melhor que reescrita total

---

## 5. Resumo

- Smell nao e bug imediato, e alerta arquitetural
- O objetivo e reduzir acoplamento e aumentar clareza
- Corrija com pequenos passos e teste de regressao

---

## Proximo passo

**Mini-Aula 3.9:** Ponte para M4.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Pipeline cresce rapido, e o time comeca a "colar" regras em uma classe unica para entregar sprint.
Smells aparecem antes de quebrar producao: build lento, teste fraco, onboard demorado.

### Pergunta de checkpoint

Qual smell hoje causa mais custo no seu time: acoplamento, duplicacao ou falta de fronteira?

### Aplicacao imediata no trabalho

Rode uma revisao de 30 minutos em um modulo de pipeline e registre 2 smells + 2 refactors pequenos para proxima sprint.
