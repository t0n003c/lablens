# GitHub Workflow

Current stable release: `1.1.1`

## Daily Development

1. Create an issue for the bug, feature, or release task when the work is larger than a quick local fix.
2. Work on a branch named like `codex/fix-nas-login` or `codex/dashboard-score-color`.
3. Open a pull request into `main`.
4. Let GitHub CI pass before merge.
5. Merge only approved, tested work.

## CI

The `CI` workflow runs on pull requests, pushes to `main`, and manual dispatch.
It checks:

- `npm run test`
- `npm run lint`
- `npm run db:generate`
- `npm run build`
- `npx prisma validate`
- `docker compose config --quiet`
- `docker compose -f docker-compose.image.yml config --quiet`
- Docker image build validation without publishing

## NAS Image Publishing

Publishing the deployable NAS image is manual. Use GitHub Actions:

1. Open **Actions**.
2. Select **Publish NAS Image**.
3. Click **Run workflow**.
4. Enter the version, such as `1.1.2`.
5. Keep **publish_latest** enabled when Dockge should pull the new default image.

The manual publish workflow creates these tags:

- `ghcr.io/t0n003c/lablens:<version>`
- `ghcr.io/t0n003c/lablens:v<version>`
- `ghcr.io/t0n003c/lablens:latest` when `publish_latest` is enabled
- `ghcr.io/t0n003c/lablens:manual-<commit-sha>`

## NAS Update

After the publish workflow succeeds:

```bash
docker compose pull app
docker compose up -d --force-recreate app
```

For a safer rollback plan, pin Dockge to a version tag such as
`ghcr.io/t0n003c/lablens:1.1.1` instead of `latest`.
