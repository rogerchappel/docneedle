import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { test } from 'node:test';

const fixture = new URL('fixtures/agent-workspace', import.meta.url).pathname;

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['./bin/docneedle.js', ...args], { cwd: new URL('..', import.meta.url).pathname });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('CLI search emits JSON hits for fixture query', async () => {
  const result = await run(['search', fixture, 'escalation', '--json']);
  assert.equal(result.code, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.hits[0].path, 'docs/runbook.md');
});

test('CLI help is friendly', async () => {
  const result = await run(['--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /local-first search/);
});
