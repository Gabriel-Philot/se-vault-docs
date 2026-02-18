# Mini-Aula 3.2: Encapsulamento de Verdade

> **Objetivo:** Usar encapsulamento para proteger invariantes, e nao so para esconder atributo com underscore.
> **Fontes:** [Python Docs — Private Variables (§9.6)](https://docs.python.org/3/tutorial/classes.html#private-variables) · [Refactoring Guru — Encapsulate Field](https://refactoring.guru/encapsulate-field) · [Refactoring Guru — Data Class smell](https://refactoring.guru/smells/data-class)

---

## 1. Problema que encapsulamento resolve

Quando qualquer parte do codigo pode alterar os dados de um objeto livremente, o objeto pode entrar em **estado invalido** sem que ninguem perceba.

```python
# ⚠️ Sem encapsulamento: qualquer codigo pode quebrar as regras
class Job:
    def __init__(self):
        self.status = "new"
        self.retries = 0
        self.max_retries = 3

# Em algum lugar distante do codigo...
job = Job()
job.retries = -5          # invalido, mas ninguem impede
job.status = "banana"     # invalido, mas ninguem impede
job.max_retries = 0       # agora o job nunca pode ser retentado
```

**Invariante** = regra que deve ser verdadeira durante toda a vida do objeto.
Exemplos: `retries >= 0`, `status in {"new", "running", "failed", "done"}`, `max_retries >= 0`.

Encapsulamento garante que essas regras nunca sejam violadas, centralizando validacao dentro do proprio objeto.

---

## 2. O modelo de privacidade do Python

> **Fato critico:** "Private instance variables that cannot be accessed except from inside an object **don't exist in Python**." — Python Docs §9.6

Python nao tem `private` ou `protected` como Java/C#. Tudo funciona por **convencao**:

| Prefixo | Significado | Comportamento |
|---------|-------------|---------------|
| `name` | Publico | Acesso livre |
| `_name` | "Protegido" por convencao | Python nao impede acesso, mas sinaliza: "nao mexa diretamente" |
| `__name` | Name mangling | Python renomeia para `_ClassName__name` — evita colisao em heranca, mas **nao e seguranca** |

```python
class Secret:
    def __init__(self):
        self._token = "abc123"      # convencao: nao acesse direto
        self.__internal = "xyz"     # name mangling

s = Secret()
print(s._token)              # funciona — Python nao impede
print(s._Secret__internal)   # funciona — mangling nao e seguranca
```

**Conclusao:** em Python, encapsulamento nao e sobre esconder dados (voce nao consegue de verdade). E sobre **comunicar intencao** e **centralizar regras**.

---

## 3. Encapsulamento e controle de regra (invariantes)

Encapsular e proteger o estado para que o objeto nunca entre em estado invalido.

```python
class RetryPolicy:
    """Invariante: max_retries >= 0 durante toda a vida do objeto."""

    def __init__(self, max_retries: int):
        if max_retries < 0:
            raise ValueError("max_retries deve ser >= 0")
        self._max_retries = max_retries  # _ sinaliza: use a API, nao o atributo

    @property
    def max_retries(self) -> int:
        return self._max_retries
        # Sem setter: max_retries e imutavel apos criacao
```

O underscore `_` nao protege nada tecnicamente — o que protege e a **ausencia de setter** e a **validacao no construtor**.

---

## 4. API publica minima

Expose apenas o que o cliente precisa. Quanto menor a API, menos formas o objeto pode ser corrompido.

```python
class CredentialStore:
    """Invariante: token nunca e vazio."""

    def __init__(self, token: str):
        if not token:
            raise ValueError("token nao pode ser vazio")
        self._token = token

    def rotate_token(self, new_token: str):
        """Unica forma de alterar o token — com validacao."""
        if not new_token:
            raise ValueError("novo token nao pode ser vazio")
        self._token = new_token

    def get_auth_header(self) -> dict:
        """Cliente usa isso, nunca precisa ver o token diretamente."""
        return {"Authorization": f"Bearer {self._token}"}
```

O cliente chama `store.get_auth_header()` — nunca precisa saber que internamente e `_token`.

---

## 5. Property: quando usar e quando nao usar

Use `@property` quando existe **regra de negocio** na leitura ou escrita.
**Nao** use so para embrulhar atributo sem validacao — isso e ruido.

```python
# ⚠️ RUIDO: property sem regra nenhuma
class Config:
    def __init__(self, name: str):
        self._name = name

    @property
    def name(self):
        return self._name  # getter sem logica = desperdicio
```

```python
# ✅ JUSTIFICADO: property com validacao
class BatchConfig:
    """Invariante: chunk_size > 0."""

    def __init__(self, chunk_size: int):
        self.chunk_size = chunk_size  # invoca o setter com validacao

    @property
    def chunk_size(self) -> int:
        return self._chunk_size

    @chunk_size.setter
    def chunk_size(self, value: int):
        if value <= 0:
            raise ValueError("chunk_size deve ser > 0")
        self._chunk_size = value
```

> **Nota:** no `__init__`, usamos `self.chunk_size = chunk_size` (sem `_`) para que o setter seja invocado e a validacao ocorra ja na criacao.

---

## 6. Encapsulando colecoes

Um erro sutil: retornar uma lista mutavel diretamente quebra o encapsulamento.

```python
# ⚠️ ERRADO: lista interna exposta
class Pipeline:
    def __init__(self):
        self._steps = []

    def add_step(self, step: str):
        self._steps.append(step)

    @property
    def steps(self):
        return self._steps  # retorna a referencia da lista interna!

p = Pipeline()
p.add_step("extract")
p.steps.append("HACK")    # burlou o controle!
print(p.steps)             # ["extract", "HACK"]
```

```python
# ✅ CORRETO: retorna copia ou tupla
class Pipeline:
    def __init__(self):
        self._steps = []

    def add_step(self, step: str):
        if not step:
            raise ValueError("step nao pode ser vazio")
        self._steps.append(step)

    @property
    def steps(self) -> tuple:
        return tuple(self._steps)  # copia imutavel — segura

p = Pipeline()
p.add_step("extract")
p.steps.append("HACK")    # AttributeError: tuple nao tem append
```

---

## 7. Anti-exemplo completo: classe anemica vs classe rica

O code smell **Data Class** (Refactoring Guru) descreve classes que sao apenas "sacos de dados" sem comportamento.

```python
# ⚠️ ANEMICO: toda logica vive fora da classe
class Job:
    def __init__(self):
        self.status = "new"
        self.retries = 0
        self.max_retries = 3

# Logica espalhada pelo codigo cliente
def fail_job(job):
    job.retries += 1
    if job.retries >= job.max_retries:
        job.status = "dead"
    else:
        job.status = "failed"
# Nada impede: job.status = "qualquer_coisa"
```

```python
# ✅ ENCAPSULADO: regras dentro do objeto
class Job:
    VALID_STATUSES = {"new", "running", "failed", "dead", "done"}

    def __init__(self, max_retries: int = 3):
        if max_retries < 0:
            raise ValueError("max_retries deve ser >= 0")
        self._status = "new"
        self._retries = 0
        self._max_retries = max_retries

    @property
    def status(self) -> str:
        return self._status

    @property
    def retries(self) -> int:
        return self._retries

    @property
    def can_retry(self) -> bool:
        return self._retries < self._max_retries

    def start(self):
        """Transicao: new -> running"""
        if self._status != "new":
            raise RuntimeError(f"Nao pode iniciar job em status '{self._status}'")
        self._status = "running"

    def mark_failed(self):
        """Transicao: running -> failed ou dead"""
        if self._status != "running":
            raise RuntimeError(f"Nao pode falhar job em status '{self._status}'")
        self._retries += 1
        self._status = "dead" if not self.can_retry else "failed"

    def mark_done(self):
        """Transicao: running -> done"""
        if self._status != "running":
            raise RuntimeError(f"Nao pode completar job em status '{self._status}'")
        self._status = "done"

# Uso:
job = Job(max_retries=2)
job.start()
job.mark_failed()         # retries=1, status="failed"
job.status = "done"       # ainda funciona (Python nao impede), mas o _ sinaliza que nao deveria
```

---

## 8. Quando NAO encapsular

Nem tudo precisa de getter/setter. Encapsulamento desnecessario adiciona complexidade.

| Cenario | Encapsular? | Por que |
|---------|-------------|---------|
| Config imutavel (read-only) | Sim, mas basta nao ter setter | Nao precisa de property, `NamedTuple` ou `@dataclass(frozen=True)` bastam |
| DTO / Data Transfer Object | Nao | So transporta dados, sem invariantes |
| Atributos com validacao | Sim | Existe regra de negocio para proteger |
| Colecoes internas | Sim | Retornar referencia direta quebra encapsulamento |
| Coordenadas x, y simples | Nao | Sem regra, overhead desnecessario |

```python
from dataclasses import dataclass

# DTO puro — encapsulamento aqui seria ruido
@dataclass
class IngestionEvent:
    source: str
    timestamp: str
    record_count: int
```

---

## 9. Pros e contras

| Pros | Contras |
|------|---------|
| Invariantes protegidos — objeto nunca entra em estado invalido | Mais codigo (properties, validacoes) |
| API clara — cliente sabe exatamente o que pode fazer | Pode virar over-engineering se aplicado a DTOs simples |
| Mudancas internas nao quebram clientes | Python nao garante privacidade real — depende de convencao |
| Facilita debug — regras centralizadas no objeto | Getters/setters sem regra sao desperdicio |

---

## 10. Conexao com dados

- **Credenciais e segredos** nao devem ser mutados livremente — metodo dedicado de rotacao
- **Regras de schema/versionamento** devem ficar proximas do objeto, nao espalhadas no pipeline
- **Colecoes de steps/transformacoes** devem ser encapsuladas para evitar insercao indevida
- **Configs de pipeline** podem ser `dataclass(frozen=True)` — imutaveis por natureza

---

## 11. Resumo

| Conceito | Ponto-chave |
|----------|-------------|
| Encapsulamento | Protege invariantes, nao so esconde atributos |
| `_` em Python | Convencao, nao protecao real |
| `__` (name mangling) | Evita colisao em heranca, nao e seguranca |
| `@property` | Justificado quando existe regra de negocio |
| Classe anemica | Code smell: classe sem comportamento |
| Encapsular colecoes | Retorne copias/tuplas, nunca a referencia interna |
| Quando nao usar | DTOs, `NamedTuple`, `dataclass(frozen=True)` |

---

## Proximo passo

**Mini-Aula 3.3:** Heranca sem Dor.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Um token de API expira e precisa rotacao segura. Se qualquer parte do codigo altera `_token` direto, o pipeline pode usar token expirado ou vazio. Um metodo `rotate_token()` com validacao centraliza a regra e elimina bugs intermitentes.

Outro cenario: a lista de steps do pipeline e exposta como `self.steps` (publico). Um plugin mal escrito faz `pipeline.steps.clear()` e apaga todos os steps. Se `steps` fosse uma property retornando `tuple`, isso seria impossivel.

### Pergunta de checkpoint

1. Se `_` em Python nao impede acesso, qual e o verdadeiro mecanismo de protecao do encapsulamento?
2. Voce tem uma classe com 5 properties — todas sem validacao. O que isso indica?
3. Sua classe retorna `self._items` diretamente em uma property. O que pode dar errado?

### Aplicacao imediata no trabalho

1. Identifique 3 invariantes no seu pipeline (ex: `chunk_size > 0`, token nunca vazio, status so aceita transicoes validas)
2. Verifique se essas regras estao **dentro** da classe ou espalhadas no codigo cliente
3. Se estao fora, mova as validacoes para dentro do objeto usando `__init__`, `@property` ou metodos dedicados
