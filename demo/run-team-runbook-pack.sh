#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="$ROOT/examples/team-runbook-workspace"
OUT="$ROOT/.tmp/demo-team-runbook-pack"

mkdir -p "$OUT"

npm run build

echo "== inspect synthetic runbook workspace =="
node "$ROOT/bin/docneedle.js" inspect "$WORKSPACE" --output "$OUT" --format markdown
sed -n '1,60p' "$OUT/docneedle-manifest.md"

echo
echo "== search for escalation context =="
node "$ROOT/bin/docneedle.js" search "$WORKSPACE" escalation --limit 2 | tee "$OUT/escalation-search.md"

echo
echo "== export agent pack =="
node "$ROOT/bin/docneedle.js" pack "$WORKSPACE" --query escalation --output "$OUT/escalation-pack.md"
sed -n '1,80p' "$OUT/escalation-pack.md"

grep -q 'Documents: 4' "$OUT/docneedle-manifest.md"
grep -q 'notes/escalation.txt' "$OUT/escalation-search.md"
grep -q 'notes/escalation.txt:1' "$OUT/escalation-pack.md"

echo
echo "Demo artifacts written to $OUT"
