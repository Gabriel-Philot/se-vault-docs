# Install Findings — Port Quest City Frontend

## npm install

**Result: SUCCESS** (0 vulnerabilities, 304 packages)

### Warnings (non-blocking)
- `prebuild-install@7.1.3` — deprecated, no longer maintained (transitive dep of `better-sqlite3`)
- `node-domexception@1.0.0` — deprecated, use native DOMException
- `glob@10.5.0` — old version with known security issues

### Junk Dependencies (not used by frontend code)
These were injected by Google AI Studio's scaffolding and are **not imported anywhere** in the frontend:

| Package | Why it's junk |
|---------|--------------|
| `@google/genai` | Gemini SDK — not used |
| `express` | Server framework — frontend only |
| `better-sqlite3` | SQLite binding — frontend only |
| `dotenv` | Node env loader — Vite handles this |
| `@types/express` | Types for unused express |

### Tailwind 4 Setup
- Uses `@tailwindcss/vite` plugin (v4 approach) instead of Tailwind 3.x PostCSS plugin
- `tailwindcss` v4.1.14 in devDependencies
- `autoprefixer` in devDependencies but likely unused with Tailwind 4 (integrated)
- CSS uses `@import "tailwindcss"` and `@theme {}` blocks (Tailwind 4 syntax)

### Duplicate Packages
- `vite` appears in both `dependencies` AND `devDependencies` (should only be in devDependencies)
- `framer-motion` AND `motion` both listed — `motion` is the new name for `framer-motion`

### Recommendation for Cleanup (backend adaptation phase)
Remove junk deps to reduce install size and avoid confusion:
```bash
npm uninstall @google/genai express better-sqlite3 dotenv @types/express
```
Move `vite` from dependencies to devDependencies only.
