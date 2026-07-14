# Changelog

## 0.1.4 - Repaired npm package

- Ship the compiled CLI (`dist/cli`) and prebuilt dashboard UI (`dist/ui`) in the npm package again. Version 0.1.3 was published without `dist/`, so neither the `speckit-governance-dashboard` nor the `speckit-dashboard` command could be installed from it.
- Add a `prepack` script so `npm pack` and `npm publish` always build `dist/` first and can never ship an empty package again
- Report `--version` from `package.json` instead of a hardcoded string that had drifted to 0.1.2
- Move `react` and `react-dom` to devDependencies; the published UI is prebuilt, so global installs are smaller and faster
- Add a Getting Started guide covering global npm installation and the full CLI command reference to the docs site

## 0.1.3 - Live dashboard updates (broken on npm, use 0.1.4)

- Watch `specs/**` and `.specify/**` during local serving and regenerate the derived snapshot after batched changes
- Live-refresh the open dashboard through Server-Sent Events while preserving the current view
- Add an explicit `watch` command, `dashboard:watch` script, `--no-watch`, and debounce configuration
- Write refreshed snapshot JSON atomically so readers never observe partial data
- Add a live updates guide and surface automatic refresh across the public VitePress site
- Known issue: the npm tarball for this version was published without the compiled `dist/` files and cannot be used; install 0.1.4 or later

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
