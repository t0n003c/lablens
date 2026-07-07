# Changelog

## 1.1.0 - 2026-07-07

Released the audited post-1.0 UI and security refresh.

- Added the premium LabLens UI refresh with light/OLED palettes, mood-board design artifacts, generated illustration assets, refreshed auth/upload/dashboard/settings surfaces, and reusable Tailwind UI primitives.
- Rebuilt the dashboard first viewport around Health Snapshot, health score, Start Here, Saved Reports, Raw PDF Storage, and Needs Review.
- Added the compact sidebar account menu with signed-in details and delayed hover close behavior.
- Expanded Trends with a dark instrument surface, Trend/Compare/Distribution views, zoom controls, point-specific tooltips, and selected-line insights.
- Added System/Light/OLED Dark appearance support and early theme sync.
- Added a central same-origin API proxy guard for mutating `/api/*` requests.
- Expanded the smoke audit to verify cross-origin mutation blocking, PWA assets, auth, biometric, 2FA, reports, people, settings, upload, export, delete, and action-plan flows.

## 1.0.0 - 2026-07-06

Initial stable self-hosted LabLens release.

- Added local account auth, sessions, TOTP 2FA, biometric login, recovery flow, and audit logging.
- Added MyQuest PDF upload, editable extraction review, report finalization, manual entry, saved reports, and per-report deletion.
- Added multi-person profiles under one account with per-person dashboard, reports, trends, and next steps.
- Added cautious lab summaries, marker-specific review notes, latest-value hover explanations, trend insights, and grouped `My next steps`.
- Added practical report-based Food, Movement, Routine, and Sleep next steps with reset, done, delete, and replacement controls.
- Added Settings export, account data deletion, raw PDF storage toggle, and raw upload cleanup.
- Added phone-installable PWA support without caching health data.
- Added NAS-ready Docker Compose, prebuilt GHCR image publishing, private Postgres network guidance, health checks, and `.env` templates.
- Added tests, smoke checklist, dependency audit guidance, project docs, ADRs, Codex skill, and project agent prompts.

Release workflow after `1.0.0`: future updates stay local and tested until explicit approval to push to GitHub and publish a new image.
