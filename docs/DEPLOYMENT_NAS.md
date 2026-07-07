# NAS Deployment

Current stable release: `1.1.2`

## Recommended Topology

```text
Internet or LAN
  -> reverse proxy with HTTPS and body-size limit
  -> LabLens app container
  -> Postgres container
  -> encrypted NAS volume backups
```

## Setup

1. Copy `.env.nas.example` to `.env`.
2. Fill in all blank or environment-specific values before the first database start:
   - `APP_URL`: the LAN or HTTPS URL users will open.
   - `SESSION_SECRET`: generate with `openssl rand -hex 32`.
   - `POSTGRES_PASSWORD`: generate a strong database password and keep it stable after the Postgres volume exists.
   - `DATA_ENCRYPTION_KEY`: generate with `openssl rand -hex 32` and keep it stable for future app-level encryption migrations.
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

It publishes only the app port. Postgres is not exposed to the NAS host; the app
reaches it through an internal Docker network at `lablens-postgres:5432`.

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

Only pull a newer image after the user has approved a release and the manual
**Publish NAS Image** GitHub workflow has completed successfully.

Pull the latest published image and restart only changed containers:

```bash
docker compose -f docker-compose.image.yml pull
docker compose -f docker-compose.image.yml up -d
```

If the NAS cannot pull from `ghcr.io/t0n003c/lablens:latest`, check the GitHub package visibility and make the package public, or log in on the NAS with a GitHub token that can read packages.

## Dockge Or Synology Network Pattern

For a Dockge stack behind a NAS reverse-proxy network, attach only the app to the
external proxy network and keep the database on a LabLens-only internal network:

```yaml
services:
  app:
    image: ghcr.io/t0n003c/lablens:latest
    pull_policy: always
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env
    environment:
      DATABASE_URL: "postgresql://${POSTGRES_USER:-lablens}:${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}@lablens-postgres:5432/${POSTGRES_DB:-lablens}?schema=public"
      UPLOAD_DIR: /app/data/uploads
    ports:
      - "3449:3000"
    volumes:
      - /volume1/docker/lablens/uploads:/app/data/uploads
    healthcheck:
      test: ["CMD", "node", "scripts/container-healthcheck.mjs"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    networks:
      - yourNasProxyNetwork
      - lablensInternal

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-lablens}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-lablens}
    volumes:
      - /volume1/docker/lablens/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-lablens} -d ${POSTGRES_DB:-lablens}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      lablensInternal:
        aliases:
          - lablens-postgres

networks:
  yourNasProxyNetwork:
    external: true
  lablensInternal:
    internal: true
```

Replace `yourNasProxyNetwork` with the actual external network name from the NAS.
Do not publish the database port unless you specifically need temporary local
database administration access.

## Reverse Proxy

Set:

- HTTPS only
- `X-Forwarded-For` headers
- `X-Forwarded-Proto: https` when TLS terminates at the proxy
- Upload body limit aligned with `MAX_UPLOAD_MB`
- Rate limits for `/api/auth/*` and `/api/reports/upload`

LabLens can keep normal login sessions over a private plain-HTTP LAN URL such as
`http://10.0.10.125:3449`. When HTTPS is used, the app marks session cookies
`Secure` based on the request URL, common forwarded-protocol headers, or the
browser origin.

Biometric login depends on WebAuthn and therefore needs a secure browser context. `localhost` works for development, but LAN or internet phone testing should go through HTTPS.

## Backup

Run scheduled `pg_dump` backups and, only if raw PDFs are enabled, archive the upload volume. Store backups encrypted and periodically test restore.

`DATA_ENCRYPTION_KEY` does not currently encrypt saved lab values by itself. Treat
NAS disk or volume encryption, database permissions, and encrypted backups as the
active data-at-rest controls today.
