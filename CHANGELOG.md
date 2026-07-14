# Changelog

## Unreleased

- Watch `specs/**` and `.specify/**` during local serving and regenerate the derived snapshot after batched changes
- Live-refresh the open dashboard through Server-Sent Events while preserving the current view
- Add an explicit `watch` command, `dashboard:watch` script, `--no-watch`, and debounce configuration
- Write refreshed snapshot JSON atomically so readers never observe partial data
- Add a live updates guide and surface automatic refresh across the public VitePress site

## 0.1.2 - Vitepress Migration

- Migrate public landing site to Vitepress docs
- Refresh documentation and command references to version 0.1.2

## 0.1.1 - Landing site refresh

- Expand the public landing page with feature details, quick start, and privacy guidance
- Embed all synthetic demo screenshots on the site gallery
- Copy screenshots into `site/dist` during `site:build` for static hosting

## 0.1.0 - Initial Public Preview

- Read-only SpecKit artifact discovery
- Deterministic snapshot generation
- Visual React dashboard
- Vanilla SpecKit adapter
- Governance adapter support
- Contracts and evidence detection
- CLI commands: generate, check, serve, doctor
