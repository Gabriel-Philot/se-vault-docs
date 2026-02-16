# Mini-Aula 3.0: OOP Mental Model para Dados

> **Objetivo:** Entender por que OOP existe, quando ela ajuda de verdade em dados e quando uma abordagem mais simples é melhor.

---

## 1. O problema que OOP tenta resolver

Em projetos pequenos, script procedural resolve.
Em projetos que crescem, aparecem sintomas:

- Regras espalhadas em varios arquivos
- Condicoes `if/elif` para cada tipo novo
- Dificuldade para trocar implementacao sem quebrar fluxo
- Testes caros porque tudo depende de tudo

**OOP entra para organizar comportamento + estado em unidades coesas**, com contratos claros.

---

## 2. O que muda no modelo mental

Sem OOP, pensamos em: "qual funcao chamar agora?"
Com OOP, pensamos em:

1. Quais entidades existem no dominio?
2. Qual responsabilidade de cada entidade?
3. Qual contrato entre elas?
4. Como trocar implementacoes sem mudar o cliente?

Exemplo em dados:

- Entidade: `Source`
- Responsabilidade: produzir dados
- Contrato: `read()`
- Troca sem quebrar cliente: `CsvSource`, `ApiSource`, `ParquetSource`

---

## 3. Procedural vs OOP vs Funcional (visao pragmatica)

| Estilo | Melhor uso | Risco comum |
|--------|------------|-------------|
| Procedural | Scripts curtos, tarefa unica | Virar script gigante sem fronteiras |
| OOP | Sistemas com entidades e variacoes de comportamento | Excesso de classes sem necessidade |
| Funcional | Transformacoes puras e pipelines declarativos | Ignorar estado quando ele eh inevitavel |

Regra pratica:

- Comece simples
- Evolua para OOP quando houver variacao de comportamento e manutencao dificil
- Use funcoes puras dentro de metodos quando fizer sentido

---

## 4. Exemplo curto (Python)

```python
from abc import ABC, abstractmethod

class Source(ABC):
    @abstractmethod
    def read(self):
        pass

class CsvSource(Source):
    def read(self):
        return [{"id": 1, "origin": "csv"}]

class ApiSource(Source):
    def read(self):
        return [{"id": 1, "origin": "api"}]


def run_pipeline(source: Source):
    data = source.read()
    return len(data)

print(run_pipeline(CsvSource()))
print(run_pipeline(ApiSource()))
```

**Leitura do exemplo:** O cliente (`run_pipeline`) depende do contrato `Source`, nao da classe concreta.

---

## 5. Anti-exemplo comum

```python
# Cresce mal: novo tipo => mais if/elif

def run_pipeline(source_type: str):
    if source_type == "csv":
        data = read_csv()
    elif source_type == "api":
        data = read_api()
    elif source_type == "parquet":
        data = read_parquet()
    # ... continua crescendo
    return len(data)
```

Problema: o cliente conhece detalhes de todas as implementacoes.

---

## 6. Quadro rapido: quando usar OOP

Use OOP quando:

- Existem entidades estaveis no dominio (Source, Transform, Sink)
- Ha multiplas implementacoes do mesmo contrato
- O sistema precisa evoluir sem reescrever fluxo central

Evite OOP pesada quando:

- E script de analise descartavel
- Nao ha variacao de comportamento
- Uma funcao pura resolve com clareza

---

## 7. Conexao com dados (mundo real)

Em data engineering, OOP ajuda principalmente em:

- Conectores intercambiaveis (S3, Kafka, API, DB)
- Regras de validacao encapsuladas por dominio
- Pipelines extensivos sem `if/elif` infinito
- Testes por contrato (mock de `Source`, `Transform`, `Sink`)

---

## 8. Resumo (cheat sheet)

- OOP nao e objetivo final; e ferramenta de organizacao
- Use quando houver variacao + evolucao + manutencao
- Contratos reduzem acoplamento
- Cliente deve depender de abstracao, nao de implementacao
- Em dados: troque pecas do pipeline sem reescrever o loop

---

## Proximo passo

**Mini-Aula 3.1:** Classes, Objetos e Estado.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Seu time precisa trocar uma fonte de ingestao de CSV para API sem parar o job diario.
Se o fluxo central estiver acoplado ao tipo concreto, a mudanca vira retrabalho.
Com contrato (`Source.read()`), a troca fica localizada.

### Pergunta de checkpoint

Se amanha entrar uma fonte Kafka, qual parte do seu codigo deveria mudar: o loop do pipeline ou apenas a nova classe?

### Aplicacao imediata no trabalho

Liste 2 pontos do seu pipeline atual que tem `if/elif` por tipo e marque onde um contrato unico reduziria risco.
