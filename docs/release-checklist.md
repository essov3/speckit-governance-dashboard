# Release checklist

Before publishing a release:

- [ ] Bump `version` in `package.json`; `--version` output follows it automatically.
- [ ] Update `CHANGELOG.md` with a section for the new version.
- [ ] Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run docs:build`.
- [ ] Run `npm pack --dry-run` and confirm the file list includes `dist/cli/index.js` and `dist/ui/**` (the `prepack` script builds them automatically, but verify — version 0.1.3 shipped without `dist/` and was unusable).
- [ ] Install the packed tarball into a scratch prefix (`npm install -g ./speckit-governance-dashboard-<version>.tgz --prefix <tmp>`) and smoke-test `--version`, `doctor`, `generate`, and `watch` against a demo project.
- [ ] Confirm the short `speckit-dashboard` CLI alias is available after installation.
- [ ] Confirm `watch` and default `serve` mode regenerate after add/change/delete events under `specs/**` and `.specify/**`.
- [ ] Confirm the browser receives a snapshot event and refreshes data without losing the active view.
- [ ] Confirm custom snapshot output inside a watched directory does not create a refresh loop.
- [ ] Run the private-data scan and review all matches.
- [ ] Regenerate and review screenshots with `npm run demo:screenshots`; use the full synthetic demo only.
- [ ] Deploy `docs/.vitepress/dist` and configure the `skgd.itseslam.com` custom domain if a public site is desired.
- [ ] Tag the release (`v<version>`), then `npm publish`.
- [ ] After publishing, install the released version from the registry once and re-run the smoke test.
