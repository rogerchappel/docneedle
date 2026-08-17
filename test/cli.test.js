import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

async function waitFor(check, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('timed out waiting for watched manifest rebuild');
}

test('CLI search emits JSON hits for fixture query', async () => {
  const result = await run(['search', fixture, 'escalation', '--json']);
  assert.equal(result.code, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.hits[0].path, 'docs/runbook.md');
});

test('CLI search matches whole tokens and normalizes duplicate terms', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'docneedle-cli-token-search-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  await fs.writeFile(path.join(temp, 'guide.md'), '# Guide\neducation release\n');

  const substring = await run(['search', temp, 'cat', '--json']);
  const single = await run(['search', temp, 'release', '--json']);
  const duplicate = await run(['search', temp, 'release', 'release', '--json']);
  assert.equal(substring.code, 0, substring.stderr);
  assert.equal(JSON.parse(substring.stdout).hits.length, 0);
  assert.equal(JSON.parse(duplicate.stdout).hits[0].score, JSON.parse(single.stdout).hits[0].score);
  assert.match(JSON.parse(single.stdout).hits[0].snippet, /education release/);
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

test('CLI pack excludes an in-root output on first and repeated runs', async (t) => {
  for (const format of ['markdown', 'json']) {
    await t.test(format, async () => {
      const temp = await fs.mkdtemp(path.join(os.tmpdir(), `docneedle-pack-${format}-`));
      t.after(() => fs.rm(temp, { recursive: true, force: true }));
      await fs.writeFile(path.join(temp, 'source.md'), '# Source\nneedle source\n');

      const filename = format === 'json' ? 'pack.json' : 'pack.md';
      const output = path.join(temp, 'generated', filename);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, 'needle stale output\n');
      const normalizedArgument = path.join(temp, '.', 'generated', '..', 'generated', filename);

      for (let invocation = 0; invocation < 2; invocation += 1) {
        const result = await run(['pack', temp, '--query', 'needle', '--format', format, '--output', normalizedArgument]);
        assert.equal(result.code, 0, result.stderr);
        const body = await fs.readFile(output, 'utf8');
        const pack = format === 'json' ? JSON.parse(body) : body;
        if (format === 'json') {
          assert.deepEqual(pack.manifest.documents.map((document) => document.path), ['source.md']);
          assert.deepEqual(pack.hits.map((hit) => hit.path), ['source.md']);
        } else {
          assert.doesNotMatch(pack, /generated\/pack\.md/);
          assert.match(pack, /source\.md/);
        }
      }
    });
  }
});

test('CLI pack continues to index an output located outside the root', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'docneedle-pack-outside-'));
  const root = path.join(temp, 'workspace');
  const output = path.join(temp, 'pack.json');
  await fs.mkdir(root);
  await fs.writeFile(path.join(root, 'source.md'), '# Source\nneedle source\n');
  t.after(() => fs.rm(temp, { recursive: true, force: true }));

  const result = await run(['pack', root, '--query', 'needle', '--format', 'json', '--output', output]);
  assert.equal(result.code, 0, result.stderr);
  const pack = JSON.parse(await fs.readFile(output, 'utf8'));
  assert.deepEqual(pack.manifest.documents.map((document) => document.path), ['source.md']);
  assert.deepEqual(pack.hits.map((hit) => hit.path), ['source.md']);
});

test('CLI watch rebuilds the requested output format at the original path', async (t) => {
  for (const format of ['json', 'markdown']) {
    await t.test(format, async (t) => {
      const temp = await fs.mkdtemp(path.join(os.tmpdir(), `docneedle-watch-${format}-`));
      const output = path.join(temp, '.docneedle', 'nested');
      const outputArgument = format === 'json' ? path.join('.docneedle', '.', 'nested') : output;
      const document = path.join(temp, 'guide.md');
      await fs.writeFile(document, '# Initial title\n');

      const child = spawn(process.execPath, [new URL('../bin/docneedle.js', import.meta.url).pathname, 'inspect', '.', '--output', outputArgument, '--format', format, '--watch'], {
        cwd: temp
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      t.after(async () => {
        child.kill();
        await fs.rm(temp, { recursive: true, force: true });
      });

      const extension = format === 'markdown' ? 'md' : 'json';
      const manifestPath = path.join(output, `docneedle-manifest.${extension}`);
      await waitFor(() => stdout.includes('Watching for changes'));
      await fs.writeFile(document, '# Rebuilt title\n');
      await waitFor(() => stdout.includes('Rebuilt 1 documents'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      const body = await fs.readFile(manifestPath, 'utf8');
      if (format === 'json') {
        assert.equal(JSON.parse(body).documents[0].title, 'Rebuilt title');
      } else {
        assert.match(body, /^# docneedle manifest/m);
        assert.match(body, /Rebuilt title/);
      }
      assert.deepEqual(await fs.readdir(output), [`docneedle-manifest.${extension}`]);
      assert.equal(stdout.match(/Rebuilt 1 documents/g)?.length, 1, stdout);
      assert.equal(stderr, '');
    });
  }
});

test('CLI rejects watch without an output directory before watching for changes', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'docneedle-watch-no-output-'));
  const document = path.join(temp, 'guide.md');
  await fs.writeFile(document, '# Initial title\n');
  t.after(() => fs.rm(temp, { recursive: true, force: true }));

  const result = await run(['inspect', temp, '--watch']);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /inspect --watch requires --output <dir>/);

  await fs.writeFile(document, '# Changed after rejection\n');
  assert.equal(result.stdout, '');
});

test('CLI accepts space-separated and inline values for every value option', async () => {
  const inspect = await run(['inspect', fixture, '--format=markdown']);
  assert.equal(inspect.code, 0, inspect.stderr);
  assert.match(inspect.stdout, /^# docneedle manifest/m);

  const search = await run(['search', fixture, 'escalation', '--limit=1', '--json']);
  assert.equal(search.code, 0, search.stderr);
  assert.equal(JSON.parse(search.stdout).hits.length, 1);

  const pack = await run(['pack', fixture, '--query=onboarding', '--format', 'json', '--limit=1']);
  assert.equal(pack.code, 0, pack.stderr);
  assert.equal(JSON.parse(pack.stdout).query, 'onboarding');
});

test('CLI rejects options that do not belong to the selected command', async () => {
  for (const args of [
    ['inspect', fixture, '--json'],
    ['search', fixture, 'escalation', '--output', 'result.json'],
    ['pack', fixture, '--watch'],
    ['search', fixture, 'escalation', '--bogus']
  ]) {
    const result = await run(args);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /unknown option .* for (inspect|search|pack)/);
  }
});

test('CLI rejects duplicate options', async () => {
  for (const args of [
    ['inspect', fixture, '--format', 'json', '--format=markdown'],
    ['search', fixture, 'escalation', '--json', '--json'],
    ['pack', fixture, '--limit=1', '--limit', '2']
  ]) {
    const result = await run(args);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /option --\w+ may only be specified once/);
  }
});

test('CLI rejects values for boolean options and missing values for value options', async () => {
  for (const args of [
    ['inspect', fixture, '--watch=true'],
    ['search', fixture, 'escalation', '--json', 'true'],
    ['pack', fixture, '--query'],
    ['search', fixture, 'escalation', '--limit=']
  ]) {
    const result = await run(args);
    assert.equal(result.code, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /(does not take a value|requires a value)/);
  }
});
