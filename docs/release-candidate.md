# Release candidate readiness

Status: **READY**

Generated: 2026-05-05 21:25:52 UTC

## Scope

Release-candidate readiness pass for `rogerchappel/docneedle` against `origin/main`.

## Local verification

- npm ci:pass
- release:check:pass
- validate.sh:pass
- releasebox:pass

## Blockers

- None found in local readiness gates.

## ReleaseBox check / command log

```text
\n===== npm ci =====
+ npm ci --prefix /Users/roger/Developer/my-opensource/_worktrees/docneedle-release-candidate-readiness

added 3 packages, and audited 4 packages in 397ms

found 0 vulnerabilities
EXIT_CODE=0
\n===== npm run release:check =====
+ npm --prefix /Users/roger/Developer/my-opensource/_worktrees/docneedle-release-candidate-readiness run release:check

> docneedle@0.1.0 release:check
> npm run check && npm test && npm run smoke && npm run package:smoke


> docneedle@0.1.0 check
> tsc --noEmit


> docneedle@0.1.0 test
> npm run build && node --test test/*.test.js


> docneedle@0.1.0 build
> npm run clean && tsc


> docneedle@0.1.0 clean
> node -e "require('node:fs').rmSync('dist',{recursive:true,force:true})"

✔ CLI search emits JSON hits for fixture query (65.812042ms)
✔ CLI help is friendly (61.7785ms)
✔ buildManifest indexes markdown and text fixtures deterministically (11.409458ms)
✔ publicManifest removes raw content from exported manifest (1.819ms)
✔ tokenize normalizes useful query terms (1.409125ms)
✔ searchManifest returns scored snippets and paths (10.284959ms)
✔ buildAgentPack creates compact markdown context (2.022917ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 197.285875

> docneedle@0.1.0 smoke
> npm run build && node ./bin/docneedle.js inspect test/fixtures/agent-workspace --output .tmp/smoke && node ./bin/docneedle.js search test/fixtures/agent-workspace escalation --limit 2 --json && node ./bin/docneedle.js pack test/fixtures/agent-workspace --query onboarding --output .tmp/smoke/onboarding-pack.md


> docneedle@0.1.0 build
> npm run clean && tsc


> docneedle@0.1.0 clean
> node -e "require('node:fs').rmSync('dist',{recursive:true,force:true})"

Indexed 4 documents → .tmp/smoke/docneedle-manifest.json
{
  "query": "escalation",
  "generatedAt": "2026-05-05T21:25:50.273Z",
  "root": "/Users/roger/Developer/my-opensource/_worktrees/docneedle-release-candidate-readiness/test/fixtures/agent-workspace",
  "hits": [
    {
      "path": "docs/runbook.md",
      "title": "Release runbook",
      "score": 9,
      "line": 5,
      "snippet": "## Escalation If a fixture smoke fails, escalate to the maintainer with the exact command, environment, and changed files.",
      "headings": [
        "Release runbook",
        "Escalation",
        "Safety"
      ]
    },
    {
      "path": "notes/onboarding.txt",
      "title": "Onboarding",
      "score": 5,
      "line": 5,
      "snippet": "2. Run docneedle inspect against the project docs. 3. Search for escalation before asking a human.",
      "headings": []
    }
  ]
}
Wrote agent pack → .tmp/smoke/onboarding-pack.md

> docneedle@0.1.0 package:smoke
> npm pack --dry-run

npm notice
npm notice package: docneedle@0.1.0
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 3.5kB README.md
npm notice 255B bin/docneedle.js
npm notice 377B dist/cli.d.ts
npm notice 6.3kB dist/cli.js
npm notice 6.9kB dist/cli.js.map
npm notice 382B dist/fs.d.ts
npm notice 1.8kB dist/fs.js
npm notice 2.3kB dist/fs.js.map
npm notice 401B dist/index.d.ts
npm notice 306B dist/index.js
npm notice 320B dist/index.js.map
npm notice 451B dist/indexer.d.ts
npm notice 2.9kB dist/indexer.js
npm notice 3.4kB dist/indexer.js.map
npm notice 228B dist/pack.d.ts
npm notice 556B dist/pack.js
npm notice 674B dist/pack.js.map
npm notice 296B dist/render.d.ts
npm notice 2.0kB dist/render.js
npm notice 2.5kB dist/render.js.map
npm notice 295B dist/search.d.ts
npm notice 2.6kB dist/search.js
npm notice 3.3kB dist/search.js.map
npm notice 1.1kB dist/types.d.ts
npm notice 44B dist/types.js
npm notice 102B dist/types.js.map
npm notice 1.4kB package.json
npm notice Tarball Details
npm notice name: docneedle
npm notice version: 0.1.0
npm notice filename: docneedle-0.1.0.tgz
npm notice package size: 12.5 kB
npm notice unpacked size: 45.9 kB
npm notice shasum: c1462899269531f21b08a9cb56a9646558f0e67a
npm notice integrity: sha512-vVghFC+WLR5KK[...]Hnfv5EcBbnW2g==
npm notice total files: 28
npm notice
docneedle-0.1.0.tgz
EXIT_CODE=0
\n===== bash scripts/validate.sh =====
+ bash -lc cd '/Users/roger/Developer/my-opensource/_worktrees/docneedle-release-candidate-readiness' && bash scripts/validate.sh
Checking docneedle required files...
PASS: required file exists: README.md
PASS: required file exists: AGENTS.md
PASS: required file exists: CONTRIBUTING.md
PASS: required file exists: SECURITY.md
PASS: required file exists: .github/pull_request_template.md
PASS: required file exists: scripts/validate.sh

Checking docneedle required directories...
PASS: required directory exists: .github
PASS: required directory exists: docs
PASS: required directory exists: scripts

Running local project checks where present...
NOTE: using package manager: npm

> docneedle@0.1.0 check
> tsc --noEmit

PASS: package script: check

> docneedle@0.1.0 test
> npm run build && node --test test/*.test.js


> docneedle@0.1.0 build
> npm run clean && tsc


> docneedle@0.1.0 clean
> node -e "require('node:fs').rmSync('dist',{recursive:true,force:true})"

✔ CLI search emits JSON hits for fixture query (65.814625ms)
✔ CLI help is friendly (53.654834ms)
✔ buildManifest indexes markdown and text fixtures deterministically (10.9715ms)
✔ publicManifest removes raw content from exported manifest (2.22825ms)
✔ tokenize normalizes useful query terms (1.418042ms)
✔ searchManifest returns scored snippets and paths (10.611ms)
✔ buildAgentPack creates compact markdown context (1.859542ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 184.548333
PASS: package script: test

> docneedle@0.1.0 build
> npm run clean && tsc


> docneedle@0.1.0 clean
> node -e "require('node:fs').rmSync('dist',{recursive:true,force:true})"

PASS: package script: build
NOTE: agent-qc not installed; skipping optional agent check

Validation passed.
EXIT_CODE=0
\n===== releasebox check =====
+ node /Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js check /Users/roger/Developer/my-opensource/_worktrees/docneedle-release-candidate-readiness
✅ releasebox config: node-cli
✅ ci workflow: .github/workflows/ci.yml
✅ release dry run workflow: .github/workflows/release-dry-run.yml
✅ task breakdown: docs/TASKS.md
✅ orchestration plan: docs/ORCHESTRATION.md
✅ dependabot config: .github/dependabot.yml
✅ npm test script: npm run build && node --test test/*.test.js
✅ build script: npm run clean && tsc
✅ smoke script: npm run build && node ./bin/docneedle.js inspect test/fixtures/agent-workspace --output .tmp/smoke && node ./bin/docneedle.js search test/fixtures/agent-workspace escalation --limit 2 --json && node ./bin/docneedle.js pack test/fixtures/agent-workspace --query onboarding --output .tmp/smoke/onboarding-pack.md
✅ bin entry: {"docneedle":"./bin/docneedle.js"}
EXIT_CODE=0
```
