# CLAUDE.md

## Architecture Enforcement

- **If a requirement doesn't fit the patterns in this file, STOP and ask before creating anything.**
- **Do not invent file structures, layers, or patterns not described here.**
- **Do not create a file without its corresponding test.**
- **Do not skip steps in the Module Creation Playbook.**
- Task is complete only when: code compiles, `yarn test` passes, `yarn test:coverage` shows no uncovered branches.

## Stack

Node.js 24 ESM · TypeScript strict · Prisma v7 + PgBouncer · Vitest · Pino

## Skills

This project uses these skills as the authoritative reference — read them before writing any code:

- **Architecture, patterns, testing:** `clean-ddd-hexagonal`
- **Database / ORM:** `prisma-expert`

## Commit Messages

Conventional Commits. Allowed prefixes: `feat`, `fix`, `chore`, `docs`, `test`, `style`, `refactor`, `perf`.
