# Validation rules

Errors identify contradictory declared state, such as a closed gate with unverified required children or a verified coverage row with no evidence. Warnings identify incomplete signals, such as unreferenced contracts. `dashboard:check` fails on errors; add `--fail-on-warning` when warnings should also fail CI. Strict mode upgrades ambiguous parsing diagnostics.

Snapshot comparison detects stale generated cache when an artifact hash differs.
