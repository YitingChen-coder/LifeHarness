import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  cpSync,
  mkdirSync,
  symlinkSync,
  readFileSync,
  readdirSync,
  rmSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { evaluateTool } from '../src/lib/protection';

test('Codex quoted JSON writes validate before atomic saving and reject invalid memory', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'lifeharness-helper-')));
  try {
    for (const path of ['scripts', 'src/lib', 'data/sources'])
      cpSync(path, join(root, path), { recursive: true });
    mkdirSync(join(root, 'data/generated'));
    symlinkSync(
      join(process.cwd(), 'node_modules'),
      join(root, 'node_modules'),
    );
    const helper = join(root, 'scripts/planner-files.mjs');
    const notes = JSON.stringify({
      updatedAt: new Date().toISOString(),
      carryOver: ['task-algo'],
      reflections: ['Confirmed study intention.'],
    });
    const command = `node '${helper}' write notes <<'LIFEHARNESS_JSON'\n${notes}\nLIFEHARNESS_JSON`;
    const event = (command: string) => ({
      tool_name: 'Bash',
      cwd: join(root, 'data/generated'),
      tool_input: { command },
    });
    assert.equal((await evaluateTool(event(command), root)).allowed, true);
    assert.equal(
      (await evaluateTool(event(command + '\ntouch forbidden'), root)).allowed,
      false,
    );
    assert.equal(
      (await evaluateTool(event(command.replace(notes, '{}')), root)).allowed,
      false,
    );
    const run = (input: string) =>
      spawnSync(process.execPath, [helper, 'write', 'notes'], {
        cwd: join(root, 'data/generated'),
        input,
        encoding: 'utf8',
        env: { ...process.env, TSX_DISABLE_CACHE: '1' },
      });
    assert.equal(run(notes).status, 0);
    const saved = readFileSync(join(root, 'data/generated/notes.json'), 'utf8');
    assert.deepEqual(JSON.parse(saved), JSON.parse(notes));
    assert.notEqual(run('{}').status, 0);
    assert.equal(
      readFileSync(join(root, 'data/generated/notes.json'), 'utf8'),
      saved,
    );
    assert.deepEqual(readdirSync(join(root, 'data/generated')), ['notes.json']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
