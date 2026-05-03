import type { AgentPack, DocManifest, SearchResult } from './types.js';

export function renderManifestMarkdown(manifest: DocManifest): string {
  const lines = [
    '# docneedle manifest',
    '',
    `Generated: ${manifest.generatedAt}`,
    `Root: ${manifest.root}`,
    `Documents: ${manifest.stats.documents}`,
    `Words: ${manifest.stats.words}`,
    '',
    '## Documents',
    ''
  ];
  for (const doc of manifest.documents) {
    lines.push(`- **${doc.title}** — \`${doc.path}\` (${doc.words} words)`);
    if (doc.headings.length > 1) lines.push(`  - headings: ${doc.headings.slice(0, 5).join(' › ')}`);
    if (doc.preview) lines.push(`  - preview: ${doc.preview}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderSearchMarkdown(result: SearchResult): string {
  const lines = ['# docneedle search', '', `Query: ${result.query}`, `Hits: ${result.hits.length}`, ''];
  for (const hit of result.hits) {
    lines.push(`## ${hit.title}`);
    lines.push(`- path: \`${hit.path}\``);
    lines.push(`- line: ${hit.line}`);
    lines.push(`- score: ${hit.score}`);
    lines.push('');
    lines.push(`> ${hit.snippet}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

export function renderPackMarkdown(pack: AgentPack): string {
  const lines = [
    '# docneedle agent pack',
    '',
    `Generated: ${pack.generatedAt}`,
    `Root: ${pack.root}`,
    pack.query ? `Query: ${pack.query}` : undefined,
    '',
    '## Best matches',
    ''
  ].filter(Boolean) as string[];
  if (pack.hits.length === 0) lines.push('_No query hits. Use the document map below._', '');
  for (const hit of pack.hits) {
    lines.push(`- **${hit.title}** (\`${hit.path}:${hit.line}\`, score ${hit.score})`);
    lines.push(`  - ${hit.snippet}`);
  }
  lines.push('', '## Document map', '');
  for (const doc of pack.manifest.documents) {
    lines.push(`- \`${doc.path}\` — ${doc.title}; ${doc.words} words`);
  }
  return `${lines.join('\n')}\n`;
}
