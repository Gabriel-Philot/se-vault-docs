# Mini-Aula 3.3: Heranca sem Dor

> **Objetivo:** Aplicar heranca com criterio, usando `super()` e evitando hierarquias rigidas.

---

## 1. Quando heranca ajuda

Heranca e boa quando existe relacao "e um tipo de" com comportamento compartilhado estavel.

```python
class Source:
    def read(self):
        raise NotImplementedError

class CsvSource(Source):
    def read(self):
        return [{"id": 1, "from": "csv"}]
```

---

## 2. Override + super()

```python
class FileSource(Source):
    def __init__(self, path: str):
        self.path = path

class CsvSource(FileSource):
    def __init__(self, path: str, delimiter: str = ","):
        super().__init__(path)
        self.delimiter = delimiter
```

Use `super()` para reaproveitar inicializacao valida da classe pai.

---

## 3. Risco de hierarquia profunda

Exemplo ruim:

`BaseSource -> FileSource -> DelimitedSource -> CsvSource -> BusinessCsvSource`

Quanto mais niveis, mais acoplamento e surpresa de comportamento.

Regra pratica:

- Prefira 1-2 niveis de heranca
- Acima disso, avaliar composicao

---

## 4. Heranca boa vs ruim

| Boa | Ruim |
|-----|------|
| Contrato simples no pai | Pai com dezenas de metodos |
| Filhos realmente especializados | Filhos sobrescrevendo tudo |
| Override pontual | Dependencia de detalhes internos do pai |
| Facil testar pai e filhos | Mudar pai quebra metade do sistema |

---

## 5. Conexao com dados

- `Source`, `Transform`, `Sink` como bases estaveis
- Classes concretas especializam comportamento de I/O
- Mudancas de baixo nivel nao devem vazar para cliente

---

## 6. Resumo

- Heranca e ferramenta de reuso, nao padrao default
- Use `super()` para manter invariantes
- Evite arvore profunda
- Se esta "forcando" heranca, troque por composicao

---

## Proximo passo

**Mini-Aula 3.4:** Polimorfismo em Pipeline.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Sua empresa tem `BaseSource` para S3, API e banco. Quando a base cresce demais, toda mudanca vira regressao em cadeia.
Heranca curta + contrato claro reduz impacto.

### Pergunta de checkpoint

Sua classe filha realmente "e um tipo de" classe pai ou esta apenas reaproveitando codigo?

### Aplicacao imediata no trabalho

Identifique uma hierarquia com mais de 2 niveis e proponha simplificacao por composicao para um trecho especifico.
