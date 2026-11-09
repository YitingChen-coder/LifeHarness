#!/usr/bin/env node
// Optional real Codex account usage. All plans/notes save only in a disposable fixture.
import {
  mkdtempSync,
  realpathSync,
  cpSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  readFileSync,
  existsSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { tsImport } from 'tsx/esm/api';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = realpathSync(
  mkdtempSync(join(tmpdir(), 'lifeharness-web-live-')),
);
const evidence = {
  date: new Date().toISOString(),
  mode: 'actual Codex app-server, disposable fixture',
  steps: [],
};
try {
  for (const p of [
    'scripts',
    'src/lib',
    'data/sources',
    'context',
    '.agents',
    '.codex',
  ])
    cpSync(join(root, p), join(fixture, p), { recursive: true });
  cpSync(join(root, 'AGENTS.md'), join(fixture, 'AGENTS.md'));
  mkdirSync(join(fixture, 'data/generated'));
  symlinkSync(join(root, 'node_modules'), join(fixture, 'node_modules'));
  assert.equal(spawnSync('git', ['init', '-q', fixture]).status, 0);
  const digest = () =>
    createHash('sha256')
      .update(readFileSync(join(fixture, 'data/sources/academic.json')))
      .update(readFileSync(join(fixture, 'data/sources/jobs.json')))
      .digest('hex');
  const before = digest();
  const { PlannerSession } = await tsImport(
    '../src/lib/web-planner.ts',
    import.meta.url,
  );
  const { generateWithCodex } = await tsImport(
    '../src/lib/codex-bridge.ts',
    import.meta.url,
  );
  const session = new PlannerSession(fixture, '2026-11-09', generateWithCodex);
  const question = await session.message('Good morning');
  assert.equal(question.draft, null);
  evidence.steps.push({
    step: 'morning questions',
    message: question.messages.at(-1).text,
  });
  const proposal = await session.message(
    'My energy is high. I am available 09:00–18:00 except lunch 12:00–13:00 and all fixed source commitments. Prioritize the nearest coursework deadline and urgent interview preparation. No other constraints. Please propose the full plan now.',
  );
  assert.ok(proposal.draft, 'Expected a validated proposal after the answer');
  assert.equal(
    existsSync(join(fixture, 'data/generated/2026-11-09.json')),
    false,
  );
  assert.equal(existsSync(join(fixture, 'data/generated/notes.json')), false);
  evidence.steps.push({
    step: 'validated proposal without saving',
    summary: proposal.draft.plan.summary,
    blocks: proposal.draft.plan.blocks.length,
  });
  await session.discard(proposal.draft.id);
  assert.equal(
    existsSync(join(fixture, 'data/generated/2026-11-09.json')),
    false,
  );
  evidence.steps.push({ step: 'refusal leaves plan/notes unchanged' });
  const revised = await session.message(
    'Please propose a revised full plan. Keep my high energy, all fixed commitments, lunch free and the same availability. Include a 45-minute Algorithms task block before class. Do not save.',
  );
  assert.ok(revised.draft, 'Expected revised valid proposal');
  await assert.rejects(session.confirm(proposal.draft.id), /stale/);
  evidence.steps.push({
    step: 'revised proposal and stale confirmation rejected',
  });
  const saved = await session.confirm(revised.draft.id);
  assert.equal(saved.saved, true);
  assert.equal(saved.warning, null);
  const plan = JSON.parse(
    readFileSync(join(fixture, 'data/generated/2026-11-09.json'), 'utf8'),
  );
  const notes = JSON.parse(
    readFileSync(join(fixture, 'data/generated/notes.json'), 'utf8'),
  );
  assert.equal(plan.confirmed, true);
  assert.equal(plan.confirmedAt, notes.updatedAt);
  assert.equal(digest(), before);
  evidence.steps.push({
    step: 'explicit confirmation saves validated plan and notes',
    confirmedAt: plan.confirmedAt,
    sourceHashesUnchanged: true,
  });
  console.log(
    'PASS: real Codex morning → questions → proposal → refusal → revision → explicit confirmation → plan + notes, in isolated fixture.',
  );
} catch (error) {
  evidence.error = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  mkdirSync(join(root, 'artifacts'), { recursive: true });
  writeFileSync(
    join(root, 'artifacts/browser-live-verification.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  rmSync(fixture, { recursive: true, force: true });
}
