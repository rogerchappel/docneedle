# Security Policy

`docneedle` is intentionally local-first. It should not make network calls, collect telemetry, read credentials, or publish generated output without an explicit user action.

## Supported versions

The project is pre-1.0. Security fixes target the latest `main` branch until tagged releases begin.

## Reporting a vulnerability

Please do not open a public issue with private documents, credentials, generated packs, or exploit details.

Instead, contact the repository owner privately through GitHub. Include:

- the affected version or commit,
- the command you ran,
- the smallest safe reproduction you can share,
- whether private file content could be exposed.

## Security expectations for contributors

- No hidden network calls or telemetry.
- No credential discovery features.
- No automatic publishing or uploading.
- Keep file scanning allowlisted to text-like documentation formats unless a change has clear tests and safety notes.
- Prefer fixtures over real private documents in tests and issues.
