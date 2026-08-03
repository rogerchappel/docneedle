import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildManifest, publicManifest } from '../dist/index.js';

const fixture = new URL('fixtures/agent-workspace', import.meta.url).pathname;

test('buildManifest indexes markdown and text fixtures deterministically', async () => {
  const manifest = await buildManifest({ root: fixture });
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.stats.documents, 4);
  assert.deepEqual(manifest.documents.map((doc) => doc.path), [
    'docs/architecture.mdx',
    'docs/runbook.md',
    'memory/2026-05-04.md',
    'notes/onboarding.txt'
  ]);
  assert.equal(manifest.documents.find((doc) => doc.path === 'docs/runbook.md')?.title, 'Release runbook');
});

test('publicManifest removes raw content from exported manifest', async () => {
  const manifest = await buildManifest({ root: fixture });
  const exported = publicManifest(manifest);
  assert.equal('content' in exported.documents[0], false);
  assert.equal(exported.documents[0].preview.length > 0, true);
});

test('buildManifest extracts ATX and both Setext heading levels', async () => {
  const manifest = await buildManifest({ root: new URL('fixtures/headings', import.meta.url).pathname });
  const documents = Object.fromEntries(manifest.documents.map((document) => [document.path, document]));

  assert.deepEqual(documents['atx.md'].headings, ['ATX title', 'ATX section']);
  assert.equal(documents['atx.md'].title, 'ATX title');
  assert.deepEqual(documents['setext-h1.md'].headings, ['Setext title', 'Details']);
  assert.equal(documents['setext-h1.md'].title, 'Setext title');
  assert.deepEqual(documents['setext-h2.md'].headings, ['Secondary title', 'Next section']);
  assert.equal(documents['setext-h2.md'].title, 'Secondary title');
});
