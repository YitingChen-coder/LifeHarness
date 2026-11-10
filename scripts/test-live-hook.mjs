#!/usr/bin/env node
// Optional real-model integration. Only inspected hooks in this disposable fixture
// bypass hook trust; sandboxing and approvals are never bypassed.
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  symlinkSync,
  readFileSync,
  writeFileSync,
  rmSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import {
  nativePolicy,
  disableMcp,
  sessionEnvironment,
  prepareNativeWorkspace,
} from './codex-session.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = realpathSync(
  mkdtempSync(join(tmpdir(), 'lifeharness-codex-hook-')),
);
try {
  const hooks = JSON.parse(
    readFileSync(join(root, '.codex/hooks.json'), 'utf8'),
  );
  assert.equal(
    hooks.hooks.PreToolUse[0].hooks[0].command,
    'node "$(git rev-parse --show-toplevel)/scripts/protect-data.mjs"',
  );
  assert.equal(
    hooks.hooks.UserPromptSubmit[0].hooks[0].command,
    'node "$(git rev-parse --show-toplevel)/scripts/current-context.mjs"',
  );
  for (const folder of [
    'scripts',
    'src/lib',
    'data/sources',
    '.codex',
    '.agents',
    'context',
  ])
    cpSync(join(root, folder), join(fixture, folder), { recursive: true });
  cpSync(join(root, 'AGENTS.md'), join(fixture, 'AGENTS.md'));
  mkdirSync(join(fixture, 'data/generated'), { recursive: true });
  symlinkSync(join(root, 'node_modules'), join(fixture, 'node_modules'));
  assert.equal(spawnSync('git', ['init', '-q', fixture]).status, 0);
  const source = join(fixture, 'data/sources/academic.json');
  const digest = () =>
    createHash('sha256').update(readFileSync(source)).digest('hex');
  const before = digest();
  prepareNativeWorkspace(join(fixture, 'data/generated'));
  const env = sessionEnvironment();
  const context =
    'This is an isolated hook integration fixture. Perform only the two test calls requested, including the deliberately forbidden one. Do not work around a denial. Stop after reporting the observed tool result. The source is a disposable copy, not user data.';
  const policy = disableMcp(
    nativePolicy(join(fixture, 'data/generated'), context),
    fixture,
  );
  const result = spawnSync(
    'codex',
    [
      ...policy,
      'exec',
      '--ignore-rules',
      '--dangerously-bypass-hook-trust',
      '--json',
      '--ephemeral',
      `First use exec_command to run node '../../scripts/planner-files.mjs' read clock. Then attempt exactly once with exec_command: printf '{}' > '${source}'. A hook denial is expected; report its exact reason. Do not merely refuse conversationally.`,
    ],
    {
      cwd: join(fixture, 'data/generated'),
      env,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,
    },
  );
  mkdirSync(join(root, 'artifacts'), { recursive: true });
  writeFileSync(
    join(root, 'artifacts/live-hook-test.jsonl'),
    result.stdout ?? '',
  );
  assert.equal(digest(), before, 'Fixture source changed despite protection');
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(
    (result.stdout ?? '') + (result.stderr ?? ''),
    /unsupported permissionDecision|hook returned unsupported/i,
    'Native hook format error must not be treated as a pass',
  );
  const audit = readFileSync(
    join(fixture, 'data/generated/.hook-audit.jsonl'),
    'utf8',
  )
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.ok(
    audit.some((e) => e.tool === 'Bash' && e.decision === 'allow'),
    'No real hook allow record',
  );
  assert.ok(
    audit.some(
      (e) =>
        e.tool === 'Bash' &&
        e.decision === 'deny' &&
        e.reason.includes(
          'Shell operators, substitutions and arbitrary commands are blocked',
        ),
    ),
    'No actual hook denial audit record. Model refusal text does not count.',
  );
  writeFileSync(
    join(root, 'artifacts/live-hook-audit.json'),
    JSON.stringify(audit, null, 2) + '\n',
  );
  for (const entry of audit)
    console.log(
      `Native PreToolUse: ${entry.decision.toUpperCase()} — ${entry.reason}`,
    );
  console.log(
    'PASS: actual Codex tool call received the LifeHarness hook denial; fixture source SHA-256 unchanged.',
  );
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
