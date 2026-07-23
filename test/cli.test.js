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
  assert.match(result.stdout, /search .* \[--limit <n>\]/);
  assert.match(result.stdout, /pack .* \[--format markdown\|json\] \[--limit <n>\]/);
});

test('CLI rejects unsupported output formats', async () => {
  for (const command of ['inspect', 'pack']) {
    const result = await run([command, fixture, '--format', 'yaml']);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /--format must be one of: json, markdown/);
  }
});

test('CLI rejects limits that are not positive integers', async () => {
  for (const command of ['search', 'pack']) {
    const commandArgs = command === 'search' ? [command, fixture, 'escalation'] : [command, fixture];
    for (const limit of ['0', '-1', '1.5', 'many']) {
      const result = await run([...commandArgs, `--limit=${limit}`]);
      assert.equal(result.code, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /--limit must be a positive integer/);
    }
  }
});

test('CLI accepts documented formats and integer limits', async () => {
  const inspectJson = await run(['inspect', fixture, '--format', 'json']);
  assert.equal(inspectJson.code, 0, inspectJson.stderr);
  assert.doesNotThrow(() => JSON.parse(inspectJson.stdout));

  const inspectMarkdown = await run(['inspect', fixture, '--format', 'markdown']);
  assert.equal(inspectMarkdown.code, 0, inspectMarkdown.stderr);
  assert.match(inspectMarkdown.stdout, /^# docneedle manifest/m);

  const search = await run(['search', fixture, 'escalation', '--limit', '1', '--json']);
  assert.equal(search.code, 0, search.stderr);
  assert.equal(JSON.parse(search.stdout).hits.length, 1);

  const packJson = await run(['pack', fixture, '--format', 'json', '--limit', '1']);
  assert.equal(packJson.code, 0, packJson.stderr);
  assert.equal(JSON.parse(packJson.stdout).hits.length, 0);

  const packMarkdown = await run(['pack', fixture, '--format', 'markdown']);
  assert.equal(packMarkdown.code, 0, packMarkdown.stderr);
  assert.match(packMarkdown.stdout, /^# docneedle agent pack/m);
});
