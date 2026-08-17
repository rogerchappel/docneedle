import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { buildAgentPack, buildManifest, renderPackMarkdown, searchManifest, tokenize } from '../dist/index.js';

const fixture = new URL('fixtures/agent-workspace', import.meta.url).pathname;

test('tokenize normalizes useful query terms', () => {
  assert.deepEqual(tokenize('Release escalation!'), ['release', 'escalation']);
});

test('search uses whole tokens and ignores duplicate query terms', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'docneedle-token-search-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  await fs.writeFile(path.join(temp, 'guide.md'), '# Guide\neducation release\n');
  const manifest = await buildManifest({ root: temp });
  const single = searchManifest(manifest, { query: 'release' });
  const duplicate = searchManifest(manifest, { query: 'release release' });

  assert.deepEqual(duplicate.hits, single.hits);
  assert.equal(searchManifest(manifest, { query: 'cat' }).hits.length, 0);
});

test('search ranks multi-term token matches and selects a matching snippet', async () => {
  const manifest = await buildManifest({ root: fixture });
  const result = searchManifest(manifest, { query: 'fixture smoke' });

  assert.equal(result.hits[0].path, 'docs/runbook.md');
  assert.match(result.hits[0].snippet, /fixture smoke fails/);
});

test('searchManifest returns scored snippets and paths', async () => {
  const manifest = await buildManifest({ root: fixture });
  const result = searchManifest(manifest, { query: 'escalation smoke', limit: 2 });
  assert.equal(result.hits.length, 2);
  assert.equal(result.hits[0].path, 'docs/runbook.md');
  assert.match(result.hits[0].snippet, /fixture smoke fails/);
});

test('buildAgentPack creates compact markdown context', async () => {
  const pack = await buildAgentPack({ root: fixture, query: 'onboarding' });
  const markdown = renderPackMarkdown(pack);
  assert.equal(pack.manifest.documents.length, 4);
  assert.match(markdown, /docneedle agent pack/);
  assert.match(markdown, /notes\/onboarding.txt/);
});

test('buildAgentPack forwards normalized exact path exclusions', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'docneedle-library-pack-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  await fs.writeFile(path.join(temp, 'source.md'), '# Source\nneedle source\n');
  await fs.writeFile(path.join(temp, 'pack.md'), '# Old pack\nneedle generated\n');

  const pack = await buildAgentPack({
    root: temp,
    query: 'needle',
    excludePaths: [path.join(temp, '.', 'nested', '..', 'pack.md')]
  });

  assert.deepEqual(pack.manifest.documents.map((document) => document.path), ['source.md']);
  assert.deepEqual(pack.hits.map((hit) => hit.path), ['source.md']);
});
