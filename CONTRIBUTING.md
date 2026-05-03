# Contributing

Thanks for helping make `docneedle` sharper. The project values small, reviewable changes that keep the tool local-first and easy to trust.

## Development

```sh
npm install
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Good first changes

- Improve fixture coverage for realistic docs/runbooks/agent-memory folders.
- Refine ranking and snippets while keeping results deterministic.
- Improve README examples or safety notes.
- Add output formats that are useful for local agent workflows.

## Guardrails

- Do not add telemetry, analytics, remote indexing, credential scraping, or surprise network calls.
- Do not include private user documents in tests.
- Keep CLI errors direct and actionable.
- Prefer standard-library code unless a dependency clearly earns its weight.

## Pull requests

Please include:

- what changed,
- why it matters,
- tests/smoke commands you ran,
- any safety or compatibility tradeoffs.
