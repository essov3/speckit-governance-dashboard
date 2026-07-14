---
title: Live updates
description: Watch SpecKit source files, regenerate the derived snapshot, and refresh the local dashboard automatically.
---

# Live updates

The local dashboard can follow a SpecKit project while you work. When a relevant source file changes, it regenerates the derived snapshot and updates the open browser view without a manual reload or server restart.

## Start live mode

Use the explicit `watch` command:

```bash
npx speckit-governance-dashboard watch --project-root ../my-speckit-project
```

From a cloned checkout:

```bash
npm run dashboard:watch -- --project-root ../my-speckit-project
```

`serve` also enables source watching by default, so existing local workflows gain live updates automatically:

```bash
speckit-dashboard serve --project-root ../my-speckit-project
```

## What is watched

The watcher observes the source locations used by the default discovery pipeline:

- `specs/**`
- `.specify/**`

It reacts to added, changed, and deleted files. Dependency folders, build output, git internals, coverage, and `.dashboard-cache` are ignored. If snapshot output is explicitly configured inside a watched directory, that JSON file and its temporary atomic-write file are also ignored to prevent a self-triggered refresh loop.

## Update flow

1. The watcher receives a relevant file-system event.
2. Rapid events from one editor save are collected during a short debounce window.
3. The dashboard runs the complete discovery, parsing, normalization, and validation pipeline.
4. The single derived snapshot JSON is replaced atomically.
5. The local server emits a Server-Sent Event.
6. The browser fetches the new snapshot and updates the current view in place.

The full snapshot is recalculated because gates, evidence, decisions, and coverage can depend on more than one source file. Generation is only triggered by relevant changes, and the only file written by live mode is the derived snapshot—not the SpecKit sources.

## Controls

Disable watching when you need a fixed snapshot:

```bash
speckit-dashboard serve --project-root ../my-speckit-project --no-watch
```

Change the batching window from the 250 ms default:

```bash
speckit-dashboard watch --project-root ../my-speckit-project --watch-debounce 500
```

The refresh button in the local UI can pause or resume browser updates. Disabling it does not mutate the project; the server can continue maintaining its derived snapshot.

## Local feature, static documentation

Live updates belong to the local dashboard server because it needs read access to your local project. The public documentation site at `skgd.itseslam.com` is static and never reads or watches a visitor's files.

The same privacy rule still applies: generated snapshots may contain paths, feature names, diagnostics, and source excerpts. Review and sanitize a snapshot before publishing it.
