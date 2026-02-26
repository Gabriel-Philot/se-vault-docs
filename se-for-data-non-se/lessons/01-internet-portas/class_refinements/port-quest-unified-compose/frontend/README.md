# Port Quest City Frontend

Frontend for the Port Quest interactive network city UI (City Map, Monitor, Security Lab, Challenges).

## Local development

1. Install dependencies:
   `npm install`
2. Start the Vite dev server:
   `npm run dev`

## Docker (production build)

This frontend is built into static assets and served by nginx in the unified compose stack.

- Build output is generated with `npm run build`
- Runtime serves the SPA on port `3000`
- API requests use `VITE_API_URL` (empty in unified compose for same-origin `/api/*`)
