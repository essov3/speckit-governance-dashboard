# Snapshot schema

`project-status.json` is a generated view with a schema version, generator metadata, project summary, artifact inventory, normalized features/gates/decisions/evidence, and validation diagnostics. Artifact paths and hashes originate from the target project. With `--deterministic`, object ordering and timestamp are stable for unchanged inputs.

Generated JSON is derived cache only. It never becomes the source of truth.
