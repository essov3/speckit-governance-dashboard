# SpecKit Governance Dashboard

A standalone, read-only, Markdown-first visual dashboard for SpecKit projects.

---

> [!IMPORTANT]
> **What This Dashboard IS:**
> - A reader, parser, validator, and visualizer only.
> - A tool to surface development and governance states (specifications, tasks, gates, decision records, contracts, evidence) directly from Markdown artifacts.
> - Fully deterministic, reproducible, and source-linked.
>
> **What This Dashboard IS NOT:**
> - **Not a second source of truth:** Committed Markdown and governance artifacts remain the only source of truth.
> - **Not a status writer:** It will never mutate the target SpecKit project, mark features Verified, close gates, or declare readiness.
> - **Not a database:** It contains no mutable backend state store or runtime telemetry.

---

## Features

- **External Project Path Resolution:** Run this tool against any SpecKit repository path.
- **Safe Output Location Mode:** By default, cache files are written *outside* the target project to prevent pollution.
- **Adapter-Based Architecture:** Easily extensible for project-specific governance models. Comes out of the box with vanilla SpecKit and OAR B readiness governance adapters.
- **Staleness Protection:** Compares file hashes on disk with cache outputs to verify synchronization.
- **Read-Only Protection Check:** Active validation of source file integrity during CLI commands to guarantee no mutations occur.

---

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Commands

Generate a project status snapshot:
```bash
npm run dashboard:generate -- --project-root /path/to/spec-kit-project
```

Validate readiness gates and check if snapshots are stale:
```bash
npm run dashboard:check -- --project-root /path/to/spec-kit-project
```

Start the local server and open the web dashboard:
```bash
npm run dashboard:serve -- --project-root /path/to/spec-kit-project
```

Diagnose SpecKit folder structure and files:
```bash
npm run dashboard:doctor -- --project-root /path/to/spec-kit-project
```

---

## Configuration

You can place a `speckit-dashboard.config.json` in the dashboard repository root:

```json
{
  "projectRoot": "../oar-b",
  "adapter": "auto",
  "output": ".dashboard-cache/oar-b/project-status.json",
  "strict": false
}
```

> [!CAUTION]
> **Forbidden Configuration Fields:**
> The configuration must **never** contain readiness/lifecycle override state, such as:
> ```json
> {
>   "P0": "CLOSED",
>   "feature090": "VERIFIED"
> }
> ```
> If any state-looking fields are detected in the configuration, the CLI will throw an error:
> `Config must not contain lifecycle/readiness state. Markdown remains the source of truth.`

---

## OAR B Governance Mode

When OAR B readiness files are detected (e.g. `delivery-ledger.md` and `product-coverage-matrix.md`), the OAR B adapter activates automatically. It enforces strict guardrails:
- **P0** is CLOSED unless Markdown evidence proves otherwise.
- **P1** is OPEN unless Markdown evidence proves otherwise.
- **ENGINE_COMPLETE** is not declared unless explicitly written in the delivery ledger.
- Verified P1 children must include **087, 088, and 089**.
- Feature **090** is never marked Verified unless its phase-exit and ledger both prove it.
- **P1 Blockers** include `client-notification-plumbing`, `entitlement-concurrency-and-quota`, `support-tickets-decision`, and D1-D4 decision status.

If the parsed state contradicts any of these guardrails, warnings or errors are raised.

---

## Supported Artifacts

- **Vanilla SpecKit:**
  - `.specify/memory/constitution.md`
  - `.specify/feature.json`
  - `specs/*/spec.md`
  - `specs/*/plan.md`
  - `specs/*/tasks.md`
  - `specs/*/checklists/*.md`
- **Contracts & Evidence:**
  - `specs/*/contracts/**`
  - `specs/*/openapi/**`
  - `specs/*/evidence/**`
  - `specs/*/reports/**`
- **OAR B Governance:**
  - `specs/069-production-readiness-program/delivery-ledger.md`
  - `specs/069-production-readiness-program/product-coverage-matrix.md`
  - `specs/**/decisions/*.md`
