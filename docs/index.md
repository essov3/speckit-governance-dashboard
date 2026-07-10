---
layout: home
titleTemplate: false

hero:
  name: SpecKit Governance Dashboard
  text: See Spec Kit project health without touching the Markdown
  tagline: A Markdown-first visual dashboard for repositories created with or compatible with GitHub Spec Kit. Scan artifacts, generate a deterministic derived snapshot, and understand readiness, gates, evidence, and risks — without changing the project.
  image:
    src: /screenshots/overview.png
    alt: Dashboard executive overview showing feature progress, validation health, readiness gates, and snapshot metadata
  actions:
    - theme: brand
      text: View on GitHub
      link: https://github.com/essov3/speckit-governance-dashboard
    - theme: alt
      text: Get started
      link: '#quick-start'

features:
  - icon: 📄
    title: Markdown stays authoritative
    details: Specs, plans, tasks, checklists, contracts, and ledgers stay in git. The dashboard never writes lifecycle state back into the project.
  - icon: 📁
    title: External project support
    details: Use --project-root against any local SpecKit tree — your monorepo, a clone, or the included synthetic demos.
  - icon: 🔌
    title: Adapter-based parsing
    details: Vanilla SpecKit discovery works out of the box. Optional governance adapters surface ledgers, decisions, coverage matrices, and phase exits.
  - icon: 🔁
    title: Deterministic snapshots
    details: Stable JSON output supports repeatable CI checks, stale-cache detection, and consistent local review.
  - icon: ✅
    title: Validation with diagnostics
    details: Contracts, evidence links, phase exits, and lifecycle consistency produce clear errors and warnings — strict mode fails ambiguous parses.
  - icon: 🖥️
    title: Local visual UI
    details: Serve a read-only UI for overview, features, gates, evidence, decisions, coverage, risks, activity, and artifact inventory.
---

## What you can see

Screenshots below are generated exclusively from the fictional `full-governance-demo`. They are safe to publish and illustrate every major board. Generate the full set locally with `npm run demo:screenshots`.

### Executive overview

Project type, feature counts, verification status, validation health, current spec state, and readiness gates in one place.

![Executive overview with feature progress ring, validation health bars, current spec state, and readiness gates](/screenshots/overview.png)

### Feature tracker

Lifecycle and task progress per feature folder, with artifact chips and next actions.

![Feature tracker table with status badges, artifact chips, progress bars, and next actions](/screenshots/feature-tracker.png)

### Phase gate board

Readiness gates derived from delivery ledgers, with blockers and source links.

![Phase gate board showing P0 through P4 readiness gates with blockers and required children](/screenshots/gate-board.png)

### Decision board

Open and resolved decisions from decision-record Markdown.

![Decision board listing open and resolved product decisions](/screenshots/decision-board.png)

### Evidence health

Present, missing, and referenced evidence for verification confidence.

![Evidence health view showing present and missing evidence links](/screenshots/evidence-health.png)

### Coverage matrix

Product coverage rows normalized from matrix Markdown.

![Product coverage matrix mapping capabilities to implementation status](/screenshots/coverage-matrix.png)

### Risks & blockers

Aggregated risks that prevent gate closure or feature verification.

![Risks and blockers board highlighting open issues](/screenshots/risks-blockers.png)

### Activity feed

Recent governance-relevant activity inferred from artifact state.

![Activity feed of recent governance-relevant artifact changes](/screenshots/activity-feed.png)

### Artifact inventory

Every discovered file classified by role for auditability.

![Artifact inventory listing discovered SpecKit files by role](/screenshots/artifact-inventory.png)

## How it works

A single local pipeline turns Markdown into a visual dashboard. Nothing is mutated in the target project.

`CLI → Discovery → Adapters → Normalization → Validators → Snapshot → UI`

**What it scans**

- `.specify/feature.json`, constitutions, and feature folders
- `spec.md`, `plan.md`, `tasks.md`, checklists
- Contracts (OpenAPI, Markdown) and evidence files
- Phase exits, decision records, delivery ledgers
- Product coverage matrices and related governance Markdown

**What it is not**

- **Not a PM backend** — no database or workflow engine.
- **Not a Markdown editor** — it never rewrites your specs.
- **Not lifecycle mutation** — gates and features stay unchanged.
- **Not official GitHub Spec Kit** — independent companion project.

## Quick start

Install the package to use the dashboard on your own SpecKit project, or clone the repo for demos and development.

### From npm (Recommended)

```sh
npx speckit-governance-dashboard@0.1.1 doctor --project-root ../my-speckit-project
npx speckit-governance-dashboard@0.1.1 generate --project-root ../my-speckit-project --deterministic
npx speckit-governance-dashboard@0.1.1 serve --project-root ../my-speckit-project

# or install globally
npm install --global speckit-governance-dashboard@0.1.1
speckit-dashboard serve --project-root ../my-speckit-project
```

`--project-root` is the SpecKit project being analyzed — not the dashboard repository. The published npm package intentionally excludes repository examples.

### From a clone (For development/demos)

```sh
git clone https://github.com/essov3/speckit-governance-dashboard.git
cd speckit-governance-dashboard
npm install
npm run build
npm run dashboard:generate -- --project-root ./examples/vanilla-speckit-demo --deterministic
npm run dashboard:serve -- --project-root ./examples/vanilla-speckit-demo
```

### Full governance demo

```sh
npm run demo:full:generate
npm run demo:full:check
npm run demo:full:serve
npm run demo:screenshots
```

The full demo covers contracts, phase exits, coverage, decisions, evidence health, blockers, activity, and artifact inventory.

## Privacy and security

> **Review before publishing.** Snapshots can contain paths, feature names, diagnostics, and parser excerpts. Do not publish a snapshot from a private repository without reviewing and sanitizing it. Public screenshots and demos use only fictional Markdown artifacts.

The dashboard reads local files only. Keep secrets out of fixtures, issues, screenshots, and generated snapshots. See [SECURITY.md](https://github.com/essov3/speckit-governance-dashboard/blob/main/SECURITY.md) and the [read-only model](/read-only-model).
