# Mini-Aula 3.4: Polimorfismo em Pipeline

> **Objetivo:** Entender como um loop unico pode operar classes diferentes atraves de um contrato comum.

---

## 1. Conceito

Polimorfismo = mesma interface, comportamentos diferentes.

Cliente chama o mesmo metodo sem conhecer a classe concreta.

---

## 2. Exemplo

```python
class CsvSource:
    def read(self):
        return [{"id": 1, "source": "csv"}]

class ApiSource:
    def read(self):
        return [{"id": 2, "source": "api"}]

class ParquetSource:
    def read(self):
        return [{"id": 3, "source": "parquet"}]

sources = [CsvSource(), ApiSource(), ParquetSource()]

for source in sources:
    data = source.read()
    print(data)
```

O loop nao muda ao trocar implementacao.

---

## 3. if/elif chain vs polimorfismo

| if/elif por tipo | Polimorfismo |
|------------------|--------------|
| Cliente conhece cada tipo | Cliente depende de contrato |
| Cresce com novo tipo | Cresce com nova classe, sem mudar loop |
| Mais acoplamento | Mais extensibilidade |
| Alto risco de regressao | Mudanca localizada |

---

## 4. Duck typing em Python

Em Python, se o objeto "fala" `read()`, pode entrar no loop.

Nao precisa, obrigatoriamente, herdar da mesma classe base (embora muitas vezes ajude para clareza).

---

## 5. Conexao com dados

- Trocar `CsvSource` por `ApiSource` sem alterar orquestracao
- Trocar `ConsoleSink` por `DatabaseSink` sem mexer no pipeline core
- Facilita testes com doubles/mocks

---

## 6. Resumo

- Polimorfismo remove `if/elif` estrutural
- Cliente deve depender do comportamento esperado
- Contrato estavel = pipeline extensivel

---

## Proximo passo

**Mini-Aula 3.5:** Abstracao com ABC e Protocol.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Hoje o cliente recebe CSV. Amanhana recebe API. Semana que vem recebe Parquet.
Se o seu orquestrador depende do contrato e nao da implementacao, o pipeline continua estavel.

### Pergunta de checkpoint

Ao adicionar um novo source, voce altera o loop principal ou apenas implementa a nova classe?

### Aplicacao imediata no trabalho

Transforme um `if/elif` real do seu codigo em uma colecao de objetos que compartilham o mesmo metodo.
