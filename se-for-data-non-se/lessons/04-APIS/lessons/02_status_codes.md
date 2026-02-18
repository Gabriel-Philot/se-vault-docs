# Status Codes HTTP: A Linguagem das Respostas

Este guia explica os códigos de status HTTP e quando usar cada um.

---

## 0. Por Que Isso Importa?

Quando você faz `response.status_code`, o que 200, 404 ou 500 realmente significam?
*   Cada código tem um propósito semântico
*   Clientes automatizados dependem deles
*   Debugar APIs exige entender a linguagem

---

## 1. Estrutura dos Códigos

Códigos HTTP têm 3 dígitos: **XYZ**

| Dígito | Significado |
|--------|-------------|
| **X** | Classe da resposta (centena) |
| **YZ** | Código específico dentro da classe |

### As 5 Classes

| Classe | Significado | Exemplos |
|--------|-------------|----------|
| **1xx** | Informacional | 100 Continue |
| **2xx** | Sucesso | 200 OK, 201 Created |
| **3xx** | Redirecionamento | 301 Moved, 304 Not Modified |
| **4xx** | Erro do cliente | 400 Bad Request, 404 Not Found |
| **5xx** | Erro do servidor | 500 Internal Error, 502 Bad Gateway |

---

## 2. Códigos de Sucesso (2xx)

### 200 OK

**Quando usar:** Request processado com sucesso.

```bash
GET /pets/1
# Response: 200 OK
{"id": 1, "name": "Rex"}
```

### 201 Created

**Quando usar:** Recurso criado com sucesso. Inclua `Location` header.

```bash
POST /pets
# Response: 201 Created
# Location: /pets/42
{"id": 42, "name": "Luna"}
```

### 204 No Content

**Quando usar:** Sucesso sem corpo de resposta. Comum em DELETE.

```bash
DELETE /pets/1
# Response: 204 No Content
# (body vazio)
```

### 202 Accepted

**Quando usar:** Request aceito para processamento assíncrono.

```bash
POST /import/large-dataset
# Response: 202 Accepted
{"job_id": "abc123", "status": "processing"}
```

---

## 3. Códigos de Redirecionamento (3xx)

### 301 Moved Permanently

**Quando usar:** Recurso mudou de URL permanentemente.

```bash
GET /api/v1/pets
# Response: 301 Moved Permanently
# Location: /api/v2/pets
```

### 304 Not Modified

**Quando usar:** Cache válido (com If-None-Match / If-Modified-Since).

```bash
GET /pets
If-None-Match: "abc123"
# Response: 304 Not Modified
# (body vazio, use cache)
```

---

## 4. Códigos de Erro do Cliente (4xx)

### 400 Bad Request

**Quando usar:** Request mal formatado ou inválido.

```bash
POST /pets
{"name": ""}
# Response: 400 Bad Request
{"detail": "name cannot be empty"}
```

### 401 Unauthorized

**Quando usar:** Autenticação necessária ou falhou.

```bash
GET /pets
# (sem token)
# Response: 401 Unauthorized
{"detail": "Not authenticated"}
```

### 403 Forbidden

**Quando usar:** Autenticado, mas sem permissão.

```bash
DELETE /pets/1
# (autenticado como user comum, não admin)
# Response: 403 Forbidden
{"detail": "Admin access required"}
```

### 404 Not Found

**Quando usar:** Recurso não existe.

```bash
GET /pets/9999
# Response: 404 Not Found
{"detail": "Pet not found"}
```

### 409 Conflict

**Quando usar:** Request conflita com estado atual.

```bash
POST /pets
{"name": "Rex"}  # Rex já existe com unique constraint
# Response: 409 Conflict
{"detail": "Pet with this name already exists"}
```

### 422 Unprocessable Entity

**Quando usar:** Request bem formatado, mas semanticamente inválido.

```bash
POST /pets
{"name": "Rex", "age": -5}  # age não pode ser negativo
# Response: 422 Unprocessable Entity
{
  "detail": [
    {
      "loc": ["body", "age"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

### Diferença: 400 vs 404 vs 422

| Código | Cenário |
|--------|---------|
| **400** | JSON inválido, sintaxe errada |
| **404** | Recurso não existe (ID inválido) |
| **422** | JSON válido, mas valores não passam validação |

---

## 5. Códigos de Erro do Servidor (5xx)

### 500 Internal Server Error

**Quando usar:** Erro inesperado no servidor.

```bash
GET /pets
# (banco caiu, exception não tratada)
# Response: 500 Internal Server Error
{"detail": "Internal server error"}
```

### 502 Bad Gateway

**Quando usar:** Proxy/reverse proxy não conseguiu conectar ao upstream.

```bash
GET /api/pets
# (nginx não consegue falar com FastAPI)
# Response: 502 Bad Gateway
```

### 503 Service Unavailable

**Quando usar:** Servidor temporariamente indisponível (manutenção, sobrecarga).

```bash
GET /pets
# (servidor em manutenção)
# Response: 503 Service Unavailable
# Retry-After: 3600
```

---

## 6. Caixa Didática: 429 Too Many Requests

### O Problema

APIs têm limites. Se você faz requests demais, recebe 429.

```bash
GET /pets
# Response: 429 Too Many Requests
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 1704067200
{"detail": "Rate limit exceeded. Try again in 60 seconds."}
```

### APIs Reais e Seus Limits

| API | Limite Típico | Consequência |
|-----|---------------|--------------|
| **Snowflake** | Query slots | Query enfileirada |
| **Salesforce** | 100 requests/min | 429 |
| **HubSpot** | 100k requests/day | 429 |
| **OpenAI** | RPM/TPM por tier | 429 |
| **Stripe** | 100 req/s live mode | 429 |

### Headers Importantes

| Header | Significado |
|--------|-------------|
| `X-RateLimit-Limit` | Máximo de requests permitidos |
| `X-RateLimit-Remaining` | Quantos restam |
| `X-RateLimit-Reset` | Timestamp quando o contador reseta |
| `Retry-After` | Segundos até poder tentar de novo |

### Como Lidar em Python

```python
import httpx
import time

def get_with_retry(url: str, max_retries: int = 3) -> dict:
    for attempt in range(max_retries):
        response = httpx.get(url)
        
        if response.status_code == 200:
            return response.json()
        
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 60))
            wait_time = retry_after * (2 ** attempt)  # exponential backoff
            print(f"Rate limited. Waiting {wait_time}s...")
            time.sleep(wait_time)
            continue
        
        response.raise_for_status()
    
    raise Exception("Max retries exceeded")
```

### Padrão: Exponential Backoff

```
Tentativa 1: espera 1s
Tentativa 2: espera 2s
Tentativa 3: espera 4s
Tentativa 4: espera 8s
```

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=60)
)
def fetch_data(url: str):
    response = httpx.get(url)
    if response.status_code == 429:
        raise Exception("Rate limited")
    response.raise_for_status()
    return response.json()
```

---

## 7. Tabela de Referência Rápida

| Código | Nome | Quando Usar |
|--------|------|-------------|
| 200 | OK | Request processado |
| 201 | Created | Recurso criado |
| 204 | No Content | Sucesso sem body |
| 301 | Moved Permanently | URL mudou |
| 304 | Not Modified | Cache válido |
| 400 | Bad Request | Request inválido |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso inexistente |
| 409 | Conflict | Conflito de estado |
| 422 | Unprocessable | Validação falhou |
| 429 | Too Many Requests | Rate limit |
| 500 | Internal Error | Erro inesperado |
| 502 | Bad Gateway | Proxy falhou |
| 503 | Service Unavailable | Servidor fora |

---

## 8. Boas Práticas

1. **Use o código correto:** Não retorne 200 para erros
2. **Inclua detail:** `{\"detail\": \"Mensagem clara\"}`
3. **Consistência:** Mesmo formato de erro em toda a API
4. **Logs:** 5xx devem ser logados, 4xx geralmente não

```python
# ERRADO
@app.get("/pets/{pet_id}")
def get_pet(pet_id: int):
    pet = db.get(pet_id)
    if not pet:
        return {"detail": "Not found"}  # Status 200!

# CORRETO
@app.get("/pets/{pet_id}")
def get_pet(pet_id: int):
    pet = db.get(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet
```

---

## Próximos Passos

Agora que você entende status codes, vamos implementar nossa primeira API com **FastAPI + Pydantic**.

→ [03_fastapi_pydantic.md](03_fastapi_pydantic.md)
