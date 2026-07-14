# Release checklist

Before publishing the initial public release:

- [x] Set GitHub owner links to `essov3`.
- [ ] Create the GitHub repository and confirm its description and topics.
- [ ] Verify `speckit-governance-dashboard` is available on npm.
- [ ] Confirm the short `speckit-dashboard` CLI alias is available after installation.
- [ ] Confirm `watch` and default `serve` mode regenerate after add/change/delete events under `specs/**` and `.specify/**`.
- [ ] Confirm the browser receives a snapshot event and refreshes data without losing the active view.
- [ ] Confirm custom snapshot output inside a watched directory does not create a refresh loop.
- [ ] Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run docs:build`.
- [ ] Run the private-data scan and review all matches.
- [ ] Run `npm pack --dry-run` and review every included file.
- [ ] Regenerate and review screenshots with `npm run demo:screenshots`; use the full synthetic demo only.
- [ ] Deploy `docs/.vitepress/dist` and configure the `skgd.itseslam.com` custom domain if a public site is desired.
- [ ] Create the first tag: `v0.1.0`.
- [ ] Optionally publish the npm package after the GitHub release is reviewed.
