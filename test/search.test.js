import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAgentPack, buildManifest, renderPackMarkdown, searchManifest, tokenize } from '../dist/index.js';

const fixture = new URL('fixtures/agent-workspace', import.meta.url).pathname;

test('tokenize normalizes useful query terms', () => {
  assert.deepEqual(tokenize('Release escalation!'), ['release', 'escalation']);
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
