# Asset Coverage Matrix (Mandatory 30/30)

## Purpose

This matrix enforces the requirement that every image asset listed in `../PROMPT_ASSETS.md` is assigned at least one required usage in the Palantir frontend plan.

Rules:

- No orphan assets
- Reuse is allowed
- Fallback behavior must be defined
- "Where used" is a requirement, not a suggestion

## Rendering Conventions (Apply Unless Overridden)

- Background images use dark overlay for legibility (`40-80%` depending on page)
- Decorative images may use `aria-hidden="true"` if non-informative
- Functional/semantic images require alt text
- UI icons/logos should have fixed aspect fit and non-distorting object sizing
- Large below-the-fold imagery should be lazy loaded

## UI Assets (8)

| Asset | Category | Required Page/Component | Usage Mode | Reuse | Fallback |
|---|---|---|---|---|---|
| `ui/welcome-bg.png` | UI | `pages/Welcome.tsx` hero container | full-screen hero background with gradient overlay | none | dark gradient + subtle particles background |
| `ui/palantir-orb.png` | UI | `pages/Welcome.tsx` center hero visual | primary hero image, animated glow pulse | `Header`, favicon | styled circular gradient orb placeholder |
| `ui/header-logo.png` | UI | `components/layout/MainShell.tsx` top nav brand | compact brand icon beside "Palantir" | mobile nav header | use `palantir-orb.png` reduced size |
| `ui/map-bg.png` | UI | `pages/Dashboard.tsx` map panel backdrop | low-opacity background behind map SVG | `Architecture` optional texture layer | flat dark parchment texture fill |
| `ui/missions-bg.png` | UI | `pages/Missions.tsx` page backdrop | low-contrast thematic background + overlay | none | dark storm gradient with subtle noise |
| `ui/library-bg.png` | UI | `pages/Library.tsx` page backdrop | low-contrast thematic background + overlay | none | dark warm library-toned gradient |
| `ui/architecture-bg.png` | UI | `pages/Architecture.tsx` page backdrop | low-contrast background + overlay | none | dark blue-black command-map gradient |
| `ui/parchment-texture.png` | UI | `components/shared/TexturePanel.tsx` and `GlowCard` | tiled subtle texture layer (`opacity 0.05-0.1`) | tooltips, panels, cards | plain tinted background color |

## Location/Service Assets (7)

| Asset | Service Metaphor | Required Page/Component | Usage Mode | Reuse | Fallback |
|---|---|---|---|---|---|
| `locations/minas-tirith.png` | Nginx gateway | `dashboard/ServiceNode` for Nginx; `architecture/FlowDiagram` | node icon image in map/diagram | tooltip art thumbnail | Lucide gate/shield icon with label |
| `locations/citadel.png` | Gunicorn workers | `dashboard/ServiceNode` Gunicorn; `FlowDiagram` | node icon + worker status badge anchor | workers section icon | Lucide tower icon |
| `locations/rivendell.png` | Redis cache/library | `dashboard/ServiceNode` Redis; `FlowDiagram` | node icon + cache hit tooltip | library section header accent | Lucide book icon |
| `locations/erebor.png` | Celery processing/forge | `dashboard/ServiceNode` Celery; `FlowDiagram` | node icon + queue badge | missions page accent thumbnail | Lucide anvil/flame icon |
| `locations/gondor-beacons.png` | Redis broker/message relay | `architecture/FlowDiagram` broker node | diagram node icon only | trace step visual for broker hop | badge with beacon glyph text |
| `locations/minas-tirith-db.png` | PostgreSQL persistence | `architecture/FlowDiagram` DB node | diagram node icon only | data persistence callout card | Lucide database icon |
| `locations/eagles.png` | Celery workers | `missions/MissionLauncher` header or active mission card; `FlowDiagram` worker node | icon/illustration for async workers | mission success/retry card decoration | Lucide bird/send icon |

## Hero Assets (10)

All hero avatars are mandatory in leaderboard seed and UI display. Each must appear in leaderboard states and support fallback initials.

| Asset | Required Usage | Component | Usage Mode | Fallback |
|---|---|---|---|---|
| `heroes/aragorn.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `AR` on themed badge |
| `heroes/legolas.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `LE` |
| `heroes/gimli.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `GI` |
| `heroes/gandalf.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `GA` |
| `heroes/frodo.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `FR` |
| `heroes/samwise.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `SA` |
| `heroes/boromir.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `BO` |
| `heroes/eowyn.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `EO` |
| `heroes/faramir.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `FA` |
| `heroes/galadriel.png` | leaderboard seed + row/avatar | `library/LeaderboardDemo.tsx` / `HeroCard.tsx` | avatar image | initials `GL` |

## Region Assets (5)

All region images are mandatory in cache demo cards and region knowledge lookup flows.

| Asset | Required Usage | Component | Usage Mode | Reuse | Fallback |
|---|---|---|---|---|---|
| `regions/mordor.png` | cache demo region card and lookup result | `library/CacheDemo.tsx` / `RegionCard.tsx` | cover image for region card | cache hit/miss comparison state | tinted region placeholder card |
| `regions/rohan.png` | cache demo region card and lookup result | `library/CacheDemo.tsx` / `RegionCard.tsx` | cover image for region card | cache hit/miss comparison state | tinted region placeholder card |
| `regions/gondor.png` | cache demo region card and lookup result | `library/CacheDemo.tsx` / `RegionCard.tsx` | cover image for region card | cache hit/miss comparison state | tinted region placeholder card |
| `regions/shire.png` | cache demo region card and lookup result | `library/CacheDemo.tsx` / `RegionCard.tsx` | cover image for region card | cache hit/miss comparison state | tinted region placeholder card |
| `regions/rivendell-region.png` | cache demo region card and lookup result | `library/CacheDemo.tsx` / `RegionCard.tsx` | cover image for region card | cache hit/miss comparison state | tinted region placeholder card |

## Asset Registry Requirements (Implementation)

The frontend implementation should maintain a central asset registry (`src/lib/assets.ts`) with at least:

- `key`
- `path`
- `alt`
- `priority` (`hero | high | default | lazy`)
- `decorative` (boolean)
- `usage` (array of component/page names)

## Coverage Checklist

- UI assets mapped: `8/8`
- Location assets mapped: `7/7`
- Hero assets mapped: `10/10`
- Region assets mapped: `5/5`
- Total mapped: `30/30`

If implementation changes component names, update the mapping here while preserving required usage coverage.
