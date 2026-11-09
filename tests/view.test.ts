import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dailyView } from '../src/lib/view';
import type { DashboardData } from '../src/lib/store';
const academic = JSON.parse(readFileSync('data/sources/academic.json', 'utf8'));
const jobs = JSON.parse(readFileSync('data/sources/jobs.json', 'utf8'));
const data: DashboardData = {
  date: '2026-11-12',
  today: '2026-11-08',
  fetchedAt: '2026-11-08T12:00:00Z',
  academic,
  jobs,
  plan: null,
  warnings: [],
};
test('daily view surfaces fixed conflicts without moving events and summarizes applications honestly', () => {
  const view = dailyView(data);
  assert.equal(view.events.length, 2);
  assert.equal(view.conflicts.length, 1);
  assert.equal(view.applications.active, 4);
  assert.equal(view.applications.total, 5);
  assert.equal(view.events[0].start, '2026-11-12T13:30:00-06:00');
  assert.equal(view.completed, 0);
});
test('completed generated task status overrides protected source status and missing sources stay safe', () => {
  const view = dailyView({
    ...data,
    plan: {
      date: data.date,
      timezone: 'America/Chicago',
      confirmed: true,
      confirmedAt: data.fetchedAt,
      summary: 'Done',
      priorities: [
        {
          id: 'p1',
          sourceId: 'task-lifeharness',
          title: 'Demo',
          reason: 'Done',
          status: 'completed',
        },
      ],
      blocks: [],
    },
  });
  assert.equal(
    view.academicTasks.find((t) => t.id === 'task-lifeharness')?.status,
    'completed',
  );
  assert.equal(view.completed, 1);
  const empty = dailyView({ ...data, academic: null, jobs: null });
  assert.equal(empty.events.length, 0);
  assert.equal(empty.applications.total, 0);
});
