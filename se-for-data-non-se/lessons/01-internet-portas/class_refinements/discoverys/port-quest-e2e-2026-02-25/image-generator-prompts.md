# Port Quest - Image Prompts (Desktop Assets)

Goal: generate better-looking assets to replace the current City Map objects while keeping the isometric sci-fi network city theme.

Note: new generated images will be stored in `new-images-for-city/` (folder currently being created).

## Global prompt guidelines

- Style: isometric cyber city, clean shapes, high readability, educational UI asset.
- Background: transparent.
- Delivery: PNG 2048x2048 (or larger), centered object crop.
- Lighting: controlled neon glow (avoid blown highlights).
- Avoid: text in image, watermark, random logos, excessive particles.

## Consistency base prompt (use together)

"Isometric sci-fi network city asset, polished game UI illustration, sharp silhouette, high contrast, transparent background, cinematic neon rim light, dark navy + cyan + emerald palette, subtle volumetric glow, no text, no watermark, no characters"

## Main assets

### 1) Command Center (frontend)

Prompt:
"Isometric command center building, futuristic operations hub, cyan neon glass panels, modular antenna array, clean geometric architecture, friendly educational style, medium detail, transparent background, no text, no watermark"

### 2) City Gate (gateway/nginx)

Prompt:
"Isometric gateway fortress building, network ingress checkpoint, emerald neon shields, secure gate motif, balanced proportions, sharp readable silhouette, transparent background, no text, no watermark"

### 3) City Hall (API/FastAPI)

Prompt:
"Isometric civic data hall building, API service node, violet neon accents, modern institutional architecture fused with high-tech server core, clear top/left/right faces, transparent background, no text, no watermark"

### 4) Municipal Archive (database/Postgres)

Prompt:
"Isometric digital archive vault building, protected database repository, amber neon lines, reinforced layered structure, subtle lock motifs, premium clean render, transparent background, no text, no watermark"

## Required output filenames

Place these files in `new-images-for-city/`:

- `building-command-center-v1.png`
- `building-city-gate-v1.png`
- `building-city-hall-v1.png`
- `building-municipal-archive-v1.png`

Optional alternates (if you generate extra candidates):

- `building-command-center-v2.png`
- `building-city-gate-v2.png`
- `building-city-hall-v2.png`
- `building-municipal-archive-v2.png`

## Supporting assets (optional)

### 5) Packet orb - HTTP

Prompt:
"Tiny glowing network packet orb, HTTP theme, cyan core with soft trail, isometric UI VFX asset, transparent background, no text, no watermark"

### 6) Packet orb - SQL

Prompt:
"Tiny glowing network packet orb, SQL theme, amber core with subtle ring pulse, isometric UI VFX asset, transparent background, no text, no watermark"

### 7) Packet orb - DNS

Prompt:
"Tiny glowing network packet orb, DNS theme, magenta core with dotted signal halo, isometric UI VFX asset, transparent background, no text, no watermark"

Optional supporting output filenames:

- `packet-http-v1.png`
- `packet-sql-v1.png`
- `packet-dns-v1.png`

## Fast iteration variants

- Variant A (cleaner): "minimal details, strong silhouette, fewer micro-elements".
- Variant B (more premium): "higher material detail, brushed metal + glass reflections, but still readable at small scale".
- Variant C (more didactic): "educational infographic style, very clear shape language, reduced visual noise".

## Recommended negative prompt

"blurry, low resolution, overexposed glow, unreadable silhouette, busy background, text overlay, logo, watermark, characters, photoreal city skyline"

## How to use in the project

1. Generate 3-5 variations per main asset.
2. Select based on small-size readability.
3. Integrate into the map canvas and adjust building spacing (especially City Hall/City Gate/Municipal Archive) to reduce visual proximity.
4. Validate on desktop with active packet traffic to confirm labels/effects do not collide.
