# ADR 0002: Release Workflow

Date: 2026-07-06

## Status

Accepted

## Context

LabLens now has a working NAS deployment and a published container image. Earlier versions published a deployable image on every `main` push, which made ordinary code pushes too risky.

## Decision

Treat the current app as release `1.1.2`. Future updates should be developed and tested locally or in pull requests first. Pushes and pull requests run CI. Container publishing requires a separate, explicit run of the manual **Publish NAS Image** workflow with a version input.

## Consequences

- Local changes can accumulate safely while the NAS keeps running the last approved image.
- Pull requests get automated test, lint, build, Prisma, Compose, and Docker build validation.
- The GitHub `main` branch represents approved code, while `ghcr.io/t0n003c/lablens:latest` changes only after a manual publish.
