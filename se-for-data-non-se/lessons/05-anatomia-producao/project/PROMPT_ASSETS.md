# Prompt de Assets — Palantír

Prompts prontos para gerar imagens no [Nano Banana](https://nanobanana.com/).
Gerar cada imagem e colocar no caminho correspondente em `frontend/public/images/`.

---

## Estrutura de Pastas

```
frontend/public/images/
├── ui/
│   ├── welcome-bg.png          # Background da landing page
│   ├── palantir-orb.png        # Orbe do Palantír (logo central)
│   ├── header-logo.png         # Logo pequeno para top nav
│   ├── map-bg.png              # Background do mapa da Terra-Média
│   ├── missions-bg.png         # Background da página de missões
│   ├── library-bg.png          # Background da Biblioteca de Rivendell
│   ├── architecture-bg.png     # Background da página de arquitetura
│   └── parchment-texture.png   # Textura de pergaminho para cards
├── locations/
│   ├── minas-tirith.png        # Ícone/ilustração Minas Tirith (Nginx)
│   ├── citadel.png             # Ícone da Cidadela (Gunicorn)
│   ├── rivendell.png           # Ícone Rivendell (Redis)
│   ├── erebor.png              # Ícone Erebor/Forjas (Celery)
│   ├── gondor-beacons.png      # Faróis de Gondor (Redis broker)
│   ├── minas-tirith-db.png     # Ícone Minas Tirith interior (PostgreSQL)
│   └── eagles.png              # Águias (Celery workers)
├── heroes/
│   ├── aragorn.png             # Avatar herói Aragorn
│   ├── legolas.png             # Avatar herói Legolas
│   ├── gimli.png               # Avatar herói Gimli
│   ├── gandalf.png             # Avatar herói Gandalf
│   ├── frodo.png               # Avatar herói Frodo
│   ├── samwise.png             # Avatar herói Samwise
│   ├── boromir.png             # Avatar herói Boromir
│   ├── eowyn.png               # Avatar herói Eowyn
│   ├── faramir.png             # Avatar herói Faramir
│   └── galadriel.png           # Avatar herói Galadriel
└── regions/
    ├── mordor.png              # Região Mordor (cache demo)
    ├── rohan.png               # Região Rohan (cache demo)
    ├── gondor.png              # Região Gondor (cache demo)
    ├── shire.png               # Região Shire (cache demo)
    └── rivendell-region.png    # Região Rivendell (cache demo)
```

---

## UI — Backgrounds e Elementos

### welcome-bg.png
- **Caminho:** `frontend/public/images/ui/welcome-bg.png`
- **Onde usa:** Página Welcome (`/`) — background hero full-screen
- **Descrição:** Paisagem épica da Terra-Média ao entardecer, tons dourados e âmbar, montanhas distantes, céu dramático com nuvens iluminadas, atmosfera cinematográfica
- **Prompt:**
> Epic fantasy landscape at golden hour sunset, vast rolling hills leading to distant snow-capped mountains, dramatic sky with illuminated clouds in amber and gold tones, atmospheric perspective, cinematic wide angle, no text, no characters, Lord of the Rings inspired Middle-earth panorama, matte painting style, warm color palette dominated by gold (#c9a84c) and deep earth tones (#1a1714), 16:9 ratio

### palantir-orb.png
- **Caminho:** `frontend/public/images/ui/palantir-orb.png`
- **Onde usa:** Landing page (centro), header logo, favicon
- **Descrição:** Orbe do Palantír brilhando com luz interior dourada, esfera de cristal escuro com reflexos, fundo transparente
- **Prompt:**
> Dark crystal orb glowing with inner golden light, Palantir seeing stone from Lord of the Rings, mystical sphere with swirling amber and gold energy inside, dark smoky glass exterior, ethereal golden glow emanating outward, isolated on pure black background (for transparency), detailed fantasy artifact, dramatic rim lighting, 1:1 square ratio

### header-logo.png
- **Caminho:** `frontend/public/images/ui/header-logo.png`
- **Onde usa:** Top nav bar à esquerda (MainShell)
- **Descrição:** Versão compacta do orbe, estilo ícone/emblema, fundo transparente
- **Prompt:**
> Minimalist emblem icon of a glowing golden orb, stylized Palantir seeing stone, simple geometric design with subtle inner glow, gold (#c9a84c) on transparent dark background, clean vector-like illustration, suitable as small app icon, 1:1 square ratio

### map-bg.png
- **Caminho:** `frontend/public/images/ui/map-bg.png`
- **Onde usa:** Página Dashboard (`/dashboard`) — background atrás do mapa SVG
- **Descrição:** Textura de mapa antigo da Terra-Média, tom pergaminho escuro, estilo cartográfico medieval desgastado
- **Prompt:**
> Ancient fantasy map texture on dark aged parchment, faded cartographic lines and compass rose, medieval manuscript style, subtle mountain and river illustrations barely visible, dark warm tones (#1a1714 to #2a2520), weathered and aged paper texture, no readable text, no specific location names, atmospheric and mysterious, 16:9 ratio

### missions-bg.png
- **Caminho:** `frontend/public/images/ui/missions-bg.png`
- **Onde usa:** Página Missões (`/missoes`) — background sutil
- **Descrição:** Paisagem tempestuosa com águias voando ao longe, atmosfera épica de missão
- **Prompt:**
> Dramatic stormy fantasy sky over dark mountainous terrain, great eagles silhouetted flying in formation far in the distance, brooding atmosphere with occasional golden light breaking through storm clouds, cinematic depth, dark moody palette with touches of amber gold, no text, Lord of the Rings inspired, matte painting style, 16:9 ratio

### library-bg.png
- **Caminho:** `frontend/public/images/ui/library-bg.png`
- **Onde usa:** Página Biblioteca (`/biblioteca`) — background sutil
- **Descrição:** Interior de biblioteca élfica antiga, estantes infinitas, luz suave dourada, atmosfera de sabedoria
- **Prompt:**
> Interior of ancient elven library, towering bookshelves carved from pale wood reaching upward, warm golden ambient light filtering through arched windows, scrolls and ancient tomes, ethereal and peaceful atmosphere, Rivendell-inspired architecture with organic flowing lines, soft focus depth, no characters, warm parchment and gold tones, fantasy illustration style, 16:9 ratio

### architecture-bg.png
- **Caminho:** `frontend/public/images/ui/architecture-bg.png`
- **Onde usa:** Página Arquitetura (`/arquitetura`) — background sutil
- **Descrição:** Vista aérea/mapa da Terra-Média com os faróis de Gondor acesos, perspectiva de planejamento estratégico
- **Prompt:**
> Aerial view of fantasy kingdom at night, chain of beacon fires lit along mountain ridges stretching into the distance, Gondor beacons inspired, warm golden fire light contrasting with deep blue-black night sky, strategic military command perspective, cinematic wide shot, Lord of the Rings inspired, no text, 16:9 ratio

### parchment-texture.png
- **Caminho:** `frontend/public/images/ui/parchment-texture.png`
- **Onde usa:** Background sutil de cards, tooltips, containers
- **Descrição:** Textura de pergaminho escuro tileable, sutil, baixo contraste
- **Prompt:**
> Seamless tileable dark aged parchment paper texture, subtle fiber and grain details, very low contrast, dark warm brown tones (#2a2520 range), suitable as repeating web background, no writing no marks, uniform and understated, square ratio

---

## Locations — Ícones dos Serviços no Mapa

### minas-tirith.png
- **Caminho:** `frontend/public/images/locations/minas-tirith.png`
- **Onde usa:** Node do Nginx no mapa SVG e diagrama de arquitetura
- **Descrição:** Portão de Minas Tirith estilizado, representando o gateway/reverse proxy
- **Prompt:**
> Stylized illustration of the great gate of Minas Tirith, massive stone fortification gate with metal reinforcements, imposing and monumental, warm golden stone tones, fantasy medieval fortress entrance, clean illustration style suitable for UI icon, dark background for transparency, 1:1 square ratio

### citadel.png
- **Caminho:** `frontend/public/images/locations/citadel.png`
- **Onde usa:** Node do Gunicorn (workers) no mapa e diagrama
- **Descrição:** Torre da Cidadela Branca de Minas Tirith, representando os múltiplos workers
- **Prompt:**
> Stylized illustration of the White Citadel tower of Minas Tirith, tall elegant white stone tower with golden light from windows, multiple guard figures visible at different levels representing workers, fantasy medieval architecture, clean illustration style for UI icon, dark background for transparency, 1:1 square ratio

### rivendell.png
- **Caminho:** `frontend/public/images/locations/rivendell.png`
- **Onde usa:** Node do Redis no mapa e diagrama
- **Descrição:** Pavilhão élfico de Rivendell, representando a biblioteca/cache em memória
- **Prompt:**
> Stylized illustration of an elven pavilion in Rivendell, elegant organic architecture with flowing arches, surrounded by waterfalls, warm amber light, books and scrolls visible within, ethereal and wise atmosphere, clean illustration style for UI icon, dark background for transparency, 1:1 square ratio

### erebor.png
- **Caminho:** `frontend/public/images/locations/erebor.png`
- **Onde usa:** Node do Celery (task processing) no mapa e diagrama
- **Descrição:** Forjas de Erebor/montanha solitária, representando processamento de tasks
- **Prompt:**
> Stylized illustration of dwarf mountain forge interior, glowing furnaces and anvils, molten metal and sparks, industrial fantasy workshop atmosphere, warm orange and amber tones, Erebor Lonely Mountain inspired, clean illustration style for UI icon, dark background for transparency, 1:1 square ratio

### gondor-beacons.png
- **Caminho:** `frontend/public/images/locations/gondor-beacons.png`
- **Onde usa:** Node do Redis broker no diagrama de arquitetura
- **Descrição:** Faróis de Gondor acesos em cadeia, representando o message broker
- **Prompt:**
> Stylized illustration of beacon fires on mountain peaks in chain formation, Gondor beacons from Lord of the Rings, golden-orange flames passing signal from peak to peak, dramatic dark mountain silhouettes, night sky, message relay concept, clean illustration style for UI icon, dark background for transparency, 1:1 square ratio

### minas-tirith-db.png
- **Caminho:** `frontend/public/images/locations/minas-tirith-db.png`
- **Onde usa:** Node do PostgreSQL no diagrama de arquitetura
- **Descrição:** Salão do trono/cofre de Minas Tirith, representando armazenamento persistente
- **Prompt:**
> Stylized illustration of a grand stone vault or throne hall interior, massive stone pillars and arched ceiling, rows of glowing record tablets or stone archives along walls, secure and permanent atmosphere, Minas Tirith inspired architecture, warm amber torch light, clean illustration style for UI icon, dark background for transparency, 1:1 square ratio

### eagles.png
- **Caminho:** `frontend/public/images/locations/eagles.png`
- **Onde usa:** Ícone dos Celery workers, cards de missão ativa
- **Descrição:** Grandes águias em voo, representando os workers assíncronos
- **Prompt:**
> Stylized illustration of two great eagles in majestic flight, powerful wingspan, golden-brown feathers catching warm light, Lord of the Rings great eagles inspired, dynamic soaring pose, clean illustration style for UI icon, dark background for transparency, 1:1 square ratio

---

## Heroes — Avatares para o Leaderboard

Todos seguem o mesmo padrão visual: retrato estilizado, iluminação dramática, fundo escuro.

### aragorn.png
- **Caminho:** `frontend/public/images/heroes/aragorn.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a rugged noble ranger king, dark hair, stubble beard, steel-grey determined eyes, wearing weathered leather and dark cloak with silver brooch, dramatic warm side lighting, dark moody background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### legolas.png
- **Caminho:** `frontend/public/images/heroes/legolas.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a graceful male elf archer, long platinum blonde hair, sharp elegant features, bright blue eyes, wearing forest green and brown leather armor, pointed ears visible, soft ethereal lighting, dark forest background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### gimli.png
- **Caminho:** `frontend/public/images/heroes/gimli.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a stout fierce dwarf warrior, thick red-brown braided beard with metal clasps, intense brown eyes, wearing heavy chain mail and iron helmet, battle-ready expression, warm forge-light glow, dark stone background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### gandalf.png
- **Caminho:** `frontend/public/images/heroes/gandalf.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a wise elderly wizard, long flowing white beard and hair, deep knowing blue eyes beneath bushy eyebrows, wearing pointed grey hat and grey robes, holding a wooden staff, mystical soft white glow, dark atmospheric background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### frodo.png
- **Caminho:** `frontend/public/images/heroes/frodo.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a young brave hobbit, curly dark brown hair, large expressive blue eyes, round youthful face with determined expression, wearing a mithril chain mail glimpsed under travel-worn cloak, soft golden light, dark background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### samwise.png
- **Caminho:** `frontend/public/images/heroes/samwise.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a loyal stout hobbit gardener, sandy brown curly hair, warm brown eyes, round honest face with gentle loyal expression, wearing simple earth-toned clothes and a travel pack, warm hearth-like lighting, dark background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### boromir.png
- **Caminho:** `frontend/public/images/heroes/boromir.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a proud noble warrior of Gondor, wavy brown hair, strong jaw, hazel eyes with conflicted noble expression, wearing polished plate armor with white tree emblem, fur-lined cloak, dramatic torchlight, dark background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### eowyn.png
- **Caminho:** `frontend/public/images/heroes/eowyn.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a fierce noble shieldmaiden, long golden blonde hair, piercing blue eyes, beautiful but strong determined face, wearing Rohirric armor with horse motif, sword at her side, cold steel-blue lighting with warm undertones, dark background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### faramir.png
- **Caminho:** `frontend/public/images/heroes/faramir.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of a thoughtful noble captain, wavy brown hair, gentle intelligent grey-green eyes, refined handsome face with contemplative expression, wearing Gondorian ranger leather armor, forest-green cloak, soft dappled forest light, dark background, fantasy character portrait, painterly illustration style, 1:1 square ratio

### galadriel.png
- **Caminho:** `frontend/public/images/heroes/galadriel.png`
- **Onde usa:** Leaderboard, seed data
- **Prompt:**
> Portrait of an ancient powerful elf queen, long flowing silver-gold hair, luminous blue eyes radiating ancient wisdom, ethereally beautiful ageless features, wearing white flowing gown with silver circlet crown, soft ethereal white-gold glow emanating from her, dark starlit background, fantasy character portrait, painterly illustration style, 1:1 square ratio

---

## Regions — Cards de Regiões para Cache Demo

### mordor.png
- **Caminho:** `frontend/public/images/regions/mordor.png`
- **Onde usa:** Cache demo — card da região Mordor
- **Prompt:**
> Dark volcanic fantasy landscape, jagged black mountains surrounding a fiery wasteland, rivers of lava, ominous red-orange sky choked with ash clouds, Mordor Lord of the Rings inspired, desolate and threatening atmosphere, no text, cinematic wide shot, 16:9 ratio

### rohan.png
- **Caminho:** `frontend/public/images/regions/rohan.png`
- **Onde usa:** Cache demo — card da região Rohan
- **Prompt:**
> Vast golden grassland plains stretching to green rolling hills, a distant wooden fortress perched on a hill, wild horses running free, clear blue sky with sweeping clouds, Rohan Lord of the Rings inspired, sense of freedom and open space, warm golden hour light, no text, cinematic wide shot, 16:9 ratio

### gondor.png
- **Caminho:** `frontend/public/images/regions/gondor.png`
- **Onde usa:** Cache demo — card da região Gondor
- **Prompt:**
> Majestic white stone tiered city built into a mountain face, gleaming in warm sunlight, seven levels ascending to a white tower at the peak, vast green Pelennor fields below, Gondor Minas Tirith Lord of the Rings inspired, monumental and regal atmosphere, no text, cinematic wide shot, 16:9 ratio

### shire.png
- **Caminho:** `frontend/public/images/regions/shire.png`
- **Onde usa:** Cache demo — card da região Shire
- **Prompt:**
> Idyllic pastoral fantasy countryside, round hobbit doors built into green hillsides, colorful flower gardens, a winding path through lush meadows, warm afternoon golden sunlight, The Shire Lord of the Rings inspired, peaceful and cozy atmosphere, no text, cinematic wide shot, 16:9 ratio

### rivendell-region.png
- **Caminho:** `frontend/public/images/regions/rivendell-region.png`
- **Onde usa:** Cache demo — card da região Rivendell
- **Prompt:**
> Hidden elven valley with elegant architecture among waterfalls and ancient trees, buildings with flowing organic arches spanning across gorges, autumn-colored foliage, crystal clear rivers, warm golden light filtering through canopy, Rivendell Lord of the Rings inspired, ethereal and serene, no text, cinematic wide shot, 16:9 ratio

---

## Resumo — Nomes e Locais

| Arquivo | Caminho | Onde Usa |
|---|---|---|
| **welcome-bg.png** | `images/ui/` | Welcome `/` — hero background |
| **palantir-orb.png** | `images/ui/` | Welcome `/` — orbe central, favicon |
| **header-logo.png** | `images/ui/` | MainShell — top nav logo |
| **map-bg.png** | `images/ui/` | Dashboard `/dashboard` — background do mapa |
| **missions-bg.png** | `images/ui/` | Missões `/missoes` — background sutil |
| **library-bg.png** | `images/ui/` | Biblioteca `/biblioteca` — background sutil |
| **architecture-bg.png** | `images/ui/` | Arquitetura `/arquitetura` — background sutil |
| **parchment-texture.png** | `images/ui/` | Cards e containers (textura tileable) |
| **minas-tirith.png** | `images/locations/` | Mapa SVG node Nginx + diagrama |
| **citadel.png** | `images/locations/` | Mapa SVG node Gunicorn + diagrama |
| **rivendell.png** | `images/locations/` | Mapa SVG node Redis + diagrama |
| **erebor.png** | `images/locations/` | Mapa SVG node Celery + diagrama |
| **gondor-beacons.png** | `images/locations/` | Diagrama node Redis broker |
| **minas-tirith-db.png** | `images/locations/` | Diagrama node PostgreSQL |
| **eagles.png** | `images/locations/` | Ícone workers + missão ativa |
| **aragorn.png** | `images/heroes/` | Leaderboard avatar |
| **legolas.png** | `images/heroes/` | Leaderboard avatar |
| **gimli.png** | `images/heroes/` | Leaderboard avatar |
| **gandalf.png** | `images/heroes/` | Leaderboard avatar |
| **frodo.png** | `images/heroes/` | Leaderboard avatar |
| **samwise.png** | `images/heroes/` | Leaderboard avatar |
| **boromir.png** | `images/heroes/` | Leaderboard avatar |
| **eowyn.png** | `images/heroes/` | Leaderboard avatar |
| **faramir.png** | `images/heroes/` | Leaderboard avatar |
| **galadriel.png** | `images/heroes/` | Leaderboard avatar |
| **mordor.png** | `images/regions/` | Cache demo — card região |
| **rohan.png** | `images/regions/` | Cache demo — card região |
| **gondor.png** | `images/regions/` | Cache demo — card região |
| **shire.png** | `images/regions/` | Cache demo — card região |
| **rivendell-region.png** | `images/regions/` | Cache demo — card região |

**Total: 30 assets** (8 UI + 7 locations + 10 heroes + 5 regions)
