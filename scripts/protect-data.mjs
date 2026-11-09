#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
  decision = await evaluateTool(JSON.parse(input), root);
} catch (error) {
  decision = {
    allowed: false,
    reason: `LifeHarness failed closed: ${error.message}`,
  };
}
console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision.allowed ? 'allow' : 'deny',
      permissionDecisionReason: decision.reason,
    },
  }),
);
