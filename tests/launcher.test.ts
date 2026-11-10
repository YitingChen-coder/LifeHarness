import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const run = (...args: string[]) =>
  spawnSync(process.execPath, ['scripts/planner.mjs', ...args], {
    encoding: 'utf8',
  });
test('launcher only accepts a validated explicit date and emits a restricted configuration', () => {
  const result = run('--date', '2026-11-10', '--check');
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.date, '2026-11-10');
  assert.equal(config.demo, true);
  assert.equal(config.binary, 'codex');
  assert.match(config.cwd, /data\/generated$/);
  assert.match(config.context, /LifeHarness daily planner/);
  assert.match(config.context, /2026-11-10/);
  assert.equal(config.args.includes('--no-daemon'), true);
  assert.equal(config.args.includes('workspace-write'), true);
  assert.ok(config.args.includes('features.plugins=false'));
  assert.ok(config.args.includes('forced_login_method="chatgpt"'));
  assert.equal(config.args.includes('never'), true);
  assert.equal(
    config.args.some((arg: string) => arg.includes('dangerously')),
    false,
  );
  assert.equal(
    config.args.some((arg: string) => arg === '--add-dir'),
    false,
  );
  for (const args of [
    ['--check', '--date'],
    ['--date', '../../secret'],
    ['--date', '2026-02-30'],
    ['--dangerously-skip-permissions'],
    ['--tools', 'Bash'],
  ])
    assert.notEqual(run(...args).status, 0);
});
test('native planner child does not inherit parent permissions or thread identifiers', async () => {
  const { sessionEnvironment } = await import('../scripts/codex-session.mjs');
  const env = sessionEnvironment({
    PATH: '/usr/bin',
    CODEX_PERMISSION_PROFILE: ':danger-full-access',
    CODEX_THREAD_ID: 'parent-thread',
    CODEX_SESSION_ID: 'parent-session',
    CODEX_TOOL_CALL_ID: 'parent-tool',
  });
  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.TSX_DISABLE_CACHE, '1');
  for (const key of [
    'CODEX_PERMISSION_PROFILE',
    'CODEX_THREAD_ID',
    'CODEX_SESSION_ID',
    'CODEX_TOOL_CALL_ID',
  ])
    assert.equal(env[key], undefined);
});
