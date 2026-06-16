# Demo Thread Draft

Use this as a short launch-support thread for the synthetic team runbook demo.

## Thread

1. Project docs are rarely in one place. `docneedle` gives agents and maintainers a local-first way to inspect, search, and pack Markdown/text context without a daemon or account.
2. The demo workspace is public and synthetic: `examples/team-runbook-workspace` has onboarding notes, a release checklist, and an escalation text file.
3. Run `bash demo/run-team-runbook-pack.sh` to build a manifest, search for escalation context, and export a compact Markdown pack for handoff.
4. The generated pack points back to source files like `notes/escalation.txt:1`, so reviewers can trace every snippet instead of trusting an unsourced context dump.

## Clip Outline

- Open the synthetic workspace tree.
- Run `bash demo/run-team-runbook-pack.sh`.
- Show `.tmp/demo-team-runbook-pack/docneedle-manifest.md`.
- Show `.tmp/demo-team-runbook-pack/escalation-pack.md`.
- End on the local-first boundary: reads local docs and writes only requested output files.

## Guardrails

- Do not describe the synthetic workspace as real user data.
- Do not claim semantic search, embeddings, telemetry, or background indexing.
- Keep the story centered on local text files, ranked snippets, and source-linked packs.
