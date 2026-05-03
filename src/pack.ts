import { buildManifest, publicManifest } from './indexer.js';
import { searchManifest } from './search.js';
import type { AgentPack } from './types.js';

export interface BuildPackOptions {
  root: string;
  query?: string;
  limit?: number;
}

export async function buildAgentPack(options: BuildPackOptions): Promise<AgentPack> {
  const manifest = await buildManifest({ root: options.root });
  const hits = options.query ? searchManifest(manifest, { query: options.query, limit: options.limit }).hits : [];
  return {
    generatedAt: new Date().toISOString(),
    root: manifest.root,
    query: options.query,
    manifest: publicManifest(manifest),
    hits
  };
}
