#!/usr/bin/env bash
# One-shot project setup: database container, dependencies, and database schema.
# Safe to run repeatedly.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || cp .env.example .env

docker compose up -d --wait db

pnpm install --frozen-lockfile
pnpm db:deploy
