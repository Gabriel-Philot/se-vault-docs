# Port Quest - Desktop E2E Round 2 (UI Click Validation)

Date: 2026-02-25
Scope: Desktop-only, full UI clicking flow (City Map, Monitor, Security)

## What happens when clicking SEND on City Map

- UI click on `SEND` triggers a real backend request: `POST /api/packets/send` with `200 OK`.
- The packet/orb visuals are present, but they are subtle and easy to miss.
- The front-of-gate effect reads as weak (small glow, low contrast on dark background, short-lived perception).
- The line/path animation does not strongly communicate a new "send" event versus ambient motion.

## UI click validations executed

1. Open `City Map` via top nav.
2. Click `SEND` in the top bar.
3. Observe map motion and packet orbs at multiple times.
4. Navigate to `Network Monitor` and verify feed activity.
5. Validate `Security Lab` controls by click: firewall toggle, TLS simulate, DNS resolve.
6. Return to `City Map` and validate building selection clicks.

## Findings

- **City Map SEND action**
  - Functional request occurs (`POST /api/packets/send` returns success).
  - Visual feedback is underpowered for clarity.
  - Orbs are hard to perceive after click; user feedback is weaker than expected for an explicit `SEND` action.
  - Front-of-gate effect is visually poor/weak (small, low contrast, short-lived impact).
  - After rebuild + replay, ambient packet stream can visually dominate and look like traffic is leaving City Hall toward Gate, which conflicts with expected user-triggered direction perception.

- **Map object interaction**
  - Building click selection works by clicked position (Command Center, Municipal Archive, City Hall, City Gate).
  - Building visuals can be scaled up for better readability and stronger scene presence.

- **City Map composition and layout (desktop)**
  - Central cluster (City Hall, City Gate, Municipal Archive) is too tight.
  - Cluster should be shifted further left relative to Command Center context.
  - Drawer + cluster composition becomes right-heavy when detail panel is open.

- **Network Monitor**
  - Feed remains active and receives traffic.
  - Immediate correlation to a `SEND` click is not visually obvious in the map itself.
  - `Latency Trend` card behavior is inconsistent on desktop: in some layouts it appears collapsed/weak, and when visible it looks deformed due to unstable random bar rendering.
  - In rebuilt run, `Latency Trend` rendered correctly at 1536x864, but instability risk remains because chart bars are generated with per-render randomness.

- **Security Lab**
  - Firewall can be toggled.
  - TLS and DNS simulation buttons respond by UI click.

- **Additional product inconsistency references from desktop critique**
  - URL bar input does not currently drive packet destination dynamically.
  - Frontend README content is outdated/misaligned with Port Quest runtime.

- **Readability issue from provided screenshot**
  - In `/mnt/c/Users/philo/AppData/Local/Temp/wezterm_clipboard.png`, only the main title is impossible to read in practice (critical readability failure).

## Screenshot artifacts

- `discoverys/port-quest-e2e-2026-02-25/round2-01-map-before-send.png`
- `discoverys/port-quest-e2e-2026-02-25/round2-02-map-after-send-300ms.png`
- `discoverys/port-quest-e2e-2026-02-25/round2-03-map-after-send-1300ms.png`
- `discoverys/port-quest-e2e-2026-02-25/round2-04-map-idle-4300ms.png`
- `discoverys/port-quest-e2e-2026-02-25/round2-05-monitor-after-send.png`
- `discoverys/port-quest-e2e-2026-02-25/round2-06-map-flow-before-send-rebuild.png`
- `discoverys/port-quest-e2e-2026-02-25/round2-07-map-flow-after-send-rebuild.png`
- `discoverys/port-quest-e2e-2026-02-25/round2-08-monitor-latency-rebuild.png`

## Visual improvement recommendations (front-of-gate and packet readability)

1. Increase orb diameter by ~40-70% and add additive bloom.
2. Increase glow contrast against background (higher value and slightly warmer edge highlight).
3. Raise z-index/layer priority so packet effects never blend behind building shadows.
4. Add a short impact burst/ripple at destination when `SEND` is clicked.
5. Add a clear "event pulse" from Browser -> Gateway path at click time to distinguish user action from ambient animation.
6. Increase building image scale moderately to improve readability without reintroducing overlap.
7. Reposition central buildings with more spacing and left-shift the cluster to reduce right-heavy composition.
8. Stabilize `Latency Trend` visual behavior (avoid collapsing/deforming card states on desktop).

## Consolidated critique checklist (all critiques raised so far)

1. `SEND` works functionally but visual feedback is weak.
2. Packet/orb readability is too low in the current dark scene.
3. Front-of-gate effect quality is poor and should be redesigned.
4. Confirm mandatory use of the official project orb asset in runtime.
5. Increase building image size to improve map legibility.
6. Central cluster spacing is too tight and should be expanded.
7. Central cluster should shift left to better balance composition with drawer behavior.
8. Network Monitor `Latency Trend` panel can collapse/deform visually.
9. URL bar should influence destination routing behavior (not only static gateway route).

## Mandatory validation for orb asset usage

1. Confirm City Map packet effect uses the official project orb asset (our orb), not a generic CSS-only glow.
2. Report the exact asset path used in runtime.
3. Attach two screenshots: one immediately after `SEND` and one with orb in transit.
4. Validate via UI/DevTools that rendered texture/source points to the official orb asset.
5. If official orb is not being used, mark as P1 visual regression in the report.
