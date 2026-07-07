# Security And Privacy

Current stable release: `1.1.1`

## Safety Model

LabLens is educational software. It explains trends and flags values against supplied reference ranges, but it must never diagnose, prescribe, or claim that a user has a condition.

## Current Controls

- Passwords are hashed with bcrypt.
- Sessions use HTTP-only, same-site cookies. HTTPS requests receive `Secure` cookies; plain private-LAN HTTP keeps normal login usable for NAS testing.
- Mutating API requests under `/api/*` pass through a same-origin proxy guard before route handlers run.
- Uploads are PDF-only with configurable size limits.
- Raw PDF storage is off by default.
- PWA service worker caches only static install assets and does not cache lab pages or API responses.
- Turnstile can be enabled through `.env`.
- TOTP 2FA setup and verification routes exist.
- Biometric login uses WebAuthn platform credentials as a second step after password, with short-lived signed challenge cookies.
- Audit logs cover login, upload, report creation, settings changes, and security events.
- `DATA_ENCRYPTION_KEY` can be set now and kept stable for future app-level encryption migrations, but the current version does not yet encrypt saved lab values at the application field level.

## HIPAA-Like Precautions

Self-hosting does not automatically make the app HIPAA compliant. Treat the app as sensitive health-data software:

- Use HTTPS and a trusted reverse proxy.
- Keep the NAS patched.
- Encrypt disks or volumes at the host level.
- Back up Postgres securely and test restores.
- Prefer local AI or a provider with acceptable privacy terms.
- Minimize raw PDF retention.
- Delete data on request and verify backups follow retention policy.

## Secrets

Never commit `.env`. Rotate `SESSION_SECRET`, database passwords, Turnstile secrets, AI keys, and `DATA_ENCRYPTION_KEY` if exposed. Once app-level field encryption is added, rotating `DATA_ENCRYPTION_KEY` will require a planned data re-encryption flow.

## Future Hardening

- Password reset email adapter.
- Per-report delete/export endpoints.
- Optional field-level encryption for lab values using the stable `DATA_ENCRYPTION_KEY`.
- Proxy-level request throttling.
- Security headers and CSP tuning.
