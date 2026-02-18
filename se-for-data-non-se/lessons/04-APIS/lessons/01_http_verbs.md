# Verbos HTTP: A Gramática das APIs

Este guia explica os métodos HTTP e sua correlação com operações CRUD.

---

## 0. Por Que Isso Importa?

Quando você faz `requests.get()` ou `requests.post()`, está escolhendo um verbo HTTP. Cada um tem:
*   Um significado semântico
*   Comportamentos esperados (idempotência, cacheabilidade)
*   Uma correlação natural com CRUD

Usar o verbo errado é como pedir "DELETE" num cardápio de restaurante.

---

## 1. O Que São Verbos HTTP?

HTTP (Hypertext Transfer Protocol) define métodos que indicam a ação desejada.

| Verbo | Ação | CRUD | Body no Request? |
|-------|------|------|------------------|
| **GET** | Buscar | READ | Não |
| **POST** | Criar | CREATE | Sim |
| **PUT** | Atualizar (completo) | UPDATE | Sim |
| **PATCH** | Atualizar (parcial) | UPDATE | Sim |
| **DELETE** | Remover | DELETE | Opcional |

---

## 2. GET: Buscar Dados

### Características
*   **Seguro:** Não modifica estado do servidor
*   **Idempotente:** Múltiplas chamadas = mesmo resultado
*   **Cacheável:** Pode ser armazenado em cache

### Exemplos

```bash
# Buscar todos os pets
GET /pets

# Buscar pet específico
GET /pets/1

# Com query parameters
GET /pets?species=dog&min_age=2
```

### Em Python

```python
import httpx

response = httpx.get("http://localhost:8000/pets")
pets = response.json()
```

### Quando Usar
*   Listar recursos
*   Buscar por ID
*   Filtrar dados

---

## 3. POST: Criar Recursos

### Características
*   **Não idempotente:** Múltiplas chamadas = múltiplos recursos criados
*   **Não seguro:** Modifica estado
*   **Não cacheável**

### Exemplos

```bash
# Criar novo pet
POST /pets
Content-Type: application/json

{
  "name": "Rex",
  "species": "dog",
  "age": 3
}
```

### Em Python

```python
import httpx

new_pet = {"name": "Luna", "species": "cat", "age": 2}
response = httpx.post("http://localhost:8000/pets", json=new_pet)
created_pet = response.json()  # Retorna o pet com ID
```

### Quando Usar
*   Criar novo recurso
*   Disparar ações (POST /pets/1/feed)
*   Processamentos não-idempotentes

---

## 4. PUT: Atualização Completa

### Características
*   **Idempotente:** Mesmo payload, múltiplas chamadas = mesmo resultado
*   **Não seguro:** Modifica estado
*   **Substitui completamente:** Todos os campos devem ser enviados

### Exemplos

```bash
# Atualizar pet COMPLETO
PUT /pets/1
Content-Type: application/json

{
  "name": "Rex Atualizado",
  "species": "dog",
  "age": 4,
  "hunger_level": 30,
  "happiness": 80
}
```

### Em Python

```python
updated_pet = {
    "name": "Rex",
    "species": "dog",
    "age": 4,
    "hunger_level": 30,
    "happiness": 80
}
response = httpx.put("http://localhost:8000/pets/1", json=updated_pet)
```

### Quando Usar
*   Atualizar recurso inteiro
*   Quando você tem todos os campos

---

## 5. PATCH: Atualização Parcial

### Características
*   **Idempotente:** Sim (RFC 5789)
*   **Não seguro:** Modifica estado
*   **Parcial:** Só campos enviados são atualizados

### Exemplos

```bash
# Atualizar APENAS o nome
PATCH /pets/1
Content-Type: application/json

{
  "name": "Rex II"
}
```

### Em Python

```python
response = httpx.patch("http://localhost:8000/pets/1", json={"name": "Rex II"})
```

### PUT vs PATCH: Qual Usar?

| Cenário | Use |
|---------|-----|
| Atualizar todos os campos | PUT |
| Atualizar 1-2 campos | PATCH |
| API externa requer todos os campos | PUT |
| Payload mínimo importa | PATCH |

---

## 6. DELETE: Remover Recursos

### Características
*   **Idempotente:** Deletar algo já deletado = mesmo resultado (recurso não existe)
*   **Não seguro:** Modifica estado

### Exemplos

```bash
# Deletar pet
DELETE /pets/1
```

### Em Python

```python
response = httpx.delete("http://localhost:8000/pets/1")
# Retorna 204 No Content ou 200 com confirmação
```

### Quando Usar
*   Remover recurso permanentemente
*   Soft delete (marcar como inativo)

---

## 7. Idempotência Explicada

**Idempotente** = Fazer a mesma operação N vezes tem o mesmo efeito que fazer 1 vez.

| Verbo | Idempotente? | Por Quê? |
|-------|--------------|----------|
| GET | Sim | Só lê, não modifica |
| PUT | Sim | Substitui pelo mesmo valor |
| PATCH | Sim | Atualiza mesmos campos |
| DELETE | Sim | Recurso some, fica gone |
| POST | **Não** | Cada chamada cria novo |

### Por Que Importa?

*   **Retries:** Se a rede falhar, você pode repetir operações idempotentes
*   **Distributed Systems:** Mensagens duplicadas não causam problemas

```python
# POST: CUIDADO com retries
# Isso pode criar pets duplicados!
for _ in range(3):
    httpx.post("/pets", json={"name": "Rex"})  # 3 pets criados!

# PUT: SEGURO para retry
# Isso só atualiza o mesmo pet 3 vezes
for _ in range(3):
    httpx.put("/pets/1", json={"name": "Rex", "age": 3})  # Mesmo resultado
```

---

## 8. Segurança Explicada

**Seguro** = Não modifica estado do servidor.

| Verbo | Seguro? |
|-------|---------|
| GET | Sim |
| HEAD | Sim |
| OPTIONS | Sim |
| POST | Não |
| PUT | Não |
| PATCH | Não |
| DELETE | Não |

### Por Que Importa?

*   Browsers podem fazer GET livremente
*   Crawlers e bots só devem fazer GET
*   Preflight requests (CORS) tratam diferente

---

## 9. Tabela Comparativa Completa

| Verbo | CRUD | Idempotente | Seguro | Body Request | Body Response | Cacheável |
|-------|------|-------------|--------|--------------|---------------|-----------|
| GET | READ | Sim | Sim | Não | Sim | Sim |
| POST | CREATE | Não | Não | Sim | Sim | Não* |
| PUT | UPDATE | Sim | Não | Sim | Sim | Não |
| PATCH | UPDATE | Sim | Não | Sim | Sim | Não |
| DELETE | DELETE | Sim | Não | Opcional | Opcional | Não |

*POST pode ser cacheável com headers específicos, mas é raro.

---

## 10. Exemplos Práticos com curl

```bash
# GET: Listar pets
curl http://localhost:8000/pets

# GET com query params
curl "http://localhost:8000/pets?species=dog&limit=10"

# GET por ID
curl http://localhost:8000/pets/1

# POST: Criar pet
curl -X POST http://localhost:8000/pets \
  -H "Content-Type: application/json" \
  -d '{"name": "Rex", "species": "dog", "age": 3}'

# PUT: Atualizar completo
curl -X PUT http://localhost:8000/pets/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Rex", "species": "dog", "age": 4, "hunger_level": 50, "happiness": 50}'

# PATCH: Atualizar parcial
curl -X PATCH http://localhost:8000/pets/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Rex II"}'

# DELETE: Remover
curl -X DELETE http://localhost:8000/pets/1
```

---

## 11. Cheat Sheet

| Verbo | Use Para | Lembre Assim |
|-------|----------|--------------|
| GET | Buscar dados | "Me dá isso" |
| POST | Criar novo | "Adiciona isso" |
| PUT | Substituir tudo | "Troca por isso" |
| PATCH | Modificar partes | "Arruma isso" |
| DELETE | Remover | "Tira isso" |

---

## Próximos Passos

Agora que você sabe os verbos, vamos entender os **Status Codes** — como a API responde "deu bom" ou "deu ruim".

→ [02_status_codes.md](02_status_codes.md)
