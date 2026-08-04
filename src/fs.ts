import { promises as fs } from 'node:fs';
import path from 'node:path';

export const DEFAULT_EXTENSIONS = ['.md', '.mdx', '.txt', '.rst', '.adoc'];
const DEFAULT_IGNORES = new Set(['.git', 'node_modules', 'dist', '.tmp', 'coverage', '.next', '.turbo']);

export async function assertDirectory(root: string): Promise<string> {
  const resolved = path.resolve(root);
  const stat = await fs.stat(resolved).catch(() => undefined);
  if (!stat) throw new Error(`directory not found: ${root}`);
  if (!stat.isDirectory()) throw new Error(`expected a directory: ${root}`);
  return resolved;
}

export async function collectFiles(root: string, extensions = DEFAULT_EXTENSIONS, excludePaths: string[] = []): Promise<string[]> {
  const resolvedRoot = await assertDirectory(root);
  const wanted = new Set(extensions.map((ext) => ext.toLowerCase()));
  const excluded = new Set(excludePaths.map((file) => path.resolve(file)));
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!DEFAULT_IGNORES.has(entry.name)) await walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      const file = path.join(dir, entry.name);
      if (wanted.has(extension) && !excluded.has(file)) files.push(file);
    }
  }

  await walk(resolvedRoot);
  return files;
}

export function toPosixRelative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join('/');
}

export async function writeFileEnsured(file: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}
