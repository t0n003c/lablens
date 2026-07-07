# Roadmap

## Version 1.0.0

- Authenticated single-user/self-hosted experience.
- PDF upload with draft review.
- Manual entry.
- Report history, trend cards, and exports.
- Editable PDF review and report finalization.
- Saved next-step habits from recommendations.
- Optional profile context for practical recommendation fit.
- Multiple people under one account, with per-person reports, dashboard views, and next steps.
- 2FA setup.
- Biometric login as a second step after password.
- Phone-installable PWA support.
- Docker Compose deployment.

## Version 1.1.0

- Premium mood-board aligned UI refresh for dashboard, auth, upload, settings, reports, people, and navigation.
- Health-score hero, Start Here, My Next Steps grouping, refreshed status cards, and compact sidebar account menu.
- System/Light/OLED Dark appearance support.
- Expanded trend instrument with Trend, Compare, Distribution, zoom, point-specific tooltips, and selected-line insights.
- Same-origin proxy guard for mutating API routes and expanded smoke audit coverage.

## Version 1.1.1 - Current Stable

- NAS HTTP login persistence fix for private LAN deployments.
- Mobile PWA install copy clarified for iPhone Safari, iPhone Chrome, and Android local HTTP links.
- Dedicated Apple touch icon for cleaner iOS home-screen installs.
- Health-score color thresholds: 80-100 green, 70-79 yellow, and below 70 red.

## Version 1.2+

- Hold future updates locally until release approval.
- Expand local smoke coverage before the next GitHub push.
- Finish the secondary mood-board refactors for Reports, People, Settings, and the upload/review workflow.
- Run visual smoke checks for the new health-score hero, trend instrument, light mode, OLED dark mode, desktop, tablet, and mobile layouts.
- Add Playwright visual smoke coverage for desktop, tablet, and mobile layouts.
- Add real backend-supported settings for password change, named passkeys/devices, autolock, and session management before exposing those controls in the UI.

## Version 2

- Biometric/passkey device management, including naming devices and removing one device at a time.
- Recovery email adapter.
- Per-person report compare view.
- Markdown and PDF export.
- Local LLM profile with model capability checks.
- User-configurable lab category mappings.

## Version 3

- Multi-user roles.
- Shared-account roles and permissions for family/member access.
- Provider-specific parser packs.
- Optional wearable imports.
- Encrypted field storage.
- Advanced anomaly detection with explicit uncertainty.
