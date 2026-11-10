#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import { open, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let event;
let decision = {
  allowed: false,
  reason: 'Invalid or unavailable LifeHarness hook input',
};
try {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (Buffer.byteLength(input) > 262144)
      throw new Error('Hook input too large');
  }
  const { evaluateTool } = await tsImport(
    '../src/lib/protection.ts',
    import.meta.url,
  );
  event = JSON.parse(input);
  decision = await evaluateTool(event, root);
} catch (error) {
  decision = {
    allowed: false,
    reason: `LifeHarness failed closed: ${error.message}`,
  };
}
if (process.env.LIFEHARNESS_HOOK_AUDIT === '1') {
  let handle;
  try {
    const parent = resolve(root, 'data/generated');
    if ((await realpath(parent)) !== parent)
      throw new Error('Linked audit directory');
    handle = await open(
      resolve(parent, '.hook-audit.jsonl'),
      constants.O_CREAT |
        constants.O_APPEND |
        constants.O_WRONLY |
        constants.O_NOFOLLOW,
      0o600,
    );
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > 1048576)
      throw new Error('Unsafe or full hook audit');
    const command = event?.tool_input?.command ?? event?.tool_input?.cmd ?? '';
    await handle.writeFile(
      JSON.stringify({
        at: new Date().toISOString(),
        tool: event?.tool_name ?? 'unknown',
        toolUseId: event?.tool_use_id ?? null,
        decision: decision.allowed ? 'allow' : 'deny',
        reason: decision.reason,
        commandSha256: createHash('sha256')
          .update(
            typeof command === 'string' ? command : JSON.stringify(command),
          )
          .digest('hex'),
      }) + '\n',
    );
  } catch {
    decision = {
      allowed: false,
      reason: 'Hook audit unavailable: refusing the operation.',
    };
  } finally {
    await handle?.close();
  }
}
// An allowed operation needs no permission override. Bare "allow" is rejected by
// Codex 0.160.0; an empty successful response keeps normal sandbox/approval checks.
console.log(
  JSON.stringify(
    decision.allowed
      ? {}
      : {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: decision.reason,
          },
        },
  ),
);
