# Port Quest - Desktop Image Integration Spec

This document gives practical, desktop-only guidance for image dimensions and City Map layout adjustments based on E2E observations and code review.

## Scope

- Platform: desktop only.
- Target screen: 1366x768 up to 1920x1080.
- Current renderer context: `canvas` at `800x600` in `frontend/src/components/city/CityMap.tsx`.

## 1) Required image dimensions and export rules

Use these settings for every main building image:

- File format: PNG (transparent background).
- Master size: `2048x2048`.
- Working center: object centered in frame.
- Safe margin: keep at least `12%` empty border on all sides.
- Object occupancy: around `70%` to `78%` of the canvas area.
- Color profile: sRGB.
- No text, no watermark, no logos.

If the generator supports upscale/downscale variants, keep these optional derivatives:

- `1024x1024` for quick iteration.
- `512x512` for preview checks.

## 2) In-app display sizes (desktop)

When drawing sprites on the 800x600 map:

- Command Center: `150x170` px
- City Gate: `145x165` px
- City Hall: `150x170` px
- Municipal Archive: `145x165` px

Label spacing:

- Building name baseline: `+22` px below sprite bottom.
- Port label: `-20` px above sprite top.

Glow budget (to prevent overlap bloom):

- Outer glow blur radius: `8` to `12` px.
- Keep per-building glow alpha <= `0.45`.

## 3) City Map spacing adjustments (desktop)

Observed issue: central objects are too close, and the composition becomes right-heavy when the drawer opens.

Recommended fix in `CityMap.tsx`:

- Shift map centroid left on desktop.
- Increase spacing between center cluster nodes.

Suggested values for the current 800x600 canvas:

```ts
const cx = canvas.width / 2 - 110; // shift map left
const cy = canvas.height / 2 - 45;

const positions = {
  frontend: { x: cx - 185, y: cy + 92 },
  gateway:  { x: cx - 20,  y: cy + 175 },
  api:      { x: cx + 165, y: cy + 92 },
  database: { x: cx - 5,   y: cy - 8 },
};
```

Why this helps:

- Adds horizontal breathing room between City Hall and Municipal Archive.
- Moves the central cluster away from the right drawer zone.
- Keeps Command Center readable with less visual collision.

## 4) Click accuracy adjustment (functional)

Current behavior opens the same building for every click.

Recommended approach:

- Add per-building hitboxes based on sprite bounds.
- Resolve clicked building by checking pointer coordinates against those hitboxes.
- Fallback to nearest building center only if no hitbox match exists.

This should replace the current hardcoded selection in `frontend/src/components/city/CityMap.tsx`.

## 5) File naming contract (desktop assets)

Place generated images in:

- `new-images-for-city/`

Required files:

- `building-command-center-v1.png`
- `building-city-gate-v1.png`
- `building-city-hall-v1.png`
- `building-municipal-archive-v1.png`

Optional second-pass variants:

- `building-command-center-v2.png`
- `building-city-gate-v2.png`
- `building-city-hall-v2.png`
- `building-municipal-archive-v2.png`

## 6) Desktop validation checklist after integration

After replacing assets, validate on desktop only:

1. No label overlaps during active packet traffic.
2. No glow clipping near right drawer edge.
3. Building click opens correct drawer item for all four buildings.
4. City Hall cluster has clear spacing and visual hierarchy.
5. Command Center remains readable when drawer is open.
