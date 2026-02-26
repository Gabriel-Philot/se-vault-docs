# Port Quest - Desktop E2E Critique

Date: 2026-02-25  
Scope: desktop only (mobile intentionally ignored).

Do not worry about mobile: all analysis and recommendations below are desktop-only.

New generated images will be placed in the `new-images-for-city/` folder (currently being created).

## Executed coverage

- Home: top navigation, entry cards, status chips, and `/api/city/status` integration.
- City Map: packet send from URL bar (`SEND`), packet animation, and drawer opening from canvas click.
- Network Monitor: active SSE stream, protocol/status filters, and real `BLOCKED` validation with a SQL packet.
- Security Lab: firewall toggle, full TLS simulation, and DNS resolution for multiple domains.
- Challenges: wrong + correct answer flow across all 4 challenges; final score reached (80).

## Inconsistencies and opportunities (desktop)

1. **City Map - canvas click always opens the same building (Command Center)**
   - Severity: high (functional behavior does not match visual expectation).
   - Evidence: any canvas click always opens `Command Center`.
   - Technical reference: `frontend/src/components/city/CityMap.tsx:155` (`status.buildings[0]` is hardcoded in click handler).

2. **City Map - central objects are too close (City Hall, City Gate, Municipal Archive)**
   - Severity: medium (visual readability is reduced).
   - Evidence: labels and building volumes visually collide during traffic scenes.
   - Recommended adjustment: increase horizontal distance between API/DB and shift the central cluster slightly left to create more readable space near Command Center.
   - Technical reference: `frontend/src/components/city/CityMap.tsx:109` (`positions` map).

3. **City Map - composition is right-heavy due to drawer + central cluster**
   - Severity: medium.
   - Evidence: when drawer opens, the map feels compressed on the right and primary objects get too close to the panel.
   - Recommended adjustment: move map centroid left when drawer is open (or globally) and increase spacing between central nodes.

4. **URL bar input is not used to route packet destination**
   - Severity: medium.
   - Evidence: input accepts text, but `sendPacket` always posts with `destination: 'gateway'`.
   - Technical reference: `frontend/src/components/city/URLBar.tsx:13`.

5. **Frontend README does not represent the current project**
   - Severity: low (documentation quality).
   - Evidence: it references AI Studio/Gemini while this app is Port Quest with a different stack/runtime.
   - Technical reference: `frontend/README.md:1`.

## Requested visual improvements (tracked)

You explicitly requested:
- more spacing between City Hall cluster objects (central buildings);
- moving those objects further left relative to Command Center;
- prompts to generate more polished, thematic visual assets.

These requests were incorporated in the findings and in the prompt file below.

## Next image integration steps

When image generation is ready:
1. Export each asset with transparent background (PNG/WebP).
2. Replace procedural canvas buildings with isometric sprites.
3. Recalibrate City Map `positions` and per-building scale to reduce visual overlap.
