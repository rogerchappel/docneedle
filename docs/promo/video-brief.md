# Video Brief: Pack Local Docs For Agent Handoff

## Angle

Show how `docneedle` turns scattered local docs into a small source-linked context pack without telemetry, accounts, or a background indexer.

## Grounded Demo Assets

- Demo workspace: `examples/team-runbook-workspace`
- Existing example pack: `examples/agent-pack.md`
- Tutorial: `docs/tutorials/pack-release-context.md`
- Existing test fixture: `test/fixtures/agent-workspace`

## 60-Second Flow

1. Run `node ./bin/docneedle.js inspect examples/team-runbook-workspace --output .tmp/docneedle-release-demo`.
2. Run `node ./bin/docneedle.js search examples/team-runbook-workspace release escalation --limit 3`.
3. Run `node ./bin/docneedle.js pack examples/team-runbook-workspace --query "release escalation" --output .tmp/docneedle-release-demo/release-pack.md`.
4. Open the generated pack and point out that snippets are tied back to local source files.
5. Mention the safety boundary from the README: explicit writes only, text-focused scanning, and no hidden network calls.

## Claims To Avoid

- Do not claim semantic search or model ranking; this is a tiny local search engine.
- Do not claim the generated pack is a secret scrubber.
- Do not claim hosted collaboration features.

## Short Hooks

- "Before dumping a whole repo into an agent, make a small source-linked doc pack."
- "Search local runbooks and export only the context needed for handoff."
- "A boring local docs map for the moment before grep is enough."
