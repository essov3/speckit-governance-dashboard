# Architecture

`CLI → discovery → adapters → normalization → validators → snapshot → UI`

The CLI reads an external `--project-root`. Discovery inventories supported files; adapters parse Markdown into fragments; normalizers create a stable model; validators produce diagnostics; the snapshot serializes that model deterministically; the UI renders the snapshot. There is no database, backend state store, or lifecycle mutation.

In live mode, `serve`/`watch` observes only `specs/**` and `.specify/**`. File events are debounced, then the same full deterministic pipeline rebuilds the single derived snapshot so cross-file governance relationships remain correct. The JSON replacement is atomic, and a Server-Sent Event tells the browser to fetch the new snapshot. The watcher never writes to the target project and ignores generated caches and dependency/build directories.
