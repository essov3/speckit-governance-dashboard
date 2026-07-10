# Demo and deployment

Run `npm run demo:generate` for the clean synthetic demo, point commands at `examples/governance-demo` for a compact governance example, or use `examples/full-governance-demo` for the public visual demo. The full demo includes specifications, plans, tasks, checklists, contracts, evidence, phase exits, decisions, coverage, gates, risks, and activity. Its intentional warnings are documented in its README.

## Use the npm package

After `speckit-governance-dashboard@0.1.0` is published, use it against your own local SpecKit project. The npm package intentionally excludes these repository-only examples.

```bash
npx speckit-governance-dashboard@0.1.0 doctor --project-root ../my-speckit-project
npx speckit-governance-dashboard@0.1.0 generate --project-root ../my-speckit-project --deterministic

npm install --global speckit-governance-dashboard@0.1.0
speckit-dashboard serve --project-root ../my-speckit-project
```

`--project-root` identifies the project being read. The dashboard never modifies it.

```bash
npm run demo:full:generate
npm run demo:full:check
npm run demo:full:serve
npm run screenshots:install
npm run demo:screenshots
```

Screenshots are stored in `docs/assets/screenshots/` and use only fictional data. Never deploy or publish a snapshot from a private target project without review and sanitization.

Build the static landing site with `npm run site:build`. The intended project demo domain is `https://sgd.itseslam.com`; configure that custom domain with the selected host. For GitHub Pages deploy `site/dist`; for Vercel select Vite with build command `npm run site:build` and output `site/dist`; Netlify uses the same commands. No backend services are required.
