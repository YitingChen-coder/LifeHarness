import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { evaluateTool } from '../src/lib/protection';
const root = process.cwd();
const helper = resolve('scripts/planner-files.mjs');
test('Codex hooks allow only narrowly parsed reads and deny arbitrary execution/patching', async () => {
  const command = (command: string) => ({
    tool_name: 'Bash',
    tool_input: { command },
    cwd: resolve('data/generated'),
  });
  assert.equal(
    (await evaluateTool(command(`node '${helper}' read academic`), root))
      .allowed,
    true,
  );
  assert.equal(
    (
      await evaluateTool(
        command(`cat '${resolve('.agents/skills/morning-check-in/SKILL.md')}'`),
        root,
      )
    ).allowed,
    true,
  );
  for (const value of [
    'echo bad > ../sources/academic.json',
    `node '${helper}' read academic; touch evil`,
    `node '${helper}' read academic | sh`,
    `cat '${resolve('AGENTS.md')}' $(touch evil)`,
    `cat /etc/passwd`,
    'python3 -c "print(1)"',
  ])
    assert.equal(
      (await evaluateTool(command(value), root)).allowed,
      false,
      value,
    );
  for (const tool_name of [
    'apply_patch',
    'Agent',
    'spawn_agent',
    'mcp__fs__write_file',
    'Write',
  ])
    assert.equal(
      (
        await evaluateTool(
          { tool_name, tool_input: { command: 'anything' } },
          root,
        )
      ).allowed,
      false,
    );
});
