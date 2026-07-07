# Testing And Smoke Plan

Current stable release: `1.1.1`

## Release Gate

Future updates should stay local until these checks pass and the user explicitly approves a GitHub push or image publish.

Minimum local release checks:

```bash
npm run test
npm run lint
npm run build
docker compose config --quiet
docker compose -f docker-compose.image.yml config --quiet
```

Use `SMOKE_BASE_URL=http://localhost:3010 npm run smoke` for broad app, auth, upload, settings, People, reports, and action-plan changes.

GitHub CI now runs test, lint, build, Prisma validation, Compose validation, and a
Docker build on pull requests and `main` pushes. NAS image publishing is manual.

## Unit Tests

Current focused tests:

- Lab parser extracts Quest-style rows and MyQuest comprehensive-panel rows.
- Flagging identifies borderline values.
- Flagging treats in-range one-sided reference ranges as evaluated normal values.
- Trend matching keeps HDL cholesterol separate from total cholesterol, avoids raw mixed-unit comparisons, and explains trend meaning beyond up/down movement.
- Trend insight filtering focuses notes on the selected trend marker.
- Recommendations mention specific markers and values when the report contains actionable markers.
- Recommendations can use optional profile context, including age and gender, for practical habit fit without identity-based medical claims or changed lab thresholds.
- Session cookie serialization keeps login usable over private HTTP NAS links while preserving `Secure` cookies for HTTPS requests and reverse proxies.
- Health score display uses fixed color thresholds: 80-100 green, 70-79 yellow, and below 70 red.
- Local summary keeps non-diagnostic language.

Run:

```bash
npm run test
```

## Latest Local UI Refresh Verification

Date: 2026-07-06

Completed locally and released for the 1.1.0 UI refresh:

- `npm run lint` passed.
- `npm run test` passed: 5 files, 32 tests.
- `npm run build` passed with Next.js 16.2.10.
- Browser smoke passed at `http://127.0.0.1:3010`.
- Desktop dashboard verified: Health score is visible, chart zoom controls are present, `Start here this week` is not shown, and no horizontal overflow.
- Mobile smoke verified at 390 x 844 for Upload, Reports, and Login with no horizontal overflow.
- Browser console showed no errors during the final smoke pass.
- Additional continuation: Settings now exposes System, Light, and OLED Dark appearance choices backed by the existing settings API and local early-load theme application.
- Browser theme check passed: OLED Dark sets `data-theme="dark"`, Light sets `data-theme="light"`, System removes the override, selected buttons update `aria-pressed`, and no console errors were reported.
- Final UI continuation check passed: active desktop/mobile navigation uses `aria-current`, Settings shows Appearance, Runtime protection, and Intelligence sections, the dead Turnstile button is gone, desktop Settings/Reports and mobile People have no horizontal overflow, and no browser console errors were reported.
- Mood-board visual alignment check passed: generated glass/lab illustration now renders on Dashboard, Upload, Auth, and sidebar trust surfaces; desktop and mobile checks for Dashboard, Upload, Login, and Settings report no horizontal overflow and no console errors.
- PWA/local preview follow-up on 2026-07-07: refreshed the local dev bundle after stale CSS caused white fallback borders, verified the desktop and 390px mobile dashboard have no horizontal overflow, confirmed `/api/health` is `ok`, confirmed the Apple touch icon is served, and passed `npm run lint`, `npm run test`, and `npm run build`.
- NAS auth follow-up on 2026-07-07: added request-aware session cookie serialization and unit coverage for HTTP LAN, HTTPS, and reverse-proxy forwarded protocol behavior. Local HTTP auth smoke passed by registering a temporary account, confirming the session cookie did not include `Secure`, and confirming `/api/auth/me` recognized the cookie; the temporary account was removed afterward.
- Release 1.1.1 validation on 2026-07-07: `npm run test`, `npm run lint`, `npm run build`, `npm run audit:deps`, `npx prisma validate`, `docker compose config --quiet`, `POSTGRES_PASSWORD=release-check docker compose -f docker-compose.image.yml config --quiet`, and `SMOKE_BASE_URL=http://127.0.0.1:3010 npm run smoke` passed before GitHub push approval.
- GitHub workflow modernization on 2026-07-07: workflow and issue-template YAML parsed successfully, `npm run test`, `npm run lint`, `docker compose config --quiet`, and `POSTGRES_PASSWORD=release-check docker compose -f docker-compose.image.yml config --quiet` passed locally before push.

## Smoke Tests

The smoke script uses a temporary account and cleans it up after the run. It checks:

- All primary pages.
- PWA install assets: manifest, service worker, offline page, and phone icons.
- Health endpoint with clean `ok` status.
- Unauthenticated protections.
- Cross-origin mutation protection for authenticated API writes.
- Account registration, session lookup, logout, and login.
- 2FA setup, verification, and login enforcement.
- Biometric setup options, protected biometric endpoints, and password-plus-2FA login pausing for biometric verification when enabled.
- Account recovery token creation and password reset.
- Settings read/update.
- Optional People profile save and saved-report refresh.
- People create/update, report assignment to different people, per-person report filters, per-person action plan isolation, export coverage, and clean reset after account data deletion.
- Raw PDF storage toggle and stored-file cleanup.
- Manual report creation.
- PDF upload draft creation with at least one extracted lab row.
- PDF review/finalize.
- Action plan create/update.
- Report list/search.
- JSON export.
- Single report deletion.
- Saved report/data deletion.
- Post-delete action plan state: the temporary user's saved habits must be empty after deletion.
- Post-delete report API state: the temporary user's report list must be empty after deletion.

Run against a live app:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke
```

## Manual Smoke Checklist

- Create account.
- Login and logout.
- Upload a MyQuest PDF under the size limit.
- Confirm extracted rows appear before relying on the draft summary.
- Edit or skip an extracted row, save review, and finalize the report.
- Add a manual lab result.
- Confirm the dashboard shows the manual result while signed in.
- Confirm dashboard metric tiles navigate: review flags to lab values, saved reports to Reports, raw PDF storage to Settings data.
- Confirm `My next steps` appears above `Needs review` on the dashboard.
- Confirm review flags explain why values are flagged and show next-step prompts.
- Confirm `Needs review` does not show a separate Summary or extra short report summary block.
- Confirm the trend graph has visible selectable line labels, uses relative movement rather than one raw mixed-unit axis, and `What the trend shows` changes to the selected marker only.
- Confirm the trend info button explains which supported markers can appear and which ones were found in the saved reports.
- Confirm only text-only/non-numeric lab rows appear as `not evaluated`; one-sided numeric ranges should not appear as unknown.
- Hover and keyboard-focus Latest lab values test names and confirm a short marker description appears.
- Confirm recommendations include food, movement, routine, and sleep sections.
- Confirm recommendations are tied to current report markers rather than only generic wellness advice.
- Confirm there is no separate dashboard Recommendations section.
- Confirm `My next steps` shows short direct steps from the current report, then mark a step done and delete it.
- Use `Reset` in `My next steps` after deleting a step and confirm the step comes back.
- Confirm `My next steps` is grouped by Sleep, Routine, Food, and Movement.
- Add optional People profile context, including age and gender, and confirm refreshed recommendations use practical daily-life wording without changing lab flags.
- Add a second person in People, upload or manually enter a report for that person, then switch the dashboard person selector and confirm latest values, trends, and next steps only show that person's data.
- In Reports, use `All people` and each person filter, then confirm report rows show the correct person name.
- Search reports.
- Delete one saved report from Reports.
- Export data from Settings.
- Delete account data from Settings and confirm the dashboard changes to `No saved lab values`, without demo values or the previous latest lab table.
- Generate 2FA setup QR.
- In Settings, set up biometric login on a supported device and confirm the next login asks for email, password, then biometric verification.
- Turn off biometric login from Settings and confirm password login works without the biometric step.
- Confirm `/api/health` is `ok` or `degraded` with clear warnings.
- On Android Chrome, open the app and confirm the install prompt can trigger installation.
- On Android Chrome over a local HTTP/LAN link, confirm the prompt explains that HTTPS is needed for the one-tap install button and still gives Add to Home screen steps.
- On iPhone Safari, open the app and confirm the prompt shows Share, then Add to Home Screen instructions and uses the LabLens touch icon.
- On iPhone Chrome, confirm the prompt tells the user to open the link in Safari instead of making a Chrome-branded shortcut.

## Audit Checklist

- `npm run audit:deps`
- `docker compose config --quiet`
- `docker compose -f docker-compose.image.yml config --quiet`
- `docker build -t lablens-audit .`
- Confirm `.env` is ignored.
- Confirm raw PDF storage policy.
- Confirm reverse proxy body-size limits.
- Confirm database backups and restore procedure.
- Review audit log entries for auth, upload, export, delete, and settings changes.

## Latest Security Audit

Date: 2026-07-07

Completed locally before GitHub push:

- `npm run lint` passed.
- `npm run test` passed: 5 files, 32 tests.
- `npm run build` passed with Next.js 16.2.10 and the new API proxy guard.
- `npm audit --audit-level=moderate` reported 0 vulnerabilities.
- `npx prisma validate` passed.
- `docker compose -f docker-compose.yml config` passed.
- `docker compose -f docker-compose.image.yml config` passed with a placeholder `POSTGRES_PASSWORD`.
- `SMOKE_BASE_URL=http://127.0.0.1:3010 npm run smoke` passed end to end, including cross-origin mutation blocking.
- `.env` is ignored and not tracked.
