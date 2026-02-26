# Pesquisa: Estrutura de Prompts para Google AI Studio

## Fontes Consultadas
- [Google AI - Prompt Design Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [Google Cloud - Structure Prompts](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/structure-prompts)

## Estrutura Recomendada

### Para prompts complexos (nosso caso), usar XML tags:

```xml
<ROLE>Definir o propósito do assistente</ROLE>
<CONTEXT>Background e informações necessárias</CONTEXT>
<CONSTRAINTS>Limites e regras de comportamento</CONSTRAINTS>
<DATA>Dados de referência separados por tags</DATA>
<INSTRUCTIONS>Instruções específicas da tarefa</INSTRUCTIONS>
<OUTPUT_FORMAT>Formato esperado da resposta</OUTPUT_FORMAT>
<EXAMPLES>Few-shot examples mostrando o padrão desejado</EXAMPLES>
```

### Princípios Chave:
1. **Contexto primeiro, instrução depois** - em prompts longos, colocar contexto antes
2. **Delimitadores claros** - XML tags ou prefixos com ":" para separar seções
3. **Few-shot examples** - mostrar exemplos do que se quer (não do que evitar)
4. **Prefixos de output** - sinalizar formato esperado (HTML:, CSS:, etc)
5. **Consistência no formato** - mesma formatação em todos os exemplos
6. **Evitar anti-patterns** - mostrar o que QUER, não o que evitar
7. **Controle de verbosidade** - ser explícito sobre nível de detalhe

### Para geração de código frontend:
- Especificar tecnologias exatas (HTML5, CSS3, vanilla JS, etc)
- Incluir constraints como "sem bibliotecas externas" se necessário
- Dar exemplos de estilo de código desejado
- Definir padrões de naming e organização
