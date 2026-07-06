# Security And Privacy

## Safety Model

LabLens is educational software. It explains trends and flags values against supplied reference ranges, but it must never diagnose, prescribe, or claim that a user has a condition.

## Current Controls

- Passwords are hashed with bcrypt.
- Sessions use HTTP-only, same-site cookies.
- Uploads are PDF-only with configurable size limits.
- Raw PDF storage is off by default.
- PWA service worker caches only static install assets and does not cache lab pages or API responses.
- Turnstile can be enabled through `.env`.
- TOTP 2FA setup and verification routes exist.
- Biometric login uses WebAuthn platform credentials as a second step after password, with short-lived signed challenge cookies.
- Audit logs cover login, upload, report creation, settings changes, and security events.

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

Never commit `.env`. Rotate `SESSION_SECRET`, database passwords, Turnstile secrets, and AI keys if exposed.

## Future Hardening

- Password reset email adapter.
- Per-report delete/export endpoints.
- Optional field-level encryption for lab values.
- Proxy-level request throttling.
- Security headers and CSP tuning.
