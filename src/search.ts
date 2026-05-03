import type { DocManifest, SearchHit, SearchResult } from './types.js';

const TOKEN_RE = /[\p{L}\p{N}_-]+/gu;

export interface SearchOptions {
  query: string;
  limit?: number;
}

export function searchManifest(manifest: DocManifest, options: SearchOptions): SearchResult {
  const terms = tokenize(options.query);
  if (terms.length === 0) throw new Error('search query must contain at least one word');
  const limit = options.limit ?? 10;

  const hits = manifest.documents
    .map((doc): SearchHit | undefined => {
      const lower = doc.content.toLowerCase();
      let score = 0;
      for (const term of terms) {
        score += countOccurrences(lower, term) * 5;
        if (doc.title.toLowerCase().includes(term)) score += 8;
        if (doc.headings.some((heading) => heading.toLowerCase().includes(term))) score += 4;
        if (doc.path.toLowerCase().includes(term)) score += 2;
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

function countOccurrences(text: string, term: string): number {
  let count = 0;
  let index = text.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(term, index + term.length);
  }
  return count;
}

function findFirstLine(content: string, terms: string[]): { line: number; snippet: string } {
  const lines = content.split(/\r?\n/);
  let bestIndex = 0;
  let bestScore = -1;
  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    const score = terms.reduce((sum, term, termIndex) => sum + (lower.includes(term) ? terms.length - termIndex : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  const lineIndex = bestScore <= 0 ? 0 : bestIndex;
  const start = Math.max(0, lineIndex - 1);
  const end = Math.min(lines.length, lineIndex + 2);
  const snippet = lines.slice(start, end).join(' ').replace(/\s+/g, ' ').trim();
  return { line: lineIndex + 1, snippet: snippet.slice(0, 320) };
}
