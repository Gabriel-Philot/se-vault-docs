#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Fetching OpenAPI spec from backend..."
curl -s http://localhost:8000/openapi.json -o "$PROJECT_DIR/openapi.json"

echo "Generating TypeScript client..."
cd "$PROJECT_DIR/frontend"
npx @hey-api/openapi-ts -i ../openapi.json -o src/client

echo "Done! Types generated in frontend/src/client/"
