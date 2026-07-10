# API contracts plan
## Technical context
OpenAPI plus markdown webhook contract.
## Architecture
Schema files are reviewed before client work.
## Data model
Synthetic request, response, and event payloads.
## Contracts
`contracts/public-api.openapi.yaml` and `contracts/webhook-events.md`.
## Validation plan
Run contract tests and CI summary checks.
## Rollback strategy
Deprecate a contract version without changing dashboard state.
## Constitution check
Contract-first delivery is satisfied.
