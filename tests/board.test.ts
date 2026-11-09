import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { boardTasks, filterTasks } from '../src/lib/board';
import { readTaskState, writeTaskStatus } from '../src/lib/task-state';
import type { DashboardData } from '../src/lib/store';
const data: DashboardData = {
  date: '2026-11-10',
  today: '2026-11-08',
  fetchedAt: '2026-11-08T12:00:00Z',
  academic: JSON.parse(readFileSync('data/sources/academic.json', 'utf8')),
  jobs: JSON.parse(readFileSync('data/sources/jobs.json', 'utf8')),
  plan: null,
  warnings: [],
};
test('board exposes every real task, searches title/context and combines domain/status filters', () => {
  const tasks = boardTasks(data);
  assert.equal(tasks.length, 12);
  assert.equal(
    tasks.every((t) => t.status === 'todo'),
    true,
  );
  assert.equal(
    filterTasks(tasks, {
      query: 'mpcs 51238',
      domain: 'all',
      due: 'all',
      date: data.date,
    }).length,
    2,
  );
  assert.equal(
    filterTasks(tasks, {
      query: 'Northstar',
      domain: 'career',
      due: 'all',
      date: data.date,
    }).length,
    2,
  );
  assert.equal(
    filterTasks(tasks, {
      query: '',
      domain: 'academic',
      due: 'today',
      date: data.date,
    }).length,
    3,
  );
  assert.equal(new Set(tasks.map((t) => t.id)).size, 12);
});
test('newer manual changes override old plans, new confirmed completion overrides old manual state', () => {
  const prior = {
    ...data,
    taskState: {
      version: 1 as const,
      tasks: {
        'task-algo': {
          status: 'in_progress' as const,
          updatedAt: '2026-11-10T10:00:00Z',
        },
      },
    },
  };
  assert.equal(
    boardTasks(prior).find((t) => t.id === 'task-algo')?.status,
    'in_progress',
  );
  const completed = {
    ...prior,
    plan: {
      date: data.date,
      timezone: 'America/Chicago' as const,
      confirmed: true as const,
      confirmedAt: '2026-11-10T11:00:00Z',
      summary: 'Confirmed',
      priorities: [
        {
          id: 'p1',
          sourceId: 'task-algo',
          title: 'Study',
          reason: 'Done',
          status: 'completed' as const,
        },
      ],
      blocks: [],
    },
  };
  assert.equal(
    boardTasks(completed).find((t) => t.id === 'task-algo')?.status,
    'done',
  );
  assert.equal(
    boardTasks({
      ...completed,
      taskState: {
        version: 1,
        tasks: {
          'task-algo': { status: 'todo', updatedAt: '2026-11-10T12:00:00Z' },
        },
      },
    }).find((t) => t.id === 'task-algo')?.status,
    'todo',
  );
});
test('task-state writes serialize, persist only known IDs and leave source bytes untouched', async () => {
  const root = mkdtempSync(join(tmpdir(), 'lifeharness-board-'));
  mkdirSync(join(root, 'data/sources'), { recursive: true });
  for (const name of ['academic', 'jobs'])
    copyFileSync(
      `data/sources/${name}.json`,
      join(root, `data/sources/${name}.json`),
    );
  const hash = () =>
    createHash('sha256')
      .update(readFileSync(join(root, 'data/sources/academic.json')))
      .digest('hex');
  const before = hash();
  try {
    assert.deepEqual((await readTaskState(root)).tasks, {});
    await Promise.all([
      writeTaskStatus(root, 'task-algo', 'in_progress'),
      writeTaskStatus(root, 'prep-northstar', 'done'),
    ]);
    const saved = await readTaskState(root);
    assert.equal(saved.tasks['task-algo'].status, 'in_progress');
    assert.equal(saved.tasks['prep-northstar'].status, 'done');
    assert.equal(hash(), before);
    await assert.rejects(
      writeTaskStatus(root, '../../sources/academic', 'done'),
    );
    await assert.rejects(writeTaskStatus(root, 'missing', 'done'));
    await assert.rejects(
      writeTaskStatus(root, 'task-algo', 'INVALID' as never),
    );
    rmSync(join(root, 'data/user/task-state.json'));
    symlinkSync(
      join(root, 'data/sources/academic.json'),
      join(root, 'data/user/task-state.json'),
    );
    await assert.rejects(writeTaskStatus(root, 'task-algo', 'done'));
    assert.equal(hash(), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
