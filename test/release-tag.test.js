import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { validateReleaseTag } from '../scripts/check-release-tag.js';

test('accepts exactly the stable package version tag', () => {
  assert.equal(validateReleaseTag('v0.1.0', '0.1.0'), 'v0.1.0');
});

test('rejects missing, malformed, prerelease, and mismatched tags', () => {
  assert.throws(() => validateReleaseTag('', '0.1.0'), /Release tag is required/);
  assert.throws(() => validateReleaseTag('0.1.0', '0.1.0'), /form v0\.1\.0/);
  assert.throws(() => validateReleaseTag('v0.1.0-beta.1', '0.1.0'), /stable semantic version/);
  assert.throws(() => validateReleaseTag('v0.2.0', '0.1.0'), /expected "v0\.1\.0"/);
});

test('CLI uses an explicit tag or GITHUB_REF_NAME and reports actionable failures', () => {
  const success = spawnSync(process.execPath, ['scripts/check-release-tag.js', 'v0.1.0'], { encoding: 'utf8' });
  assert.equal(success.status, 0, success.stderr);
  assert.match(success.stdout, /matches package\.json version 0\.1\.0/);

  const failure = spawnSync(process.execPath, ['scripts/check-release-tag.js', 'v0.2.0'], { encoding: 'utf8' });
  assert.equal(failure.status, 1);
  assert.match(failure.stderr, /Release tag preflight failed/);
  assert.match(failure.stderr, /expected "v0\.1\.0"/);
});
