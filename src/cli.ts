import { watch } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildManifest, publicManifest } from './indexer.js';
import { buildAgentPack } from './pack.js';
import { renderManifestMarkdown, renderPackMarkdown, renderSearchMarkdown } from './render.js';
import { searchManifest } from './search.js';
import { writeFileEnsured } from './fs.js';

interface ParsedArgs {
  command?: string;
  positionals: string[];
  flags: Map<string, string | boolean>;
}

type OptionKind = 'boolean' | 'value';

const COMMAND_OPTIONS: Record<string, Readonly<Record<string, OptionKind>>> = {
  inspect: { output: 'value', format: 'value', watch: 'boolean' },
  search: { limit: 'value', json: 'boolean' },
  pack: { query: 'value', output: 'value', format: 'value', limit: 'value' }
};

const OUTPUT_FORMATS = ['json', 'markdown'] as const;
type OutputFormat = (typeof OUTPUT_FORMATS)[number];

const HELP = `docneedle — local-first search for docs, notes, and agent memory

Usage:
  docneedle inspect <dir> [--output <dir>] [--format json|markdown] [--watch]
  docneedle search <dir> <query...> [--limit <n>] [--json]
  docneedle pack <dir> [--query <text>] [--output <file>] [--format markdown|json] [--limit <n>]

Examples:
  docneedle inspect ./docs --output .docneedle
  docneedle search . "release checklist" --limit 5
  docneedle pack . --query onboarding --output agent-pack.md

Safety: docneedle only reads local text/Markdown-like files and writes outputs you explicitly request.
`;

export async function runCli(argv: string[], io = { stdout: process.stdout, stderr: process.stderr }): Promise<void> {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    io.stdout.write(HELP);
    return;
  }
  if (argv.includes('--version') || argv.includes('-v')) {
    const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    io.stdout.write(`${pkg.version}\n`);
    return;
  }
  const args = parseArgs(argv);
  if (!args.command || args.command === 'help') {
    io.stdout.write(HELP);
    return;
  }
  if (args.command === 'version') {
    const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    io.stdout.write(`${pkg.version}\n`);
    return;
  }

  switch (args.command) {
    case 'inspect':
      await inspect(args, io.stdout);
      return;
    case 'search':
      await search(args, io.stdout);
      return;
    case 'pack':
      await pack(args, io.stdout);
      return;
    default:
      throw new Error(`unknown command: ${args.command}\n\n${HELP}`);
  }
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const optionSchema = command ? COMMAND_OPTIONS[command] : undefined;
  const positionals: string[] = [];
  const flags = new Map<string, string | boolean>();
  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index];
    if (!item.startsWith('--')) {
      positionals.push(item);
      continue;
    }
    const [rawKey, inlineValue] = item.slice(2).split('=', 2);
    const key = rawKey.trim();
    if (!key) throw new Error('empty flag name');
    const kind = optionSchema?.[key];
    if (optionSchema && !kind) {
      throw new Error(`unknown option --${key} for ${command}`);
    }
    if (flags.has(key)) {
      throw new Error(`option --${key} may only be specified once`);
    }
    if (kind === 'boolean') {
      if (inlineValue !== undefined || (rest[index + 1] !== undefined && !rest[index + 1].startsWith('--'))) {
        throw new Error(`option --${key} does not take a value`);
      }
      flags.set(key, true);
      continue;
    }
    if (kind === 'value') {
      if (inlineValue !== undefined) {
        if (inlineValue.length === 0) throw new Error(`option --${key} requires a value`);
        flags.set(key, inlineValue);
        continue;
      }
      const next = rest[index + 1];
      if (!next || next.startsWith('--')) throw new Error(`option --${key} requires a value`);
      flags.set(key, next);
      index += 1;
      continue;
    }
    if (inlineValue !== undefined) {
      flags.set(key, inlineValue);
      continue;
    }
    const next = rest[index + 1];
    if (next && !next.startsWith('--')) {
      flags.set(key, next);
      index += 1;
    } else {
      flags.set(key, true);
    }
  }
  return { command, positionals, flags };
}

async function inspect(args: ParsedArgs, stdout: NodeJS.WriteStream): Promise<void> {
  const root = args.positionals[0];
  if (!root) throw new Error('inspect requires a directory');
  const output = stringFlag(args, 'output');
  const format = outputFormatFlag(args, 'json');
  const manifest = await buildManifest({ root });
  const safeManifest = publicManifest(manifest);
  const body = format === 'markdown' ? renderManifestMarkdown(manifest) : `${JSON.stringify(safeManifest, null, 2)}\n`;

  if (output) {
    const extension = format === 'markdown' ? 'md' : 'json';
    const file = path.join(output, `docneedle-manifest.${extension}`);
    await writeFileEnsured(file, body);
    stdout.write(`Indexed ${manifest.stats.documents} documents → ${file}\n`);
  } else {
    stdout.write(body);
  }

  if (hasFlag(args, 'watch')) {
    stdout.write('Watching for changes. Press Ctrl+C to stop.\n');
    await new Promise<void>(() => {
      watch(manifest.root, { recursive: true }, async () => {
        const nextManifest = await buildManifest({ root }).catch((error: unknown) => {
          stdout.write(`watch rebuild failed: ${error instanceof Error ? error.message : String(error)}\n`);
          return undefined;
        });
        if (nextManifest && output) {
          await writeFileEnsured(path.join(output, 'docneedle-manifest.json'), `${JSON.stringify(publicManifest(nextManifest), null, 2)}\n`);
          stdout.write(`Rebuilt ${nextManifest.stats.documents} documents at ${new Date().toISOString()}\n`);
        }
      });
    });
  }
}

async function search(args: ParsedArgs, stdout: NodeJS.WriteStream): Promise<void> {
  const root = args.positionals[0];
  const query = args.positionals.slice(1).join(' ');
  if (!root || !query) throw new Error('search requires a directory and query');
  const limit = positiveIntegerFlag(args, 'limit', 10);
  const manifest = await buildManifest({ root });
  const result = searchManifest(manifest, { query, limit });
  stdout.write(hasFlag(args, 'json') ? `${JSON.stringify(result, null, 2)}\n` : renderSearchMarkdown(result));
}

async function pack(args: ParsedArgs, stdout: NodeJS.WriteStream): Promise<void> {
  const root = args.positionals[0];
  if (!root) throw new Error('pack requires a directory');
  const query = stringFlag(args, 'query');
  const output = stringFlag(args, 'output');
  const format = outputFormatFlag(args, output?.endsWith('.json') ? 'json' : 'markdown');
  const limit = positiveIntegerFlag(args, 'limit', 8);
  const packData = await buildAgentPack({ root, query, limit });
  const body = format === 'json' ? `${JSON.stringify(packData, null, 2)}\n` : renderPackMarkdown(packData);
  if (output) {
    await writeFileEnsured(output, body);
    stdout.write(`Wrote agent pack → ${output}\n`);
  } else {
    stdout.write(body);
  }
}

function hasFlag(args: ParsedArgs, name: string): boolean {
  return args.flags.has(name);
}

function stringFlag(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags.get(name);
  if (value === undefined || value === true) return undefined;
  return String(value);
}

function outputFormatFlag(args: ParsedArgs, fallback: OutputFormat): OutputFormat {
  const value = stringFlag(args, 'format') ?? fallback;
  if (!OUTPUT_FORMATS.includes(value as OutputFormat)) {
    throw new Error(`--format must be one of: ${OUTPUT_FORMATS.join(', ')}`);
  }
  return value as OutputFormat;
}

function positiveIntegerFlag(args: ParsedArgs, name: string, fallback: number): number {
  const value = Number(stringFlag(args, name) ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return value;
}
