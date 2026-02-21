# SOLID Refactory

> Aplicação interativa — Módulo 3, Aula 3.12: **SOLID — Você Já Sabe, Só Faltavam os Nomes**

Ferramenta pedagógica que traduz os cinco princípios SOLID em interações diretas: arraste métodos, extraia estratégias, identifique violações de contrato, mova um slider e inverta dependências — sem precisar ler uma palavra de teoria antes de entender o conceito.

---

## Executar com Docker Compose (recomendado para uso final)

```bash
cd studies/se-vault-docs/se-for-data-non-se/lessons/03-OPP/solid_project/solid-refactory
docker compose up --build
```

Acesse em: **http://localhost:3000**

> Gera um build de produção otimizado servido pelo nginx. Use para deploy ou para testar a versão final. Cada mudança no código exige rodar `--build` novamente.

---

## Executar localmente (desenvolvimento)

```bash
cd studies/se-vault-docs/se-for-data-non-se/lessons/03-OPP/solid_project/solid-refactory
npm install
npm run dev
```

Acesse em: **http://localhost:3000**

> Hot-reload automático: qualquer mudança no código reflete no browser instantaneamente. Use durante o desenvolvimento.

---

## Estrutura

```
src/
├── components/
│   ├── layout/
│   │   └── Navbar.tsx
│   ├── sections/               # um arquivo por princípio
│   │   ├── HeroSection.tsx
│   │   ├── SRPSection.tsx
│   │   ├── OCPSection.tsx
│   │   ├── LSPSection.tsx
│   │   ├── ISPSection.tsx
│   │   ├── DIPSection.tsx
│   │   ├── YAGNISection.tsx
│   │   └── RecapSection.tsx
│   └── ui/                     # componentes animados
│       ├── waves.tsx           # Perlin noise + spring-physics cursor
│       ├── spotlight-card.tsx
│       └── split-text.tsx
└── context/
    └── CompletionContext.tsx   # rastreamento de progresso por seção
```

---

## Princípios cobertos

| Letra | Princípio             | Interação                                                   |
|-------|-----------------------|-------------------------------------------------------------|
| S     | Single Responsibility | Drag-and-drop: extrair métodos da God Class                 |
| O     | Open/Closed           | Click: extrair branches para Strategy classes               |
| L     | Liskov Substitution   | Quiz: identificar violações de contrato em Sources ETL      |
| I     | Interface Segregation | Slider: morfar interface gorda em Protocols Python          |
| D     | Dependency Inversion  | Toggle: inverter fluxo de dependência do Pipeline           |
| —     | YAGNI                 | Quiz: quando SOLID é overengineering                        |
