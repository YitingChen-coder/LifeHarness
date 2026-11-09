import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  readFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PlannerSession } from '../src/lib/web-planner';
const draft = {
  summary: 'Study before class',
  priorities: [
    {
      id: 'p1',
      sourceId: 'task-algo',
      title: 'Study',
      reason: 'Due soon',
      status: 'pending',
    },
  ],
  blocks: [
    {
      id: 'b1',
      sourceId: 'task-algo',
      title: 'Study',
      start: '2026-11-09T09:00:00-06:00',
      end: '2026-11-09T10:00:00-06:00',
      kind: 'task',
      status: 'pending',
    },
    {
      id: 'b2',
      sourceId: 'class-algo-mon',
      title: 'Algorithms',
      start: '2026-11-09T10:30:00-06:00',
      end: '2026-11-09T11:50:00-06:00',
      kind: 'class',
      status: 'pending',
    },
  ],
  carryOver: ['task-algo'],
  reflections: ['Confirmed study intention.'],
};
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'lifeharness-web-'));
  for (const p of ['data/sources', 'context', '.agents'])
    cpSync(p, join(root, p), { recursive: true });
  mkdirSync(join(root, 'data/generated'));
  return root;
}
test('web questions, refusal and revision never save; only current opaque draft confirmation saves and retries are idempotent', async () => {
  const root = fixture();
  let calls = 0;
  try {
    const s = new PlannerSession(root, '2026-11-09', async () => {
      calls++;
      return calls === 1
        ? { message: 'What is your energy level?', draft: null }
        : { message: 'Here is your proposed day.', draft };
    });
    await s.message('Good morning');
    assert.equal(
      existsSync(join(root, 'data/generated/2026-11-09.json')),
      false,
    );
    const a = await s.message('High energy');
    assert.ok(a.draft?.id);
    assert.equal(existsSync(join(root, 'data/generated/notes.json')), false);
    await s.discard(a.draft!.id);
    assert.equal(
      existsSync(join(root, 'data/generated/2026-11-09.json')),
      false,
    );
    const b = await s.message('Please revise');
    await assert.rejects(s.confirm(a.draft!.id), /stale|current/i);
    const result = await s.confirm(b.draft!.id);
    assert.equal(result.saved, true);
    assert.equal(calls, 3);
    const bytes = readFileSync(
      join(root, 'data/generated/2026-11-09.json'),
      'utf8',
    );
    assert.equal(JSON.parse(bytes).confirmed, true);
    assert.equal((await s.confirm(b.draft!.id)).saved, true);
    assert.equal(
      readFileSync(join(root, 'data/generated/2026-11-09.json'), 'utf8'),
      bytes,
    );
    assert.deepEqual(
      JSON.parse(readFileSync(join(root, 'data/generated/notes.json'), 'utf8'))
        .carryOver,
      ['task-algo'],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test('web planner rejects invalid model drafts and clears a previous draft when generation fails', async () => {
  const root = fixture();
  let n = 0;
  try {
    const s = new PlannerSession(root, '2026-11-09', async () => {
      n++;
      if (n === 1) return { message: 'Draft', draft };
      if (n === 2) throw new Error('Connection failed');
      return { message: 'Invalid', draft: { ...draft, blocks: [] } };
    });
    const a = await s.message('Plan');
    await assert.rejects(s.message('Change it'), /Connection/);
    await assert.rejects(s.confirm(a.draft!.id), /stale|current/i);
    await assert.rejects(s.message('Try again'), /fixed|preserve/i);
    assert.equal(
      existsSync(join(root, 'data/generated/2026-11-09.json')),
      false,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
