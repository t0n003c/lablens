# Project Status

Last updated: 2026-07-07

## Current Release

- Current stable release: `1.0.0`.
- Release `1.0.0` marks the current NAS-ready LabLens baseline.
- Future updates should remain local and fully tested until the user explicitly approves a GitHub push, release tag, or image publish.

## Local Post-1.0 Work

- In progress locally: premium UI refresh using image-generated design boards, a documented design system, clickable prototype, generated LabLens illustration assets, final desktop/mobile/prototype boards, refreshed tokens, System/Light/OLED Dark appearance control, active navigation states, mood-board glass/lens visual treatment, dashboard health score, enhanced trend chart controls, and polished auth/upload/report/settings surfaces.
- Current local UI direction follows `docs/design/1.0-ui-refresh/MOODBOARD_ALIGNMENT_PLAN.md` and ADR 0003 so the app matches the original mood board's layout and material quality more closely.
- This local UI refresh has not been pushed to GitHub or published as a new Docker image.

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
- Removed redundant grocery-swap wording from Routine next steps so food changes stay in the Food group.
- Added optional person profile context for age, gender, country/region, cultural background or ethnicity, work, hobbies, and routine notes. Recommendations use this only for practical fit and visit preparation, not lab thresholds or medical risk assumptions.
- Added multi-person support within one account: People can add/manage report profiles, upload/manual entry can assign a report to a person, dashboards can switch between people, Reports can filter by person, exports include people, and account data deletion resets to one clean default person.
- Moved people management out of Settings into its own left-navigation People tab.
- Added PWA install support with manifest, phone icons, service worker registration, and a mobile install prompt. The service worker avoids caching health data.
- Added image-based NAS deployment support through `docker-compose.image.yml` and a GitHub Container Registry workflow that publishes `ghcr.io/t0n003c/lablens:latest`.
- Made the container healthcheck NAS-friendly by checking multiple local app addresses before reporting the app unhealthy.
- Updated NAS/image compose and `.env.nas.example` guidance so Postgres stays on a private Docker network, production database passwords are required, and `DATA_ENCRYPTION_KEY` is documented as a stable future-encryption secret.
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
- Added `docs/design/1.0-ui-refresh/` with mood boards, high-fidelity direction, responsive/auth/upload flow boards, a clickable prototype, design-system notes, and UX audit.
- Added final image-generation boards for desktop flows, responsive mobile/tablet flows, and interaction motion states.
- Replaced dead Settings-style controls with honest status panels for server-configured Turnstile/runtime protection and AI summary provider behavior.
- Integrated the generated glass/lab report illustration into real app surfaces so the app reflects the mood-board material direction, especially auth and upload PDF flow, while keeping the dashboard focused on usable data.
- Added a larger mood-board asset set for trust/privacy, trend review, and upload/review contexts.
- Added mood-board UI primitives: glass panels, instrument panels, metric tiles, marker rows, status dots, and segmented controls.
- Rebuilt the dashboard first viewport around a composed health-score hero with a short score reason, `Start here` beside the score, and three colored status cards for Saved reports, Raw PDF storage, and Needs review.
- Moved the dashboard person selector into the top Health snapshot header and removed the duplicate person card below it.
- Removed the duplicate dashboard shortcut rail so Saved values does not repeat above the table and the detailed `Needs review` section remains the focused flagged-values area.
- Replaced the dashboard trend card and separate trend explanation card with a dark trend instrument that keeps selected-line insight beside the chart.
- Updated sidebar, auth, upload, next steps, needs review, and latest lab values surfaces to use the new material system.
- Replaced the desktop sidebar auth card with a compact account icon beside the LabLens mark; hover or click shows signed-in details and a logout action.
- Added a dedicated mobile dashboard health-score card so the phone layout no longer feels like a compressed desktop stack.
- Expanded Trends with working Trend, Compare, and Distribution views, point-specific tooltips, first-click line selection, and a cleaner chart area without obvious Latest update, Matched markers, Chart tools, or Latest point readouts.
- Made the phone PWA install prompt compact by default so it no longer covers the first dashboard card with expanded setup instructions.
- Fixed the development hydration warning caused by the early theme script applying `data-theme` before React hydration.
- Added a central same-origin proxy guard for mutating API routes and expanded the smoke audit to verify cross-origin authenticated writes are rejected.

## Known Gaps

- Account recovery has a local token flow; production email delivery still needs an environment-specific adapter.
- Upload review currently saves a draft immediately; a separate reject-without-save route could still be added.
- At-rest application encryption is documented as a future hook; database/disk encryption should be handled by the NAS or Postgres volume layer now.
- iPhone install still depends on the standard Safari Add to Home Screen flow; iOS does not allow a website to trigger the native install prompt directly.
- Real biometric setup on a phone requires a secure browser context. `localhost` is fine for development, but LAN phone links should use HTTPS.

## Next Build Steps

1. Continue the mood-board alignment plan locally: deeper Reports, People, Settings, and upload/review composition refinements.
2. Add Playwright smoke coverage for the upload/manual flows and visual responsive checks.
3. Add production account-recovery email adapter.
4. Add a compare view that can compare one person's reports without mixing other people in the same account.
