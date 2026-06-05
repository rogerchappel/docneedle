# Pack Release Context For An Agent

This recipe uses the synthetic workspace in `examples/team-runbook-workspace` to show how `docneedle` can inspect local docs, search ranked snippets, and export a compact agent pack.

## Run The Demo

```sh
npm install
npm run build
rm -rf .tmp/docneedle-release-demo
node ./bin/docneedle.js inspect examples/team-runbook-workspace --output .tmp/docneedle-release-demo
node ./bin/docneedle.js search examples/team-runbook-workspace release escalation --limit 3
node ./bin/docneedle.js pack examples/team-runbook-workspace --query "release escalation" --output .tmp/docneedle-release-demo/release-pack.md
```

Open `.tmp/docneedle-release-demo/release-pack.md` to review the source-linked context pack.

## Why This Example Exists

The fixture has public, synthetic files only:

- `docs/release-checklist.md`
- `docs/onboarding.md`
- `notes/escalation.txt`
- `README.md`

That keeps the demo grounded in local files without copying private runbooks or agent memory.

## Suggested CI Smoke

For a lightweight documentation workflow check, keep the command read-only except for the explicit output path:

```sh
node ./bin/docneedle.js pack examples/team-runbook-workspace --query "release escalation" --output .tmp/docneedle-release-demo/release-pack.md
```
