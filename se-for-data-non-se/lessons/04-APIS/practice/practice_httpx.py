"""
Mini-Prática: Consumindo APIs com Python

Execute: uv run python practice_httpx.py

Pré-requisitos:
  - API rodando: docker compose up
  - uv add httpx pandas tenacity
"""

import httpx
import pandas as pd
from tenacity import retry, stop_after_attempt, wait_exponential

BASE_URL = "http://localhost/api"


def list_pets(
    species: str | None = None, limit: int = 10, offset: int = 0
) -> list[dict]:
    """Lista pets com filtros opcionais."""
    params = {"limit": limit, "offset": offset}
    if species:
        params["species"] = species

    resp = httpx.get(f"{BASE_URL}/pets", params=params)
    resp.raise_for_status()
    return resp.json()["pets"]


def get_pet(pet_id: int) -> dict:
    """Busca um pet por ID."""
    resp = httpx.get(f"{BASE_URL}/pets/{pet_id}")
    resp.raise_for_status()
    return resp.json()


def create_pet(name: str, species: str, age: int) -> dict:
    """Cria um novo pet."""
    resp = httpx.post(
        f"{BASE_URL}/pets", json={"name": name, "species": species, "age": age}
    )
    resp.raise_for_status()
    return resp.json()


def update_pet(pet_id: int, **fields) -> dict:
    """Atualiza campos específicos de um pet (PATCH)."""
    resp = httpx.patch(f"{BASE_URL}/pets/{pet_id}", json=fields)
    resp.raise_for_status()
    return resp.json()


def delete_pet(pet_id: int) -> None:
    """Remove um pet."""
    resp = httpx.delete(f"{BASE_URL}/pets/{pet_id}")
    resp.raise_for_status()


def feed_pet(pet_id: int) -> dict:
    """Alimenta um pet."""
    resp = httpx.post(f"{BASE_URL}/pets/{pet_id}/feed")
    resp.raise_for_status()
    return resp.json()


def play_with_pet(pet_id: int) -> dict:
    """Brinca com um pet."""
    resp = httpx.post(f"{BASE_URL}/pets/{pet_id}/play")
    resp.raise_for_status()
    return resp.json()


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def fetch_with_retry(endpoint: str, **params) -> dict:
    """Faz request com retry automático (exponential backoff)."""
    resp = httpx.get(f"{BASE_URL}{endpoint}", params=params, timeout=10.0)
    resp.raise_for_status()
    return resp.json()


def to_dataframe(pets: list[dict]) -> pd.DataFrame:
    """Converte lista de pets para DataFrame."""
    if not pets:
        return pd.DataFrame()
    return pd.DataFrame(pets)


def handle_errors():
    """Demonstra tratamento de erros."""
    print("\n=== Tratamento de Erros ===")

    # Pet inexistente → 404
    print("\n1. GET /pets/99999 (pet inexistente):")
    try:
        httpx.get(f"{BASE_URL}/pets/99999").raise_for_status()
    except httpx.HTTPStatusError as e:
        print(f"   Status: {e.response.status_code}")
        print(f"   Detail: {e.response.json().get('detail', 'N/A')}")

    # Validação falhou → 422
    print("\n2. POST /pets sem nome (validação):")
    try:
        httpx.post(f"{BASE_URL}/pets", json={"species": "dog"}).raise_for_status()
    except httpx.HTTPStatusError as e:
        print(f"   Status: {e.response.status_code}")
        print(f"   Detail: {e.response.json().get('detail', 'N/A')}")

    # Query param inválido
    print("\n3. GET /pets?limit=invalid:")
    try:
        httpx.get(f"{BASE_URL}/pets", params={"limit": "invalid"}).raise_for_status()
    except httpx.HTTPStatusError as e:
        print(f"   Status: {e.response.status_code}")


def demo_full_workflow():
    """Demonstra um fluxo completo de uso da API."""
    print("=== Fluxo Completo ===\n")

    # 1. Listar pets existentes
    print("1. Listando pets...")
    pets = list_pets(limit=5)
    print(f"   Encontrados: {len(pets)} pets")

    # 2. Criar novo pet
    print("\n2. Criando novo pet...")
    new_pet = create_pet("Bob", "dog", 3)
    print(f"   Criado: ID={new_pet['id']}, Nome={new_pet['name']}")

    # 3. Alimentar o pet
    print("\n3. Alimentando o pet...")
    fed = feed_pet(new_pet["id"])
    print(f"   Fome: {fed.get('hunger_level', 'N/A')}")

    # 4. Brincar com o pet
    print("\n4. Brincando com o pet...")
    played = play_with_pet(new_pet["id"])
    print(f"   Felicidade: {played.get('happiness', 'N/A')}")

    # 5. Atualizar nome
    print("\n5. Atualizando nome...")
    updated = update_pet(new_pet["id"], name="Bobby")
    print(f"   Novo nome: {updated['name']}")

    # 6. Converter para DataFrame
    print("\n6. Convertendo para DataFrame...")
    all_pets = list_pets(limit=100)
    df = to_dataframe(all_pets)
    if not df.empty:
        print(f"   Shape: {df.shape}")
        print(f"   Colunas: {list(df.columns)[:5]}...")

    # 7. Deletar pet
    print("\n7. Deletando pet...")
    delete_pet(new_pet["id"])
    print(f"   Deletado: ID={new_pet['id']}")


def demo_retry():
    """Demonstra retry com exponential backoff."""
    print("\n=== Retry com Exponential Backoff ===")
    print("   Tentando buscar /stats com retry automático...")

    try:
        stats = fetch_with_retry("/stats")
        print(f"   Total pets: {stats.get('total_pets', 'N/A')}")
    except httpx.HTTPError as e:
        print(f"   Falhou após 3 tentativas: {e}")


if __name__ == "__main__":
    print("=" * 50)
    print("Pet Shop API - Cliente Python")
    print("=" * 50)

    try:
        demo_full_workflow()
        handle_errors()
        demo_retry()
    except httpx.ConnectError:
        print("\nERRO: Não foi possível conectar à API.")
        print("Certifique-se de que o servidor está rodando:")
        print("  cd petshop && docker compose up")
    except Exception as e:
        print(f"\nERRO inesperado: {e}")
