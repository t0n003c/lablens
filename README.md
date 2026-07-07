# LabLens

LabLens is a self-hosted health report app for uploading MyQuest Diagnostics PDF lab reports, reviewing extracted lab values, and generating cautious plain-English summaries with general food, exercise, lifestyle, and doctor-follow-up prompts.

LabLens is not a doctor. It flags values against supplied reference ranges and avoids diagnosis or treatment claims.

Current release: `1.1.0`

Future updates should stay local and be fully tested before GitHub push, tag, or image publish approval. See `docs/RELEASE_PROCESS.md`.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- PostgreSQL with Prisma migrations
- Local email/password auth, secure password hashing, session cookies, TOTP 2FA, and biometric login with WebAuthn
- PDF extraction with `pdf-parse`
- AI abstraction through `.env`: `mock`, `local`, or OpenAI-compatible endpoint
- Docker Compose for NAS hosting
- Phone-installable PWA support

## Quick Start

1. Copy `.env.example` to `.env` and replace secrets.
2. Start the database and app from local source:

```bash
docker compose up --build
```

3. Open `http://localhost:3000`.
4. Optional demo seed from a local shell:

```bash
npm run db:generate
npm run db:seed
```

Demo login after seeding:

- Email: `demo@lablens.local`
- Password: `ChangeMeNow!2026`

## NAS Image Deployment

For a NAS that should pull a prebuilt image instead of building the app:

```bash
cp .env.nas.example .env
# Edit .env first: set APP_URL, SESSION_SECRET, POSTGRES_PASSWORD,
# and DATA_ENCRYPTION_KEY before the first database start.
docker compose -f docker-compose.image.yml pull
docker compose -f docker-compose.image.yml up -d
```

Future updates:

```bash
docker compose -f docker-compose.image.yml pull
docker compose -f docker-compose.image.yml up -d
```

The image is published as `ghcr.io/t0n003c/lablens:latest` from the `main` branch.
The current stable app release is `1.1.0`.

Use `.env.example` for local development and `.env.nas.example` for NAS or
Dockge image deployment.

The image compose file exposes only the app port and keeps Postgres on a private
Docker network. Generate secrets with commands such as:

```bash
openssl rand -hex 32
```

`DATA_ENCRYPTION_KEY` is reserved for future app-level encryption migrations. Set
one stable random value now and keep it safe, but note that the current version
still relies on NAS disk or volume encryption for data at rest.

## Local Development

```bash
npm install
npm run db:generate
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev -- --port 3010
```

The local development database is exposed on host port `5433` to avoid common conflicts with other Postgres containers.

Health check:

```bash
curl http://localhost:3010/api/health
```

Expected local test response:

```json
{"status":"ok","service":"lablens","database":"ok","warnings":[]}
```

If you only need framework development without the database:

```bash
npm install
npm run db:generate
npm run dev
```

Useful checks:

```bash
npm run test
npm run lint
npm run build
SMOKE_BASE_URL=http://localhost:3010 npm run smoke
npm run audit:deps
```

## Important Files

- `CHANGELOG.md` records release notes.
- `docs/PROJECT_STATUS.md` tracks current progress and next work.
- `docs/RELEASE_PROCESS.md` records the local-first release workflow.
- `docs/ARCHITECTURE.md` records the system design.
- `docs/DESIGN_DECISIONS.md` records product and UI decisions.
- `docs/adr/0001-stack-and-hosting.md` records the first architecture decision.
- `docs/adr/0002-release-workflow.md` records the local-first release decision.
- `.codex/skills/health-report-app/` contains project-local Codex guidance.
- `.codex/agents/` contains project-specific agent prompts for future reviews.
- `.env.example` is the local development template; `.env.nas.example` is the NAS/Dockge template.

## Backup And Restore

PostgreSQL data lives in the `lablens_postgres` Docker volume. Raw PDFs are disabled by default; if enabled, uploads live in `lablens_uploads`.

Backup:

```bash
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > lablens-backup.sql
docker run --rm -v lablens_uploads:/data -v "$PWD":/backup alpine tar czf /backup/lablens-uploads.tgz /data
```

Restore:

```bash
docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB" < lablens-backup.sql
docker run --rm -v lablens_uploads:/data -v "$PWD":/backup alpine tar xzf /backup/lablens-uploads.tgz -C /
```

## Production Notes

Use a reverse proxy with HTTPS, request-size limits, and rate limiting. Set strong values for `SESSION_SECRET`, `POSTGRES_PASSWORD`, `DATA_ENCRYPTION_KEY`, and any AI provider secret. Prefer local AI for sensitive data when possible.

Biometric login uses the browser's WebAuthn platform support. `localhost` works for development, but phone or LAN testing should use HTTPS so Face ID, fingerprint, device PIN, or the platform biometric prompt is available.
