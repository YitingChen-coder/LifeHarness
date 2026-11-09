#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'data/sources/academic.json');
const hash = () =>
  createHash('sha256').update(readFileSync(source)).digest('hex');
const before = hash();
const result = spawnSync(
  process.execPath,
  [resolve(root, 'scripts/protect-data.mjs')],
  {
    input: JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      cwd: root,
      tool_input: { command: `printf '{}' > '${source}'` },
    }),
    encoding: 'utf8',
    cwd: root,
  },
);
assert.equal(result.status, 0, result.stderr);
const decision = JSON.parse(result.stdout).hookSpecificOutput;
assert.equal(decision.permissionDecision, 'deny');
assert.equal(hash(), before);
console.log(
  `PASS: ${decision.permissionDecisionReason}\nPASS: protected source SHA-256 unchanged (${before}).\nThis exercises the real hook process with a simulated tool payload; use npm run test:hook:live for live Codex integration.`,
);
