# Post-Mortem: Antigravity React Error #62

**Data:** 2026-01-25
**Duração do incidente:** ~2 horas
**Severidade:** Alta (IDE inutilizável)

---

## Resumo Executivo

O Antigravity (IDE baseado em VS Code) apresentava erro "Minified React error #62" ao abrir o workspace `se-vault`. O erro era causado por **estado corrompido do Agent Manager (Gemini)** salvo no workspace storage, não por problemas de versão ou extensões.

---

## Sintomas

- Erro: `Minified React error #62; visit https://reactjs.org/docs/error-decoder.html?invariant=62`
- Mensagem: "Something went wrong" com opções "Report Issue" e "Reload IDE"
- O erro aparecia **especificamente** ao abrir a pasta `se-vault`
- Outras pastas funcionavam normalmente

---

## Investigação Cronológica

### 1. Hipóteses Descartadas

| Hipótese | Ação Tomada | Resultado |
|----------|-------------|-----------|
| Cache corrompido | Limpeza de `~/.config/Antigravity/Cache`, `GPUCache`, `Code Cache` | ❌ Não resolveu |
| Versão do Antigravity | Downgrade 1.15.8 → 1.15.6 | ❌ Não resolveu |
| Extensões problemáticas | Desabilitou todas as extensões | ❌ Não resolveu |
| Extensão incompatível | `ms-python.vscode-python-envs` incompatível com engine 1.104.0 | ⚠️ Contribuinte, mas não causa raiz |
| Reset total | Deletou `~/.config/Antigravity` e `~/.antigravity` | ❌ Não resolveu (erro voltou ao reinstalar extensões) |

### 2. Causa Raiz Identificada

O erro ocorria **apenas** ao abrir o workspace `se-vault` porque:

1. Usuário havia feito uma **request ao Agent (Gemini)** nesse workspace anteriormente
2. O estado da sessão do Agent foi salvo em:
   - `~/.config/Antigravity/User/workspaceStorage/<hash>/state.vscdb`
   - `~/.config/Antigravity/User/globalStorage/state.vscdb`
3. Ao reabrir o workspace, o Antigravity tentava **resumir a sessão do Agent**
4. O estado estava corrompido → React recebia objeto inválido como child → **Error #62**

### 3. Evidência

```bash
strings ~/.config/Antigravity/User/globalStorage/state.vscdb | grep -i agent
```

Retornou:
```
jetskiStateSync.agentManagerInitState  # Estado do Agent Manager
antigravity.agentViewContainerId       # UI do painel Agent
google.antigravity                      # Auth do Gemini
```

---

## Solução

### Comandos que Resolveram

```bash
# 1. Remover workspace storage específico do se-vault
rm -rf ~/.config/Antigravity/User/workspaceStorage/454b0c57cebd8d9857820a216f790795

# 2. Remover global state (contém Agent state)
rm -rf ~/.config/Antigravity/User/globalStorage/state.vscdb*

# 3. Remover cache do Gemini Agent
rm -rf ~/.gemini/antigravity*
```

**Efeito colateral:** Usuário precisou fazer login novamente (auth estava no mesmo `state.vscdb`).

---

## Prevenção Futura

### Se o erro voltar em um workspace específico:

```bash
# 1. Identificar o hash do workspace problemático
grep -rl "NOME_DO_WORKSPACE" ~/.config/Antigravity/User/workspaceStorage/

# 2. Remover apenas esse workspace storage
rm -rf ~/.config/Antigravity/User/workspaceStorage/<hash_encontrado>
```

### Se o erro persistir:

```bash
# Limpar estado global do Agent (vai deslogar)
rm -rf ~/.config/Antigravity/User/globalStorage/state.vscdb*
rm -rf ~/.gemini/antigravity*
```

---

## Lições Aprendidas

1. **Erro React #62 em IDEs baseados em VS Code** geralmente indica estado corrompido, não problema de código
2. **Erros específicos de workspace** → investigar `workspaceStorage` primeiro
3. **Agent/AI features** salvam estado que pode corromper e causar crashes na UI
4. **Extensões incompatíveis** (como `ms-python.vscode-python-envs` requerendo versão específica) podem contribuir mas raramente são causa raiz sozinhas
5. **Downgrade de versão** raramente resolve se o problema é estado corrompido (o estado persiste entre versões)

---

## Arquivos Relevantes

| Caminho | Conteúdo |
|---------|----------|
| `~/.config/Antigravity/` | Configuração principal |
| `~/.config/Antigravity/User/settings.json` | Settings do usuário (preservar!) |
| `~/.config/Antigravity/User/workspaceStorage/` | Estado por workspace |
| `~/.config/Antigravity/User/globalStorage/state.vscdb` | Estado global + auth + Agent |
| `~/.antigravity/extensions/` | Extensões instaladas |
| `~/.gemini/antigravity*/` | Cache do Gemini Agent |

---

## Comandos Úteis para Diagnóstico

```bash
# Ver extensões instaladas
ls ~/.antigravity/extensions/

# Encontrar workspace storage de um projeto
grep -rl "nome-do-projeto" ~/.config/Antigravity/User/workspaceStorage/

# Ver estado salvo (procurar por "agent", "error", etc)
strings ~/.config/Antigravity/User/globalStorage/state.vscdb | grep -i agent

# Verificar versão do Antigravity
antigravity --version
dpkg -s antigravity | grep Version

# Desabilitar extensão temporariamente (renomear)
mv ~/.antigravity/extensions/extensao-1.0.0 ~/.antigravity/extensions/extensao-1.0.0.disabled
```

---

## Referências

- React Error #62: "Objects are not valid as a React child"
- Antigravity usa Open VSX como marketplace (não VS Code Marketplace oficial)
- Agent Manager interno usa Gemini (Google) - `jetskiStateSync`
