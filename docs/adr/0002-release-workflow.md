# ADR 0002: Release Workflow

Date: 2026-07-06

## Status

Accepted

## Context

LabLens now has a working NAS deployment and a published container image. Pushing to GitHub triggers the image workflow, so ordinary pushes can become deployable updates.

## Decision

Treat the current app as release `1.1.0`. Future updates should be developed and tested locally first. Do not push to GitHub, create release tags, or trigger a container publish unless the user explicitly approves the release.

## Consequences

- Local changes can accumulate safely while the NAS keeps running the last approved image.
- Release readiness depends on local test, lint, build, compose, and smoke checks before approval.
- The GitHub `main` branch and `ghcr.io/t0n003c/lablens:latest` should represent approved work, not experiments.
