import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { assertDirectory, collectFiles, DEFAULT_EXTENSIONS, toPosixRelative } from './fs.js';
import type { DocManifest, IndexedDocument, IndexOptions } from './types.js';

const WORD_RE = /[\p{L}\p{N}_-]+/gu;

export async function buildManifest(options: IndexOptions): Promise<DocManifest> {
  const root = await assertDirectory(options.root);
  const maxBytes = options.maxBytes ?? 1_000_000;
  const files = await collectFiles(root, options.includeExtensions ?? DEFAULT_EXTENSIONS, options.excludePaths);
  const documents: IndexedDocument[] = [];

  for (const file of files) {
    const stat = await fs.stat(file);
    if (stat.size > maxBytes) continue;
    const content = await fs.readFile(file, 'utf8');
    documents.push(indexDocument(root, file, content, stat.size, stat.mtime));
  }

  documents.sort((a, b) => a.path.localeCompare(b.path));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    root,
    stats: {
      documents: documents.length,
      bytes: documents.reduce((sum, doc) => sum + doc.bytes, 0),
      words: documents.reduce((sum, doc) => sum + doc.words, 0)
    },
    documents
  };
}

export function indexDocument(root: string, file: string, content: string, bytes: number, modified: Date): IndexedDocument {
  const relativePath = toPosixRelative(root, file);
  const lines = content.split(/\r?\n/);
  const headings = extractHeadings(lines);
  const title = headings[0] ?? titleFromPath(relativePath);
  const words = [...content.matchAll(WORD_RE)].length;
  const id = crypto.createHash('sha256').update(relativePath).digest('hex').slice(0, 12);

  return {
    id,
    path: relativePath,
    title,
    extension: path.extname(file).toLowerCase(),
    bytes,
    modified: modified.toISOString(),
    headings,
    words,
    lines: lines.length,
    preview: makePreview(content),
    content
  };
}

export function publicManifest(manifest: DocManifest): Omit<DocManifest, 'documents'> & { documents: Array<Omit<IndexedDocument, 'content'>> } {
  return {
    ...manifest,
    documents: manifest.documents.map(({ content: _content, ...doc }) => doc)
  };
}

function extractHeadings(lines: string[]): string[] {
  const headings: string[] = [];
  let firstContentLine = 0;
  if (lines[0]?.trim() === '---') {
    const closingDelimiter = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    if (closingDelimiter !== -1) firstContentLine = closingDelimiter + 1;
  }

  for (let index = firstContentLine; index < lines.length; index += 1) {
    const line = lines[index];
    const markdown = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (markdown) headings.push(markdown[2].replace(/[#*`_]/g, '').trim());
    if (/^\s*(?:=+|-+)\s*$/.test(lines[index + 1] ?? '') && line.trim()) {
      headings.push(line.trim());
      index += 1;
    }
  }
  return [...new Set(headings)].slice(0, 12);
}

function titleFromPath(relativePath: string): string {
  const basename = path.basename(relativePath, path.extname(relativePath));
  return basename.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function makePreview(content: string): string {
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}
