#!/usr/bin/env node

import fs from 'node:fs/promises';

const stableVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const releaseTagPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateReleaseTag(tag, version) {
  if (!tag) {
    throw new Error('Release tag is required. Pass v<package.json version> as the argument or set GITHUB_REF_NAME.');
  }
  if (!stableVersionPattern.test(version)) {
    throw new Error(`package.json version must be a stable semantic version; received ${JSON.stringify(version)}.`);
  }
  if (!releaseTagPattern.test(tag)) {
    throw new Error(`Release tag must be a stable semantic version in the form v${version}; received ${JSON.stringify(tag)}.`);
  }
  const expected = `v${version}`;
  if (tag !== expected) {
    throw new Error(`Release tag ${JSON.stringify(tag)} does not match package.json version ${JSON.stringify(version)}; expected ${JSON.stringify(expected)}.`);
  }
  return expected;
}

async function main() {
  const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const tag = process.argv[2] || process.env.GITHUB_REF_NAME || '';
  const validated = validateReleaseTag(tag, packageJson.version);
  process.stdout.write(`Release tag ${validated} matches package.json version ${packageJson.version}.\n`);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch((error) => {
    process.stderr.write(`Release tag preflight failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
