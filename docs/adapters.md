# Adapters

The bundled vanilla adapter understands common SpecKit artifacts. Optional governance adapters recognize ledgers, coverage matrices, decisions, evidence, contracts, and phase exits. An adapter implements `canParse(artifact)` and `parse(input)`, returns normalized fragments and diagnostics, and must be deterministic and read-only.

To add one, create an adapter in `src/core/adapters`, register it in `build-snapshot.ts`, add synthetic fixtures and tests, and document its artifact conventions. Do not encode customer-specific policy or private names in the public default adapter set.
