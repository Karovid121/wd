# Nexora

A Discord-style chat application, built in phases. **Phase 1 is complete**: accounts, sessions, profiles, presence, and the application shell.

## What works today

- **Accounts** — sign up and log in with a unique username, a display name and a password.
- **Sessions** — stay signed in for 30 days (renewed while you use the app); log out; changing your password signs out your other devices.
- **Profiles** — display name, username, "about me", and an uploaded avatar (PNG, JPEG, GIF or WebP, up to 2 MB).
- **Status** — Online, Idle, Do Not Disturb or Invisible. Others see you as offline about 90 seconds after you close the app.
- **Interface** — dark, responsive layout with a server rail, sidebar, main view and member list; profile popups; people search; settings screen.

Not built yet: servers and channels, messaging, friends, voice and video. See [Roadmap](#roadmap).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL 16 · Prisma 7

## Getting started

You need **Node.js 20.19 or newer**, **pnpm**, and **PostgreSQL** (Docker is the easiest way to get it).

```bash
# 1. Configuration
cp .env.example .env

# 2. Database — starts PostgreSQL in Docker with the credentials .env.example expects
docker compose up -d

# 3. Dependencies (also generates the Prisma client)
pnpm install

# 4. Create the tables
pnpm db:deploy

# 5. Run
pnpm dev
```

Open http://localhost:3000 and create an account.

On macOS or Linux, `bash scripts/setup.sh` runs steps 1–4 for you.

Already have PostgreSQL? Skip step 2 and point `DATABASE_URL` in `.env` at an empty database.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. |
| `UPLOAD_DIR` | no | Where uploaded avatars are stored. Defaults to `./uploads`. |
| `APP_ORIGIN` | no | Public URL of the app. Set it when a reverse proxy changes the `Host` header. |
| `SESSION_COOKIE_SAMESITE` | no | `lax` (default), `strict` or `none`. Use `none` only when the app is embedded inside another site, such as a preview panel; it requires HTTPS. |
| `SESSION_COOKIE_SECURE` | no | `true` or `false`. Defaults to `true` in production. |
| `DEV_ALLOWED_ORIGINS` | no | Development only. Extra hostnames allowed to load the dev server, comma-separated. |

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server. |
| `pnpm build` then `pnpm start` | Build and run for production. |
| `pnpm test` | Run the unit tests. |
| `pnpm lint` / `pnpm typecheck` | Static checks. |
| `pnpm db:migrate` | Create and apply a migration after editing `prisma/schema.prisma`. |
| `pnpm db:deploy` | Apply existing migrations. |

## Project layout

```
prisma/                 Database schema and migrations
src/app/(auth)/         Log in and sign up pages
src/app/page.tsx        The signed-in application
src/app/api/            HTTP API (auth, profile, avatar, presence, files)
src/components/         Interface components
src/lib/                Sessions, password hashing, validation, rate limiting, storage
tests/                  Unit tests
```

## Security notes

- Passwords are hashed with scrypt and a per-user salt; they are never stored or returned.
- The session cookie is `HttpOnly`; only a hash of the session token is stored in the database.
- Every request that changes data must come from the app's own origin and is rate limited. Log in and sign up have stricter limits.
- All input is validated on the server with the same rules the forms use.
- Uploads are identified by their content rather than their file name, stored under random names, and only served to signed-in users.
- Rate limits are kept in memory, which suits a single server process. Running several instances needs a shared store.

## Roadmap

1. ~~Project setup, database, authentication, interface~~
2. Servers, channels and real-time messaging
3. Friends, direct messages and notifications
4. Voice channels, video and screen sharing
5. Security hardening, optimisation, testing and deployment
