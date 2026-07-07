---
name: health-report-app
description: Build and maintain the LabLens self-hosted health report app. Use this skill when working on LabLens features, architecture, UI, auth, PDF parsing, lab result summaries, Docker/NAS deployment, privacy controls, security reviews, tests, docs, or AI health-summary behavior.
---

# Health Report App

## Core Workflow

1. Read `docs/PROJECT_STATUS.md` and the files directly related to the requested area.
2. Preserve the self-hosted shape: Next.js App Router, PostgreSQL, Prisma, Docker Compose, `.env` configuration, and NAS-friendly backup/restore.
3. Keep health language cautious. Never add diagnosis, treatment, or certainty beyond the supplied lab ranges.
4. Prefer local or configurable AI paths. Do not hard-code a hosted AI provider or secret.
5. Keep multi-person account data separated: reports, dashboard views, trends, and next steps should always respect the selected person unless an explicit all-people view is intended.
6. Validate PDF, auth, settings, and person/report ownership changes with tests or a smoke path whenever practical.
7. Update progress, design, architecture, or ADR docs when a decision changes.
8. Treat the current app as release `1.0.0`. Keep future updates local and tested until the user explicitly approves a GitHub push, release tag, or image publish.

## App Standards

Read `references/app-standards.md` before changing health-summary behavior, security-sensitive code, parser logic, deployment files, or database schema.

## Design Defaults

- Product name: LabLens.
- Desktop: persistent sidebar.
- Mobile: bottom navigation.
- Palette: neutral surfaces, teal primary, amber warning, rose danger, green success, violet analytic accent.
- Use accessible labels, visible focus, and clear review states.
- Do not make generated health text sound diagnostic.
