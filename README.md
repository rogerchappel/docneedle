# docneedle

A tiny local search engine for project docs, notes, runbooks, and agent memory folders.

`docneedle` gives developers and coding agents a fast map of local Markdown/text files without telemetry, indexing daemons, accounts, or surprise network calls. Point it at a repo, search the text, and export a compact agent pack when a full context dump would be too noisy.

## Why

Modern repos hide important instructions across `docs/`, `README.md`, `.github/`, runbooks, and agent memory folders. `grep` is great when you know the exact word; `docneedle` is for the moment before that: inspect what exists, find ranked snippets, and hand an agent a small source-linked pack.

## Install

Install the current GitHub release:

```sh
npm install -g https://github.com/rogerchappel/docneedle/releases/download/v0.1.0/docneedle-0.1.0.tgz
```

`docneedle` is distributed through [GitHub Releases](https://github.com/rogerchappel/docneedle/releases);
it is not currently published to the npm registry. For source development from a clone of
this repository instead:

```sh
npm ci
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

For a public, synthetic walkthrough, use [`examples/team-runbook-workspace`](examples/team-runbook-workspace) with [`docs/tutorials/pack-release-context.md`](docs/tutorials/pack-release-context.md).

For a one-command version of that walkthrough, run:

```sh
bash demo/run-team-runbook-pack.sh
```

It writes a manifest, search transcript, and source-linked agent pack under `.tmp/demo-team-runbook-pack/`. A promotion thread draft lives in [`docs/promo/demo-thread.md`](docs/promo/demo-thread.md).

## Commands

### `inspect <dir>`

Scans Markdown-like local files (`.md`, `.mdx`, `.txt`, `.rst`, `.adoc`) and writes a manifest.

```sh
docneedle inspect ./test/fixtures/agent-workspace --format markdown
docneedle inspect ./docs --output .docneedle
```

Use `--watch` with `--output <dir>` to rebuild the manifest when source files change. Watch mode rejects commands without `--output` because every rebuild needs a deterministic file destination. Each rebuild preserves the selected `--format` and rewrites the same `docneedle-manifest.json` or `docneedle-manifest.md` file initially created under `--output`. That generated manifest is excluded from the index and its writes do not trigger another rebuild, including when the normalized output path is inside the watched root.
The `--format` option accepts `json` or `markdown`.

### `search <dir> <query...>`

Builds an in-memory index and prints ranked snippets. Search terms match complete
Unicode letter/number/underscore/hyphen tokens, not substrings inside longer
words. Repeating a query term does not increase its score. Results are ranked by
score, then path, so identical input produces deterministic ordering.

```sh
docneedle search ./docs "branch protection" --json
```

Use `--limit <n>` with a positive integer to cap the number of results.

### `pack <dir>`

Exports a compact context pack for agent handoff.

```sh
docneedle pack . --query "release checklist" --output release-pack.md
docneedle pack . --format json --output release-pack.json
```

The `--format` option accepts `markdown` or `json`. Use `--limit <n>` with a positive integer to cap query hits in the pack.

When `--output` points inside the indexed directory, `docneedle` excludes that exact generated file from the pack's document map and query hits. This keeps repeated runs stable even when the output already exists; other files remain indexed normally. Outputs outside the indexed directory are unaffected.

Options are command-specific and may be written as either `--name value` or
`--name=value`. Unknown, repeated, missing-value, and valued boolean options
are rejected before docneedle indexes files or writes output.

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
const pack = await buildAgentPack({
  root: '.',
  query: 'release escalation',
  excludePaths: ['./agent-pack.md']
});
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

## Development

Run the same checks maintainers use before opening a PR:

```sh
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
npm run package:install-smoke
npm run release:check
```

GitHub releases must use the exact stable tag `v<package.json version>` (for example,
`v0.1.0` for version `0.1.0`). The release workflow runs
`npm run release:tag-check -- "$GITHUB_REF_NAME"` before packing or creating a
release, so missing, malformed, prerelease, and mismatched tags fail with an
actionable error.
## Contributing

Small, boring, well-tested changes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Please report vulnerabilities privately using [SECURITY.md](SECURITY.md). Do not include private documents, credentials, or generated packs in public issues.

## License

MIT
