# Full governance demo

This fictional project exercises the dashboard’s broadest artifact set: feature specifications, plans, tasks, checklists, contracts, evidence, phase exits, decisions, coverage, gates, activity, diagnostics, and artifact inventory.

Run it with `npm run demo:full:generate` and open it with `npm run demo:full:serve`. The dashboard is read-only: Markdown is authoritative and the generated JSON snapshot is cache only.

Intentional signals: feature 003 is awaiting phase-exit preparation, feature 004 is active with an incomplete checklist and a referenced-but-missing evidence file, and decisions D3/D4 remain pending. These public-safe warnings and blockers make the dashboard’s diagnostics visible without making the demo check fail.
