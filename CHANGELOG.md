# Changelog

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
