# Architecture

## Stack Choice

LabLens uses Next.js App Router as a full-stack app because it keeps NAS hosting simple: one web container, one Postgres container, one `.env`, and one migration path. Prisma gives typed database access and repeatable migrations. PostgreSQL is durable, familiar, and easy to back up.

## Release Model

Release `1.1.0` is the current stable NAS-ready baseline. Future changes should be kept local and tested before any GitHub push, because pushing to `main` publishes a new `ghcr.io/t0n003c/lablens:latest` image.

## Docker Architecture

- `app`: Next.js standalone server, Prisma migrations on startup, mounted upload volume.
- `db`: PostgreSQL 17 Alpine with health check and persistent volume.
- Volumes: `lablens_postgres`, `lablens_uploads`.
- `docker-compose.yml`: local source-build workflow with the database published on host port `5433` for development tools.
- `docker-compose.image.yml`: NAS/image workflow using `ghcr.io/t0n003c/lablens:latest`, a private `lablensInternal` database network, and no published Postgres port.

## Folder Structure

```text
src/app/            Next.js pages and route handlers
src/components/     UI components
src/components/ui/  Small shadcn-style Tailwind primitives used by the refreshed UI
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

The 1.1.0 UI refresh adds a dashboard health score computed on the client from the currently displayed report data. It summarizes range-checked values, flagged values, and matched trend lines only; it does not change backend medical interpretation.

## Design System Artifacts

Design exploration and critique live in `docs/design/1.0-ui-refresh/`. The implemented UI uses CSS custom properties in `src/app/globals.css`, lucide icons, Tailwind classes, generated bitmap illustration assets in `public/illustrations/`, and small shadcn-style primitives in `src/components/ui/`.

The app applies theme preference in two layers. `ThemeScript` reads the last saved local preference before paint, while `ThemeSync` reads signed-in account settings from `/api/settings` and refreshes local storage. This keeps System, Light, and OLED Dark consistent across pages without adding a schema change.

Navigation active state is isolated in a small client component (`NavLink`) that uses `usePathname()`, while the app shell itself remains otherwise server-rendered.

ADR 0003 guides the 1.1.0 mood-board UI architecture. The first implementation pass adds material primitives such as glass panels, instrument panels, metric tiles, marker rows, status dots, segmented controls, a dedicated health-score hero, and a trend instrument so the app can match the generated mood board more closely.

The generated image asset layer is split by functional surface:

- `lablens-glass-trust.png` for privacy, auth, and trust cues.
- `lablens-trend-lens.png` for the trend instrument.
- `lablens-upload-review.png` for upload and review workflows.
- `lablens-report-lens.png` for general report-lens context.

These assets live in `public/illustrations/` and are consumed through `LabLensVisual` or specific composition components. They are treated as UI context, not as a source of health interpretation.

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
- Sensitive database data at rest: rely on NAS disk or volume encryption today; `DATA_ENCRYPTION_KEY` is reserved for future app-level field encryption migrations and should remain stable once set.

## AI Behavior

The app asks the AI for structured JSON only, with explicit instructions to avoid diagnosis or treatment claims. If a provider is unavailable, LabLens generates a cautious local summary.
