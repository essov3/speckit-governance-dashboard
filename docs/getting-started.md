# Getting started

The dashboard ships as a single npm package, `speckit-governance-dashboard`. It installs two equivalent commands: `speckit-governance-dashboard` and the shorter alias `speckit-dashboard`.

Node.js 18 or later is required.

## Install

### Run without installing (npx)

One-off runs download the package on demand:

```sh
npx speckit-governance-dashboard doctor --project-root ../my-speckit-project
npx speckit-governance-dashboard generate --project-root ../my-speckit-project --deterministic
npx speckit-governance-dashboard watch --project-root ../my-speckit-project
```

### Install globally (recommended for everyday use)

```sh
npm install --global speckit-governance-dashboard
```

Verify the installation:

```sh
speckit-dashboard --version
speckit-dashboard --help
```

Then point any command at the SpecKit project you want to inspect:

```sh
speckit-dashboard doctor --project-root ../my-speckit-project
speckit-dashboard watch --project-root ../my-speckit-project
```

`--project-root` is the local SpecKit project being analyzed — not the dashboard package. The CLI only reads that project; it never modifies Markdown artifacts or lifecycle state.

## Commands

### `doctor` — check project structure

Reports folder structure, file health, and whether the target looks like a valid SpecKit repository.

```sh
speckit-dashboard doctor --project-root ../my-speckit-project
```

### `generate` — write the snapshot cache

Discovers, parses, and validates SpecKit artifacts, then writes a derived JSON snapshot. By default the snapshot lands in `.dashboard-cache/<project>/project-status.json` under the current working directory — never inside the target project.

```sh
speckit-dashboard generate --project-root ../my-speckit-project --deterministic
```

| Option | Description |
| --- | --- |
| `-p, --project-root <path>` | Path to the target SpecKit project root |
| `-o, --out <path>` | Explicit output snapshot path |
| `-d, --deterministic` | Stabilize the `generatedAt` timestamp for repeatable output |
| `-a, --adapter <mode>` | Discovery mode: `auto` (default), `vanilla`, or `governance` |
| `-i, --include-unknown` | Include unknown artifacts in the index |
| `--pretty` | Pretty-print the snapshot JSON |
| `-q, --quiet` | Suppress console output |

### `check` — validate and detect staleness

Validates the live Markdown view and, with `--snapshot`, compares it against an existing snapshot to detect stale cache. Useful in CI.

```sh
speckit-dashboard check --project-root ../my-speckit-project --deterministic
```

| Option | Description |
| --- | --- |
| `-p, --project-root <path>` | Path to the target SpecKit project root |
| `-s, --snapshot <path>` | Existing snapshot JSON to compare against |
| `--strict` | Escalate ambiguous parses to errors |
| `--fail-on-warning` | Exit non-zero if warnings exist |
| `-d, --deterministic` | Deterministic generation mode |
| `-a, --adapter <mode>` | Discovery mode: `auto`, `vanilla`, or `governance` |

### `serve` — dashboard UI with live updates

Generates a snapshot, starts a local read-only dashboard at `http://localhost:5173`, and watches `specs/**` and `.specify/**`. Relevant source changes are batched, the snapshot is regenerated atomically, and the open browser view refreshes automatically. See the [live updates guide](/live-updates).

```sh
speckit-dashboard serve --project-root ../my-speckit-project
```

| Option | Description |
| --- | --- |
| `-p, --project-root <path>` | Path to the target SpecKit project root |
| `--port <number>` | Server port (default `5173`) |
| `--host <host>` | Server host (default `localhost`) |
| `--open` | Open the dashboard in the default browser |
| `--no-watch` | Serve a fixed snapshot without source watching |
| `--watch-debounce <ms>` | Batch window for rapid changes (default `250`) |
| `-d, --deterministic` | Deterministic snapshot timestamp |

### `watch` — explicit live mode

An explicit alias for `serve` with live updates always enabled. It accepts the same port, host, open, and debounce options.

```sh
speckit-dashboard watch --project-root ../my-speckit-project --watch-debounce 500
```

## Resolving the project root

Every command resolves the target project in this order:

1. The `--project-root` flag
2. The `SPECKIT_PROJECT_ROOT` environment variable
3. `projectRoot` in a `speckit-dashboard.config.json` file in the current working directory
4. The current working directory itself

So inside a SpecKit repository you can simply run `speckit-dashboard watch` with no arguments.

## Optional config file

A `speckit-dashboard.config.json` in the working directory can hold defaults, so repeated runs need no flags:

```json
{
  "projectRoot": "../my-speckit-project",
  "adapter": "auto",
  "output": ".dashboard-cache/my-project/project-status.json",
  "strict": false
}
```

The config may only contain input settings. Lifecycle or governance state (gates, decisions, approvals, statuses) is rejected — Markdown remains the source of truth.

## Exit codes

Useful for CI pipelines built on `generate` and `check`:

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Validation failed, or a mutation guard tripped |
| `2` | Project root could not be resolved |
| `3` | Snapshot is stale or differs from the live view (`check`) |
| `4` | Unexpected execution error |

## Working from a clone

The published package contains only the runtime files. For the synthetic demo projects or development, clone the repository — the same five commands are exposed as npm scripts with the `dashboard:` prefix:

```sh
git clone https://github.com/essov3/speckit-governance-dashboard.git
cd speckit-governance-dashboard
npm install
npm run build
npm run dashboard:doctor -- --project-root ./examples/vanilla-speckit-demo
npm run dashboard:generate -- --project-root ./examples/vanilla-speckit-demo --deterministic
npm run dashboard:watch -- --project-root ./examples/vanilla-speckit-demo
```

The `--` separates npm's own arguments from the CLI's arguments and is required.
