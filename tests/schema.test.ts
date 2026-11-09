import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  academicSchema,
  jobsSchema,
  planSchema,
  notesSchema,
} from '../src/lib/schema';
import { chicagoDate, validDate, timeLabel } from '../src/lib/dates';
const academic = JSON.parse(readFileSync('data/sources/academic.json', 'utf8'));
const jobs = JSON.parse(readFileSync('data/sources/jobs.json', 'utf8'));
export const plan = {
  date: '2026-11-10',
  timezone: 'America/Chicago',
  confirmed: true,
  confirmedAt: '2026-11-10T08:30:00-06:00',
  summary: 'Finish the demo and prepare for tomorrow.',
  priorities: [
    {
      id: 'p1',
      sourceId: 'task-lifeharness',
      title: 'Finish demo',
      reason: 'Due today',
      status: 'pending',
    },
  ],
  blocks: [
    {
      id: 'b1',
      sourceId: 'task-lifeharness',
      title: 'Record demo',
      start: '2026-11-10T09:00:00-06:00',
      end: '2026-11-10T10:30:00-06:00',
      kind: 'task',
      status: 'pending',
    },
  ],
};
test('synthetic sources parse and reject dangling references / duplicate IDs', () => {
  assert.equal(academicSchema.parse(academic).courses.length, 3);
  assert.equal(jobsSchema.parse(jobs).interviews.length, 2);
  assert.equal(
    academicSchema.safeParse({
      ...academic,
      tasks: [{ ...academic.tasks[0], courseId: 'missing' }],
    }).success,
    false,
  );
  assert.equal(
    jobsSchema.safeParse({ ...jobs, tasks: [...jobs.tasks, jobs.tasks[0]] })
      .success,
    false,
  );
  assert.equal(
    jobsSchema.safeParse({
      ...jobs,
      interviews: [{ ...jobs.interviews[0], applicationId: 'missing' }],
    }).success,
    false,
  );
});
test('dates reject traversal, normalized impossible dates and use Chicago around DST', () => {
  for (const value of ['../../secret', '2026-02-30', '2026-11-31', '2026-1-01'])
    assert.equal(validDate(value), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(chicagoDate(new Date('2026-11-09T05:30:00Z')), '2026-11-08');
  assert.equal(chicagoDate(new Date('2026-03-09T05:30:00Z')), '2026-03-09');
  assert.equal(timeLabel('2026-11-10T15:00:00Z'), '9:00 AM');
});
test('plans require confirmation, correct Chicago dates, ordered nonoverlapping blocks and lunch free', () => {
  assert.equal(planSchema.safeParse(plan).success, true);
  for (const patch of [
    { confirmed: false },
    { date: '2026-02-30' },
    { confirmedAt: 'tomorrow' },
  ])
    assert.equal(planSchema.safeParse({ ...plan, ...patch }).success, false);
  const block = plan.blocks[0];
  for (const patch of [
    { end: block.start },
    { start: '2026-11-10T12:00:00-06:00', end: '2026-11-10T13:00:00-06:00' },
    { start: '2026-11-10T08:00:00-06:00' },
    { end: '2026-11-11T10:00:00-06:00' },
    { end: '2026-11-10T19:00:00-06:00' },
  ])
    assert.equal(
      planSchema.safeParse({ ...plan, blocks: [{ ...block, ...patch }] })
        .success,
      false,
    );
  assert.equal(
    planSchema.safeParse({ ...plan, blocks: [block, { ...block, id: 'b2' }] })
      .success,
    false,
  );
  assert.equal(
    planSchema.safeParse({
      ...plan,
      blocks: [
        {
          ...block,
          kind: 'class',
          start: '2026-11-10T17:30:00-06:00',
          end: '2026-11-10T18:50:00-06:00',
        },
      ],
    }).success,
    true,
  );
});
test('notes are bounded structured memory', () => {
  assert.equal(
    notesSchema.safeParse({
      updatedAt: plan.confirmedAt,
      carryOver: ['task-algo'],
      reflections: ['Protect lunch.'],
    }).success,
    true,
  );
  assert.equal(
    notesSchema.safeParse({
      updatedAt: 'yesterday',
      carryOver: [],
      reflections: [],
    }).success,
    false,
  );
});
