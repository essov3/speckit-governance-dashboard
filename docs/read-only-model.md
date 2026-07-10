# Read-only model

The target project is input only. Each command hashes discovered artifacts before and after scanning and fails if it observes a mutation. The dashboard may write its own derived snapshot outside the target project by default, under `.dashboard-cache/` in the dashboard working directory.

The dashboard never writes lifecycle state, rewrites Markdown, or uses a database. Markdown remains the source of truth.
