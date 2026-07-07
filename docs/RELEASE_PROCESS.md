# Release Process

Current stable release: `1.1.1`

## Local-First Rule

Future updates must stay local until the user explicitly approves a GitHub push, release tag, or image publish.

## Local Validation

Before asking for release approval, run the checks that match the change:

```bash
npm run test
npm run lint
npm run build
docker compose config --quiet
docker compose -f docker-compose.image.yml config --quiet
```

For deployment or broad behavior changes, also run the smoke script against a live local app:

```bash
SMOKE_BASE_URL=http://localhost:3010 npm run smoke
```

## Release Approval

Only after explicit approval:

1. Commit the tested local changes.
2. Push to GitHub.
3. Confirm the GitHub Container Registry image publish succeeds.
4. Optionally create a `vX.Y.Z` tag when a durable version tag is wanted.
5. Update NAS with `docker compose pull app` and `docker compose up -d --force-recreate app`.

Pushing to `main` publishes `ghcr.io/t0n003c/lablens:latest`, so do not push unfinished work.
