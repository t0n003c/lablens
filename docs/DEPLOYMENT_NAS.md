# NAS Deployment

## Recommended Topology

```text
Internet or LAN
  -> reverse proxy with HTTPS and body-size limit
  -> LabLens app container
  -> Postgres container
  -> encrypted NAS volume backups
```

## Setup

1. Copy `.env.example` to `.env`.
2. Replace all default secrets.
3. Decide whether `STORE_RAW_PDFS` should stay `false`.
4. Start from a prebuilt image:

```bash
docker compose -f docker-compose.image.yml pull
docker compose -f docker-compose.image.yml up -d
```

The NAS image compose file uses:

```yaml
image: ghcr.io/t0n003c/lablens:latest
```

The source-build compose file remains available for local development:

```bash
docker compose up -d --build
```

5. Check:

```bash
docker compose ps
curl http://localhost:3000/api/health
```

## Updates

Pull the latest published image and restart only changed containers:

```bash
docker compose -f docker-compose.image.yml pull
docker compose -f docker-compose.image.yml up -d
```

If the NAS cannot pull from `ghcr.io/t0n003c/lablens:latest`, check the GitHub package visibility and make the package public, or log in on the NAS with a GitHub token that can read packages.

## Reverse Proxy

Set:

- HTTPS only
- `X-Forwarded-For` headers
- Upload body limit aligned with `MAX_UPLOAD_MB`
- Rate limits for `/api/auth/*` and `/api/reports/upload`

Biometric login depends on WebAuthn and therefore needs a secure browser context. `localhost` works for development, but LAN or internet phone testing should go through HTTPS.

## Backup

Run scheduled `pg_dump` backups and, only if raw PDFs are enabled, archive the upload volume. Store backups encrypted and periodically test restore.
