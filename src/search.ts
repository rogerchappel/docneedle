import type { DocManifest, SearchHit, SearchResult } from './types.js';

const TOKEN_RE = /[\p{L}\p{N}_-]+/gu;

export interface SearchOptions {
  query: string;
  limit?: number;
}

export function searchManifest(manifest: DocManifest, options: SearchOptions): SearchResult {
  const terms = [...new Set(tokenize(options.query))];
  if (terms.length === 0) throw new Error('search query must contain at least one word');
  const limit = options.limit ?? 10;

  const hits = manifest.documents
    .map((doc): SearchHit | undefined => {
      const contentTokens = tokenize(doc.content);
      const titleTokens = new Set(tokenize(doc.title));
      const headingTokens = doc.headings.map((heading) => new Set(tokenize(heading)));
      const pathTokens = new Set(tokenize(doc.path));
      let score = 0;
      for (const term of terms) {
        score += contentTokens.filter((token) => token === term).length * 5;
        if (titleTokens.has(term)) score += 8;
        if (headingTokens.some((heading) => heading.has(term))) score += 4;
        if (pathTokens.has(term)) score += 2;
      }
      if (score === 0) return undefined;
      const location = findFirstLine(doc.content, terms);
      return {
        path: doc.path,
        title: doc.title,
        score,
        line: location.line,
        snippet: location.snippet,
        headings: doc.headings.slice(0, 4)
      };
    })
    .filter((hit): hit is SearchHit => Boolean(hit))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit);

  return {
    query: options.query,
    generatedAt: new Date().toISOString(),
    root: manifest.root,
    hits
  };
}

export function tokenize(input: string): string[] {
  return [...input.toLowerCase().matchAll(TOKEN_RE)].map((match) => match[0]).filter(Boolean);
}

function findFirstLine(content: string, terms: string[]): { line: number; snippet: string } {
  const lines = content.split(/\r?\n/);
  let bestIndex = 0;
  let bestScore = -1;
  lines.forEach((line, index) => {
    const lineTokens = new Set(tokenize(line));
    const score = terms.reduce((sum, term, termIndex) => sum + (lineTokens.has(term) ? terms.length - termIndex : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  const lineIndex = bestScore <= 0 ? 0 : bestIndex;
  const start = Math.max(0, lineIndex - 1);
  const end = Math.min(lines.length, lineIndex + 4);
  const snippet = lines.slice(start, end).join(' ').replace(/\s+/g, ' ').trim();
  return { line: lineIndex + 1, snippet: snippet.slice(0, 320) };
}
