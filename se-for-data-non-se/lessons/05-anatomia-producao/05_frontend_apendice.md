# Apêndice: Como o Frontend Funciona (Por Cima)

Este guia dá uma visão geral de como o frontend funciona para quem trabalha com dados e backend. Sem entrar em código — só entender as peças.

---

## 0. Por Que Engenheiros de Dados Devem Entender Isso

*   Você consome APIs — o frontend também. Entender como ele consome ajuda a desenhar APIs melhores.
*   Dashboards (Superset, Metabase, Streamlit) são frontends. Saber o básico ajuda a debugar.
*   Quando alguém do time frontend diz "a API está lenta", você precisa entender de onde vem o request.
*   Dados de comportamento (analytics, A/B tests) vêm de eventos do frontend.

---

## 1. O Trio Básico: HTML, CSS, JavaScript

Todo site na internet se resume a 3 tecnologias que o browser entende:

### HTML — A Estrutura

```
O que é: Markup language que define o CONTEÚDO e a ESTRUTURA da página.
Analogia: A planta baixa da casa — define onde ficam os cômodos.
```

Define: títulos, parágrafos, botões, formulários, tabelas, links, imagens.

### CSS — A Aparência

```
O que é: Linguagem que define o ESTILO visual.
Analogia: A pintura e decoração da casa — cores, tamanhos, posições.
```

Define: cores, fontes, tamanhos, layout, responsividade (mobile vs desktop), animações.

### JavaScript — O Comportamento

```
O que é: Linguagem de PROGRAMAÇÃO que roda no browser.
Analogia: A automação da casa — quando apertar o interruptor, a luz acende.
```

Define: interações (clique, scroll, drag), chamadas a APIs, atualização dinâmica da página, validações.

### Como chegam ao browser

```
Browser pede → Nginx serve arquivos estáticos:
  index.html  (estrutura)
  styles.css  (aparência)
  app.js      (comportamento)

Browser recebe → renderiza HTML → aplica CSS → executa JS
```

---

## 2. Frameworks: React, Vue, Angular

### Por Que Existem

HTML/CSS/JS puro funciona para sites simples. Mas para aplicações complexas (dashboards, e-commerce, ferramentas internas), gerenciar manualmente o estado da página vira um pesadelo.

Frameworks resolvem:
*   **Componentização:** Quebre a UI em peças reutilizáveis (botão, tabela, gráfico).
*   **Estado reativo:** Quando o dado muda, a tela atualiza automaticamente.
*   **Roteamento:** Navegação entre "páginas" sem recarregar o browser.

### Visão Geral

| Framework | Criador | Filosofia | Analogia |
|-----------|---------|-----------|----------|
| **React** | Meta (Facebook) | Biblioteca minimalista — você monta o resto | LEGO: peças soltas, você constrói |
| **Vue** | Evan You (independente) | Framework progressivo — começa simples, cresce | Kit de montagem: instruções incluídas |
| **Angular** | Google | Framework completo — tudo incluído | Casa pré-fabricada: vem tudo pronto |

### Qual é mais usado

React domina o mercado (~65% dos projetos web). Vue é forte na China e em projetos menores. Angular é comum em grandes empresas e projetos corporativos.

**Para engenheiros de dados:** Se você precisar fazer um frontend mínimo (ex: protótipo de dashboard), React ou Vue são as escolhas mais pragmáticas. Ou melhor: use Streamlit/Gradio e não se preocupe com frontend.

---

## 3. SPA vs SSR vs SSG — O Que Muda pro Backend

### SPA — Single Page Application

```
Browser carrega UMA página HTML.
JavaScript controla tudo depois: navegação, requests, renderização.

Fluxo:
1. GET / → Nginx retorna index.html + app.js (bundle grande)
2. Browser executa JS → renderiza a página
3. Navegação: JS pede dados via API → atualiza a tela (sem recarregar)
```

*   **Prós:** Experiência fluida, API desacoplada do frontend.
*   **Contras:** Primeiro carregamento lento (JS grande), SEO ruim.
*   **Exemplos:** Gmail, Spotify Web, Trello.

### SSR — Server-Side Rendering

```
Servidor renderiza o HTML COMPLETO a cada request.
Browser recebe HTML pronto.

Fluxo:
1. GET /produtos → Servidor monta HTML com dados → retorna HTML completo
2. Browser mostra imediatamente (sem esperar JS)
3. JS "hidrata" a página para interatividade
```

*   **Prós:** Primeiro carregamento rápido, SEO bom.
*   **Contras:** Mais carga no servidor, mais complexo.
*   **Exemplos:** Next.js (React), Nuxt.js (Vue).

### SSG — Static Site Generation

```
HTML é gerado em BUILD TIME (não em runtime).
Páginas são arquivos estáticos servidos por CDN.

Fluxo:
1. Build: Gera todas as páginas HTML uma vez
2. Deploy: Upload para CDN (Cloudflare, Vercel)
3. GET /sobre → CDN retorna HTML estático → ultra-rápido
```

*   **Prós:** Ultra-rápido, barato, seguro (sem servidor).
*   **Contras:** Conteúdo não é dinâmico (precisa rebuild para mudar).
*   **Exemplos:** Blogs, documentação, landing pages.

### O Que Muda Para Dados/Backend

| Modelo | Impacto no backend | Quando relevante |
|--------|-------------------|-----------------|
| **SPA** | API pura (JSON). Frontend e backend totalmente separados | A maioria das APIs de dados |
| **SSR** | Servidor precisa renderizar HTML + servir dados | Quando SEO importa |
| **SSG** | Backend só serve API para build. Em runtime, zero carga | Documentação, portais |

**Na prática para engenheiros de dados:** Quase todos os dashboards internos e ferramentas de dados usam SPA. A API que vocês constroem serve JSON, e o frontend React/Vue consome.

---

## 4. Como o Frontend Consome a API

### O ciclo: Frontend → API → Frontend

```
┌──────────┐                    ┌──────────┐
│ Frontend │ ── GET /api/pets → │ Backend  │
│ (React)  │                    │ (FastAPI)│
│          │ ← JSON response ── │          │
└──────────┘                    └──────────┘
```

O frontend usa funções JavaScript para fazer requests HTTP — exatamente como você faz com `requests` ou `httpx` em Python.

### Ferramentas comuns

| Ferramenta | O que é |
|-----------|---------|
| **fetch** | API nativa do browser. Equivalente a `urllib` do Python |
| **axios** | Biblioteca popular. Equivalente a `requests` do Python |

### Conceitos que afetam a sua API

**CORS (Cross-Origin Resource Sharing)**

```
Frontend em: https://app.empresa.com
API em:      https://api.empresa.com

Browser bloqueia por padrão (segurança).
Backend precisa configurar CORS para permitir.
```

Se alguém do frontend diz "tá dando erro de CORS", o problema é na configuração do backend.

**Paginação**

```
Frontend NÃO quer receber 1 milhão de registros de uma vez.
API deve suportar: GET /api/vendas?page=1&limit=50
```

**Formato de resposta**

```
Frontend espera JSON consistente.
Erros também devem ser JSON (não HTML de erro do Nginx).

✓ {"error": "Produto não encontrado", "code": 404}
✗ <html><body>404 Not Found</body></html>
```

---

## 5. Conexão com o Mundo de Dados

| Cenário | Como o frontend se conecta |
|---------|---------------------------|
| **Dashboard de vendas** | React consome API → API consulta banco/cache → retorna JSON → React renderiza gráfico |
| **Upload de dados** | Frontend envia arquivo via `multipart/form-data` → API salva → enfileira processamento |
| **Analytics** | Frontend dispara eventos JS → Vai para serviço de analytics (GA, Segment) → Vira dado no Data Lake |
| **A/B Testing** | Frontend recebe variante do backend → Registra comportamento → Pipeline agrega resultados |
| **Streamlit** | Python gera HTML/JS automaticamente → Você não precisa saber frontend |

---

## 6. Checkpoint

> **Pergunta:** Um colega de frontend diz "a API demora 3 segundos, o dashboard tá lento". Quais camadas entre o clique do usuário e o response você investigaria? (Dica: browser, rede, Nginx, Gunicorn, FastAPI, banco, cache.)

> **Aplicação imediata:** Abra o DevTools do browser (F12), vá na aba Network, e navegue no Airflow/Superset/Metabase do seu time. Observe os requests HTTP que o frontend faz — quais são GET, quais são POST, quanto tempo demora cada um.

---

## Resumo

| Conceito | O que é | Por que importa para dados |
|----------|---------|---------------------------|
| **HTML/CSS/JS** | Trio que o browser entende | Dashboards são isso por baixo |
| **React/Vue/Angular** | Frameworks para UI complexa | Frontend do time usa um desses |
| **SPA** | JS controla tudo no browser | A maioria das tools de dados usa isso |
| **fetch/axios** | Como frontend chama sua API | Entender isso = desenhar APIs melhores |
| **CORS** | Segurança de cross-origin | Erro #1 quando frontend + backend separados |

Você não precisa escrever frontend. Mas entender como funciona ajuda a construir APIs que o frontend consegue consumir sem dor.
