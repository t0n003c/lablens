# Architecture

## Stack Choice

LabLens uses Next.js App Router as a full-stack app because it keeps NAS hosting simple: one web container, one Postgres container, one `.env`, and one migration path. Prisma gives typed database access and repeatable migrations. PostgreSQL is durable, familiar, and easy to back up.

## Docker Architecture

- `app`: Next.js standalone server, Prisma migrations on startup, mounted upload volume.
- `db`: PostgreSQL 17 Alpine with health check and persistent volume.
- Volumes: `lablens_postgres`, `lablens_uploads`.

## Folder Structure

```text
src/app/            Next.js pages and route handlers
src/components/     UI components
src/lib/            server helpers, parsing, AI, security, demo data
prisma/             schema, migrations, seed data
scripts/            smoke and container health checks
tests/              unit tests
docs/               product, architecture, security, deployment notes
.codex/             project-local skills and agent prompts
```

## Database Model

Core tables:

- `User`, `UserSettings`, `PersonProfile`, `Session`, `Passkey`
- `HealthReport`, `LabResult`
- `ActionPlanItem`
- `AuditLog`

An account can contain multiple `PersonProfile` records. Every saved `HealthReport` belongs to exactly one person, and saved `ActionPlanItem` rows also carry a `personId` so next steps stay separated when one login manages more than one person's lab results.

Reports can come from PDF, manual entry, or demo seed data. Lab values store parsed numeric value, raw string value, unit, reference range, category, and range-based flag.

`UserSettings` stores optional recommendation context such as age, gender, country/region, cultural background or ethnicity, work/daily role, hobbies, and routine notes. These fields are used only to make recommendations more practical and to support visit preparation; they do not change lab thresholds or medical interpretation.

`PersonProfile` can also store those optional recommendation context fields. New accounts get one default person copied from the account profile when needed. The People page treats profile context as person-specific, so one account can upload separate lab reports for family members without mixing recommendations or dashboard views.

`ActionPlanItem` stores user-selected recommendation habits, with active/done/archived status.

## API Design

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/2fa/setup`
- `POST /api/auth/2fa/verify`
- `POST /api/auth/biometric/register/options`
- `POST /api/auth/biometric/register/verify`
- `POST /api/auth/biometric/login/verify`
- `DELETE /api/auth/biometric`
- `GET/PATCH /api/settings`
- `GET/POST /api/people`
- `PATCH/DELETE /api/people/[id]`
- `GET/POST /api/action-plan`
- `PATCH/DELETE /api/action-plan/[id]`
- `GET /api/reports`
- `POST /api/reports/upload`
- `POST /api/reports/manual`
- `PATCH/DELETE /api/reports/[id]`
- `GET /api/account/export`
- `DELETE /api/account/data`
- `GET /api/health`

## Dashboard Data Flow

The root page renders the shared app shell and a client dashboard. Signed-in users first load `GET /api/people`, pick the stored or default person, then fetch `GET /api/reports?personId=...` and `GET /api/action-plan?personId=...`:

- `401`: show guest demo values with a login prompt.
- Empty authenticated report list: show `No saved lab values`.
- Authenticated reports: show saved-value counts, latest lab rows, trends, summary, recommendations, and saved next-step habits from the user's own report data.

## PWA Install Flow

LabLens ships a web app manifest, home-screen icons, and a service worker from `public/`. The service worker only caches static install assets such as the manifest, icons, and offline page. It deliberately does not cache API responses or report pages so sensitive lab data is not stored silently in the browser cache.

`PwaInstallPrompt` registers the service worker and shows a mobile install prompt when the app is opened in a phone browser. Android Chrome can use the native install prompt. iPhone Safari gets a custom Add to Home Screen instruction because iOS does not expose the same native prompt event.

## Biometric Login Flow

Biometric login uses WebAuthn platform credentials stored in the existing `Passkey` table. Settings starts registration only for an already signed-in user, then enables `User.passkeyEnabled` after the browser verifies Face ID, fingerprint, device PIN, or the local platform authenticator.

Login remains email and password first. If password and any TOTP code are valid and the account has a registered passkey, `POST /api/auth/login` returns a short-lived signed WebAuthn challenge instead of creating a session. `POST /api/auth/biometric/login/verify` creates the session only after the device verifies that challenge.

The WebAuthn challenge is stored in an HTTP-only, same-site, signed cookie for five minutes. WebAuthn requires a secure browser context; `localhost` works for development, while phone testing over a LAN should use HTTPS for real biometric setup.

## Failure Points And Mitigations

- Invalid or oversized PDFs: type, extension, and size validation.
- PDF parsing failure: parser warnings and manual entry path.
- AI provider failure: local summary fallback.
- Missing env vars: health endpoint warnings and `.env.example`.
- Database failure: health endpoint degraded status.
- Auth brute force: in-memory rate limiting, with reverse-proxy rate limiting recommended.
- Biometric bypass: sessions are created only after password, optional TOTP, and WebAuthn verification have all passed.
- Sensitive uploads: raw PDF storage disabled by default.
- Sensitive browser storage: PWA service worker avoids caching lab data or authenticated pages.

## AI Behavior

The app asks the AI for structured JSON only, with explicit instructions to avoid diagnosis or treatment claims. If a provider is unavailable, LabLens generates a cautious local summary.
