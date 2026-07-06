# Project Status

Last updated: 2026-07-06

## Completed

- Created a Next.js, TypeScript, Tailwind, PostgreSQL, Prisma project scaffold.
- Added Docker Compose, Dockerfile, health check, `.env.example`, Prisma schema, initial migration, and seed data.
- Added local auth APIs for registration, login, logout, session lookup, TOTP setup/verify, settings, PDF upload, manual entry, and report listing.
- Added biometric login with WebAuthn platform credentials. When enabled, login requires email/password first, then Face ID, fingerprint, device PIN, or the device biometric prompt before a session is created.
- Added PDF text extraction, lab-value parsing, range flagging, cautious local summary generation, and AI-provider abstraction.
- Added support for MyQuest comprehensive-panel rows where the reference range appears before the unit.
- Added responsive LabLens UI with dashboard, auth pages, upload review, manual entry, report history, and settings.
- Added JSON data export and saved-lab-data deletion from Settings.
- Connected the signed-in dashboard to saved reports; guest users still see demo values, while signed-in users with no reports see an empty state.
- Wired dashboard metric tiles as real shortcuts: latest values and review flags scroll to lab values, saved reports opens Reports or Login, and raw PDF storage opens the Settings data section.
- Added a Settings toggle for raw PDF storage on future uploads.
- Added per-report deletion from Reports, with stored raw PDF cleanup when applicable.
- Added dashboard review guidance for flagged values plus report-based food, movement, routine, and sleep recommendations.
- Made recommendations marker-specific so food, movement, routine, and sleep suggestions reference actual report values such as A1c, total cholesterol, HDL, triglycerides, and vitamin D instead of broad generic advice.
- Reworked routine recommendations so they sound like daily habits and behavior cues rather than technical lab notes.
- Added optional person profile context for age, gender, country/region, cultural background or ethnicity, work, hobbies, and routine notes. Recommendations use this only for practical fit and visit preparation, not lab thresholds or medical risk assumptions.
- Added multi-person support within one account: People can add/manage report profiles, upload/manual entry can assign a report to a person, dashboards can switch between people, Reports can filter by person, exports include people, and account data deletion resets to one clean default person.
- Moved people management out of Settings into its own left-navigation People tab.
- Added PWA install support with manifest, phone icons, service worker registration, and a mobile install prompt. The service worker avoids caching health data.
- Added image-based NAS deployment support through `docker-compose.image.yml` and a GitHub Container Registry workflow that publishes `ghcr.io/t0n003c/lablens:latest`.
- Made the container healthcheck NAS-friendly by checking multiple local app addresses before reporting the app unhealthy.
- Added editable PDF review/finalize flow so users can correct extracted rows, skip untrusted rows, and regenerate summaries before relying on the report.
- Added saved next-step habits from recommendations, with active/done/remove controls on the dashboard and export/delete coverage.
- Updated Settings deletion to return users to the dashboard after data removal so the cleared state is visible immediately.
- Fixed one-sided lab reference flagging so values inside ranges like `<150` or `> OR = 60` are evaluated as normal/borderline instead of unknown; remaining non-numeric note rows display as not evaluated.
- Reduced dashboard redundancy by keeping `Needs review` focused on flagged lab values and changing the doctor section into broader `Questions for your visit` prompts.
- Replaced the dashboard `Questions for your visit` panel beside the trend graph with `What the trend shows`, using plain day-to-day notes from the graph and a visible chart legend.
- Improved trend safety by separating total cholesterol, HDL cholesterol, and triglycerides instead of matching any cholesterol value into one line; trend notes now explain whether a direction looks better, worth watching, or too sparse to trust.
- Changed the trend graph to show change from each marker's first saved result, merge same-day reports, and avoid visually comparing raw values across different units.
- Added selectable trend markers so `What the trend shows` focuses on the selected line instead of summarizing every visible trend at once.
- Added clear trend status labels: Better, Worse, Stable, and Not enough data yet.
- Expanded Latest lab values hover notes to include common low/high associations in everyday language, including CBC index markers such as MCH, MCV, MCHC, and RDW.
- Allowed `127.0.0.1` as a Next.js development origin so local browser testing works cleanly on both loopback addresses.
- Added comprehensive smoke audit coverage for pages, auth, 2FA, recovery, reports, PDF upload with extracted rows, settings, export, delete, logout, and protected routes.
- Added safe dependency overrides for audited transitive packages; `npm audit --audit-level=moderate` currently reports zero vulnerabilities.
- Added smoke test script and focused unit tests.
- Added project documentation, ADR, project-local Codex skill, and project-local agent prompts.

## Known Gaps

- Account recovery has a local token flow; production email delivery still needs an environment-specific adapter.
- Upload review currently saves a draft immediately; a separate reject-without-save route could still be added.
- At-rest application encryption is documented as a future hook; database/disk encryption should be handled by the NAS or Postgres volume layer now.
- iPhone install still depends on the standard Safari Add to Home Screen flow; iOS does not allow a website to trigger the native install prompt directly.
- Real biometric setup on a phone requires a secure browser context. `localhost` is fine for development, but LAN phone links should use HTTPS.

## Next Build Steps

1. Add production account-recovery email adapter.
2. Add Playwright smoke coverage for the upload/manual flows.
3. Add a compare view that can compare one person's reports without mixing other people in the same account.
