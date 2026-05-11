# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Production-grade quantitative trading engine for intraday options trading. Built contract-first, outside-in. Personal use first, productizable later.

## Architecture

Monorepo using npm workspaces. TypeScript strict mode everywhere.

```
packages/shared/     — Shared types (single source of truth, never duplicated)
apps/engine/         — Trading engine (signal, decision, execution as separate modules)
apps/dashboard/      — Dashboard UI
```

- Business logic never imports from `apps/` directly
- Signal, decision, and execution logic must be separate modules — never merged
- One responsibility per module, no monolithic files
- Every module exports an interface and a placeholder function
- Scaffold with TODOs before writing logic

## Build Order (strict)

1. `packages/shared` — types first
2. Supabase schema second
3. `apps/engine` modules third
4. `apps/dashboard` last

## Constants (canonical — never hardcode elsewhere)

| Constant | Value |
|---|---|
| MAX_RISK_PER_TRADE | $20 |
| MAX_DAILY_LOSS | $40 |
| MAX_OPEN_POSITIONS | 2 |
| MIN_CONFIDENCE | 85 |
| TIMEZONE | America/Los_Angeles |
| MARKET_OPEN | 06:25 PST |
| MARKET_CLOSE | 13:05 PST |

## Stack

- yahoo-finance2 (market data)
- Anthropic SDK (Claude decision layer)
- Supabase JS (database)
- Vercel Cron (scheduler)
- Slack webhooks (notifications)

## Rules for Claude Code

- Do not change the folder structure without explicit instruction
- Do not add dependencies not listed above without asking
- Do not skip type definitions and write logic directly
- No execution logic until signal and decision layers are fully tested
- Risk guardrails are never bypassed regardless of confidence score
