# Contributing

Thanks for helping improve SpecKit Governance Dashboard. Use a focused branch name such as `codex/docs-read-only-model` or `fix/ledger-parser`.

## Local setup

```bash
npm install
npm run typecheck
npm test
npm run build
npm run demo:generate
```

Keep changes small, typed, and covered by tests. `npm run lint` currently runs the TypeScript check.

## Adapters and fixtures

Adapters may discover and normalize Markdown, but must never alter the target project or treat JSON as authoritative. Add generic synthetic fixtures under `tests/fixtures/` or `examples/`; never add customer repositories, secrets, absolute private paths, or real generated snapshots. Verify deterministic output by generating twice with `--deterministic`.

## Read-only rule

Do not introduce lifecycle writes, source-file rewrites, databases, or mutable state stores. Markdown artifacts are the source of truth; dashboard JSON is derived cache only.
