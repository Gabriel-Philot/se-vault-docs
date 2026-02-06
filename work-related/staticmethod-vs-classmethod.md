# @staticmethod vs @classmethod

## Resumo Rápido

| Decorador | Recebe | Quando usar |
|-----------|--------|-------------|
| (método normal) | `self` | Precisa de dados do objeto |
| `@classmethod` | `cls` | Singleton, Factory, recursos compartilhados |
| `@staticmethod` | nada | Funções utilitárias puras |

---

## @staticmethod

**O que é:** Função dentro da classe que NÃO recebe `self` nem `cls`.

**Quando usar:**
- Validações simples (date, email, country code)
- Transformações puras (clean, parse, format)
- **UDFs no Spark** (evita serialização)

**Exemplo:**
```python
class DataValidator:
    
    @staticmethod
    def is_valid_date(date_string):
        """Não precisa de dados da classe ou instância"""
        return len(date_string) == 10 and date_string[4] == '-'
    
    @staticmethod
    def clean_country_code(code):
        """Função pura"""
        return code.strip().upper()

# Uso (sem criar objeto)
DataValidator.is_valid_date('2026-01-24')  # True
DataValidator.clean_country_code('  br  ')  # 'BR'
```

**Por que usar no Spark:**
```python
# ✓ Seguro - só serializa a função
@staticmethod
def clean_name(name):
    return name.strip()

df.rdd.map(lambda x: Transformer.clean_name(x))  # OK

# ❌ Risco - serializa o objeto inteiro (com self.spark)
def clean_name(self, name):
    return name.strip()

df.rdd.map(lambda x: self.clean_name(x))  # ERRO
```

---

## @classmethod

**O que é:** Método que recebe `cls` (a classe) ao invés de `self` (a instância).

**Quando usar:**
- **Singleton** - Uma única instância compartilhada
- **Factory methods** - Formas alternativas de criar objetos
- **Recursos globais** - Cache, broadcast, configurações compartilhadas

**Exemplo 1: Singleton (SparkSession)**
```python
class SparkManager:
    _spark = None  # ← Compartilhado por TODAS as instâncias
    
    @classmethod
    def get_spark(cls):
        """Retorna sempre a mesma SparkSession"""
        if cls._spark is None:
            cls._spark = SparkSession.builder.getOrCreate()
        return cls._spark

# Uso
spark1 = SparkManager.get_spark()
spark2 = SparkManager.get_spark()
# spark1 is spark2 → True (mesma instância)
```

**Exemplo 2: Factory Method**
```python
class Pipeline:
    def __init__(self, countries, start_date):
        self.countries = countries
        self.start_date = start_date
    
    @classmethod
    def from_config(cls, config_dict):
        """Alternativa ao __init__"""
        return cls(
            countries=config_dict['countries'],
            start_date=config_dict['start_date']
        )

# Uso
pipeline1 = Pipeline(['BR'], '2026-01-24')  # Normal
pipeline2 = Pipeline.from_config({...})      # Factory
```

**Exemplo 3: Cache Global**
```python
class BroadcastManager:
    _cache = {}  # ← Compartilhado
    
    @classmethod
    def get_broadcast(cls, spark, key, data):
        """Cache de broadcast variables"""
        if key not in cls._cache:
            cls._cache[key] = spark.sparkContext.broadcast(data)
        return cls._cache[key]
```

---

## Diferença Visual

```python
class Pipeline:
    total_count = 0  # ← CLASSE (compartilhado)
    
    def __init__(self, name):
        self.name = name  # ← INSTÂNCIA (único por objeto)
    
    def process(self, data):
        """Método normal - usa self"""
        print(f"{self.name} processando...")
    
    @classmethod
    def increment_count(cls):
        """@classmethod - modifica atributo compartilhado"""
        cls.total_count += 1
    
    @staticmethod
    def validate(data):
        """@staticmethod - função pura (sem estado)"""
        return data is not None
```

```
┌──────────────────────────┐
│  CLASSE Pipeline         │
│  total_count = 0 ◄───────┼── @classmethod acessa aqui
└──────────────────────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
 obj1  obj2  obj3
 name: "A"  "B"  "C"  ◄────── Método normal (self) acessa aqui

@staticmethod não acessa nada (função pura)
```

---

## Quando usar cada um?

### Use método normal (`self`):
- **99% dos casos**
- Quando precisa de dados do objeto (`self.countries`, `self.spark`)

### Use `@classmethod`:
- Singleton (SparkSession única)
- Factory methods (`from_config()`, `from_s3()`)
- Cache/recursos compartilhados (broadcast)

### Use `@staticmethod`:
- Funções utilitárias (validações, parse)
- **UDFs no Spark** (evita serialização)
- Quando a função só organiza código (namespace)

---

## Regra de Ouro para Spark

| Dado | Compartilhar? | Como guardar |
|------|--------------|--------------|
| SparkSession | ✓ Sim | `@classmethod` |
| Broadcast | ✓ Sim | `@classmethod` |
| Países/Datas | ✗ Não | `self` |
| UDFs | N/A | `@staticmethod` |
