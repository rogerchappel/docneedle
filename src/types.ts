export type OutputFormat = 'json' | 'markdown';

export interface IndexOptions {
  root: string;
  includeExtensions?: string[];
  maxBytes?: number;
  excludePaths?: string[];
}

export interface IndexedDocument {
  id: string;
  path: string;
  title: string;
  extension: string;
  bytes: number;
  modified: string;
  headings: string[];
  words: number;
  lines: number;
  preview: string;
  content: string;
}

export interface DocManifest {
  schemaVersion: 1;
  generatedAt: string;
  root: string;
  stats: {
    documents: number;
    bytes: number;
    words: number;
  };
  documents: IndexedDocument[];
}

export interface SearchHit {
  path: string;
  title: string;
  score: number;
  line: number;
  snippet: string;
  headings: string[];
}

export interface SearchResult {
  query: string;
  generatedAt: string;
  root: string;
  hits: SearchHit[];
}

export interface AgentPack {
  generatedAt: string;
  root: string;
  query?: string;
  manifest: Omit<DocManifest, 'documents'> & {
    documents: Array<Omit<IndexedDocument, 'content'>>;
  };
  hits: SearchHit[];
}
