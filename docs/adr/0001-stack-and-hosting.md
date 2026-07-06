# ADR 0001: Stack And Hosting Model

Date: 2026-07-05

## Status

Accepted

## Context

The app must be self-hosted on a NAS, use Docker Compose, support authentication, parse PDF lab reports, store longitudinal lab values, and keep AI provider configuration behind environment variables.

## Decision

Use a full-stack Next.js App Router app, PostgreSQL, Prisma, and Docker Compose.

## Consequences

- One application container is easier to host and back up than a split frontend/backend for this scope.
- PostgreSQL provides durable relational storage for reports, lab values, sessions, audit logs, and future multi-user roles.
- Prisma migrations make schema changes explicit.
- Next.js route handlers are sufficient for the current API surface.
- A future separate worker may be useful if PDF parsing or AI summarization becomes slow.
