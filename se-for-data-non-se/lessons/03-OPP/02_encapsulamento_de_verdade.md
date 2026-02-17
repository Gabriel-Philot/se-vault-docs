# Mini-Aula 3.2: Encapsulamento de Verdade

> **Objetivo:** Usar encapsulamento para proteger invariantes, e nao so para esconder atributo com underscore.

---

## 1. Encapsulamento e controle de regra

Encapsular e proteger o estado para que o objeto nunca entre em estado invalido.

```python
class RetryPolicy:
    def __init__(self, max_retries: int):
        if max_retries < 0:
            raise ValueError("max_retries deve ser >= 0")
        self._max_retries = max_retries
```

---

## 2. API publica minima

Expose apenas o que o cliente precisa.

```python
class CredentialStore:
    def __init__(self, token: str):
        self._token = token

    def rotate_token(self, new_token: str):
        if not new_token:
            raise ValueError("token vazio")
        self._token = new_token
```

Cliente nao manipula `_token` direto.

---

## 3. Getters/setters: quando usar

Use quando existe regra de negocio.
Nao use so para "embrulhar" atributo sem validacao.

```python
class BatchConfig:
    def __init__(self, chunk_size: int):
        self._chunk_size = 1000
        self.chunk_size = chunk_size

    @property
    def chunk_size(self):
        return self._chunk_size

    @chunk_size.setter
    def chunk_size(self, value: int):
        if value <= 0:
            raise ValueError("chunk_size deve ser > 0")
        self._chunk_size = value
```

---

## 4. Anti-exemplo: anemico

```python
class Job:
    def __init__(self):
        self.status = "new"
        self.retries = 0
```

Se toda validacao acontece fora da classe, ela vira apenas "saco de dados".

Correcao:

```python
class Job:
    def __init__(self):
        self._status = "new"
        self._retries = 0

    def mark_failed(self):
        self._retries += 1
        self._status = "failed"
```

---

## 5. Conexao com dados

- Credenciais e segredos nao devem ser mutados livremente
- Regras de schema/versionamento devem ficar proximas do objeto
- Evita "estado invalido" no meio do pipeline

---

## 6. Resumo

- Encapsulamento protege invariantes
- API publica deve ser pequena e intencional
- Getter/setter sem regra = ruido
- Objeto deve carregar comportamento, nao so campos

---

## Proximo passo

**Mini-Aula 3.3:** Heranca sem Dor.

---

## Bloco didatico: conhecimento proximal

### Cenario real de dados

Um token de API expira e precisa rotacao segura. Se qualquer parte do codigo altera token direto, o pipeline quebra de forma intermitente.
Metodo dedicado de rotacao reduz erro operacional.

### Pergunta de checkpoint

Quais campos do seu dominio nunca deveriam ser alterados sem validacao?

### Aplicacao imediata no trabalho

Mapeie 3 invariantes do pipeline (ex: `chunk_size > 0`, schema obrigatorio, status valido) e centralize as validacoes na classe.
