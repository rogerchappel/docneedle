# docneedle

A tiny local search engine for project docs, notes, runbooks, and agent memory folders.

`docneedle` gives developers and coding agents a fast map of local Markdown/text files without telemetry, indexing daemons, accounts, or surprise network calls. Point it at a repo, search the text, and export a compact agent pack when a full context dump would be too noisy.

## Why

Modern repos hide important instructions across `docs/`, `README.md`, `.github/`, runbooks, and agent memory folders. `grep` is great when you know the exact word; `docneedle` is for the moment before that: inspect what exists, find ranked snippets, and hand an agent a small source-linked pack.

## Install

```sh
npm install -g docneedle
```

For local development from this repository:

```sh
npm install
npm run build
node ./bin/docneedle.js --help
```

## Quickstart

```sh
# Build a manifest of local docs and notes
docneedle inspect . --output .docneedle

# Search local docs with ranked snippets
docneedle search . "release escalation" --limit 5

# Export a compact Markdown pack for an agent
docneedle pack . --query "onboarding checklist" --output .docneedle/onboarding-pack.md
```

## Commands

### `inspect <dir>`

Scans Markdown-like local files (`.md`, `.mdx`, `.txt`, `.rst`, `.adoc`) and writes a manifest.

```sh
docneedle inspect ./test/fixtures/agent-workspace --format markdown
docneedle inspect ./docs --output .docneedle
```

Use `--watch` to rebuild the manifest when files change. The watcher stays local and only writes the manifest path you requested.

### `search <dir> <query...>`

Builds an in-memory index and prints ranked snippets.

```sh
docneedle search ./docs "branch protection" --json
```

### `pack <dir>`

Exports a compact context pack for agent handoff.

```sh
docneedle pack . --query "release checklist" --output release-pack.md
docneedle pack . --format json --output release-pack.json
```

## Safety boundaries

- Local-first: no hidden network calls, telemetry, accounts, scraping, or publishing.
- Explicit writes only: output files are created only when you pass `--output`.
- Text-focused: binary files, large files, `node_modules`, `.git`, `dist`, coverage, and temp folders are skipped.
- Content remains yours: generated manifests omit raw file content; search snippets and agent packs intentionally include only compact excerpts.

## Library API

```ts
import { buildManifest, searchManifest, buildAgentPack } from 'docneedle';

const manifest = await buildManifest({ root: './docs' });
const result = searchManifest(manifest, { query: 'onboarding', limit: 3 });
const pack = await buildAgentPack({ root: '.', query: 'release escalation' });
```

## Source note

This project was seeded as an original, renamed OSS idea inspired by the existence of adjacent documentation-search tooling, including `qmd` by Vincent Koc. It does not copy that project name or implementation; the V1 here is a deterministic local-first TypeScript CLI/library built around fixture-backed tests and agent workflow packs.

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
node ./bin/docneedle.js search test/fixtures/agent-workspace escalation --json
```

## Contributing

Small, boring, well-tested changes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Please report vulnerabilities privately using [SECURITY.md](SECURITY.md). Do not include private documents, credentials, or generated packs in public issues.

## License

MIT
