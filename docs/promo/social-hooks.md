# Social Hook Pack

Use these as draft prompts for human-edited posts. They are grounded in the README, `examples/team-runbook-workspace`, and `docs/tutorials/pack-release-context.md`.

## Short Posts

- Before pasting a whole repo into an agent, use `docneedle` to pack a small source-linked set of local docs.
- The release-context demo searches a synthetic runbook workspace and exports a compact Markdown handoff pack.
- `docneedle` is text-focused and local-first: no account, telemetry, scraping, or background indexing daemon.

## Demo CTA

Try the local demo:

```sh
npm run build
node ./bin/docneedle.js search examples/team-runbook-workspace release escalation --limit 3
node ./bin/docneedle.js pack examples/team-runbook-workspace --query "release escalation" --output .tmp/docneedle-release-demo/release-pack.md
```

## Guardrails

- Say "ranked local snippets" instead of "semantic search."
- Do not imply the generated pack scrubs secrets.
- Keep the focus on explicit local files and source-linked handoff context.
