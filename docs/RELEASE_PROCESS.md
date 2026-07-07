# Release Process

Current stable release: `1.1.1`

## Local-First Rule

Future updates must stay local until the user explicitly approves a GitHub push, release tag, or image publish.

## GitHub-First Flow

Use pull requests for normal work:

1. Create or link a GitHub issue.
2. Work on a branch.
3. Open a pull request.
4. Let the `CI` workflow pass.
5. Merge only approved work into `main`.

Pushing or merging to `main` runs CI but does not publish the NAS image.

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
3. Confirm the `CI` workflow succeeds.
4. Run the manual **Publish NAS Image** workflow with the approved version.
5. Confirm the GitHub Container Registry image publish succeeds.
6. Update NAS with `docker compose pull app` and `docker compose up -d --force-recreate app`.

The publish workflow can create `latest`, `<version>`, and `v<version>` image tags.
Do not run **Publish NAS Image** for unfinished work.
