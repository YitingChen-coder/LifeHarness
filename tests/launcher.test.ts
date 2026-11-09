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
  assert.deepEqual(config.tools, [
    'Read',
    'Glob',
    'Grep',
    'Write',
    'Edit',
    'Skill',
  ]);
  assert.match(config.context, /LifeHarness daily planner/);
  assert.match(config.context, /2026-11-10/);
  assert.equal(config.args.includes('--strict-mcp-config'), true);
  assert.equal(config.args.includes('--no-chrome'), true);
  assert.equal(config.args.includes('--append-system-prompt'), true);
  for (const args of [
    ['--check', '--date'],
    ['--date', '../../secret'],
    ['--date', '2026-02-30'],
    ['--dangerously-skip-permissions'],
    ['--tools', 'Bash'],
  ])
    assert.notEqual(run(...args).status, 0);
});
