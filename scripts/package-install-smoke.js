import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const workspace = mkdtempSync(join(tmpdir(), 'docneedle-package-smoke-'));
const packDirectory = join(workspace, 'pack');
const installPrefix = join(workspace, 'install');
const fixtureDirectory = join(workspace, 'docs');
const manifestPath = join(workspace, 'manifest.json');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}`);
  }

  return result.stdout;
}

try {
  mkdirSync(packDirectory);
  mkdirSync(fixtureDirectory);
  writeFileSync(
    join(fixtureDirectory, 'runbook.md'),
    '# Release escalation\n\nContact the release captain before retrying a failed deployment.\n',
  );

  const packOutput = run('npm', ['pack', '--json', '--pack-destination', packDirectory]);
  const [{ filename }] = JSON.parse(packOutput);
  const tarball = join(packDirectory, filename);

  run('npm', ['install', '--global', '--prefix', installPrefix, tarball]);

  const executableDirectory =
    process.platform === 'win32' ? installPrefix : join(installPrefix, 'bin');
  const executable = process.platform === 'win32' ? 'docneedle.cmd' : 'docneedle';
  const environment = {
    ...process.env,
    PATH: `${executableDirectory}${delimiter}${process.env.PATH ?? ''}`,
  };

  const help = run(executable, ['--help'], { env: environment });
  if (!help.includes('docneedle inspect')) {
    throw new Error('Installed CLI help did not include the inspect command');
  }

  run(executable, ['inspect', fixtureDirectory, '--output', manifestPath], {
    env: environment,
  });

  process.stdout.write('Packaged install smoke test passed.\n');
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
