# Architecture

`CLI → discovery → adapters → normalization → validators → snapshot → UI`

The CLI reads an external `--project-root`. Discovery inventories supported files; adapters parse Markdown into fragments; normalizers create a stable model; validators produce diagnostics; the snapshot serializes that model deterministically; the UI renders the snapshot. There is no database, backend state store, or lifecycle mutation.
