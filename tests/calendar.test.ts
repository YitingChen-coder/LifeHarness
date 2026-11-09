import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calendarWeek,
  shiftCalendarDate,
  calendarEntries,
  layoutDay,
} from '../src/lib/calendar';
import { loadDashboard } from '../src/lib/store';
test('calendar dates stay on real Chicago calendar weeks around DST, month/year boundaries', () => {
  assert.deepEqual(calendarWeek('2026-11-01'), [
    '2026-10-26',
    '2026-10-27',
    '2026-10-28',
    '2026-10-29',
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
  ]);
  assert.equal(shiftCalendarDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftCalendarDate('2026-03-08', 1), '2026-03-09');
  assert.throws(() => calendarWeek('../../bad'));
});
test('calendar keeps fixed events without a plan, deduplicates planned fixed blocks and previews only one day', async () => {
  const day = await loadDashboard(process.cwd(), '2026-11-09');
  const fixed = day.academic!.events.find((e) => e.id === 'class-algo-mon')!;
  const plan = {
    date: day.date,
    timezone: 'America/Chicago' as const,
    confirmed: true as const,
    confirmedAt: '2026-11-09T08:00:00-06:00',
    summary: 'Study',
    priorities: [],
    blocks: [
      {
        id: 'fixed',
        sourceId: fixed.id,
        title: fixed.title,
        start: fixed.start,
        end: fixed.end,
        kind: 'class' as const,
        status: 'pending' as const,
      },
      {
        id: 'task',
        sourceId: 'task-algo',
        title: 'Study',
        start: '2026-11-09T09:00:00-06:00',
        end: '2026-11-09T10:00:00-06:00',
        kind: 'task' as const,
        status: 'pending' as const,
      },
    ],
  };
  assert.equal(
    calendarEntries([day]).filter((e) => e.sourceId === fixed.id).length,
    1,
  );
  assert.equal(
    calendarEntries([{ ...day, plan }]).filter((e) => e.sourceId === fixed.id)
      .length,
    1,
  );
  const preview = {
    ...plan,
    blocks: [
      ...plan.blocks.filter((b) => b.kind === 'class'),
      {
        ...plan.blocks[1],
        id: 'draft-study',
        start: '2026-11-09T14:00:00-06:00',
        end: '2026-11-09T15:00:00-06:00',
      },
    ],
  };
  const entries = calendarEntries([{ ...day, plan }], preview);
  assert.equal(entries.filter((e) => e.kind === 'task').length, 1);
  assert.equal(entries.find((e) => e.kind === 'task')!.draft, true);
  assert.equal(entries.find((e) => e.kind === 'class')!.draft, false);
});
test('overlapping events use separate lanes and a later nonoverlapping event regains full width', () => {
  const base = {
    date: '2026-11-10',
    kind: 'class' as const,
    draft: false,
    status: 'pending',
  };
  const values = [
    {
      ...base,
      id: 'a',
      title: 'A',
      start: '2026-11-10T13:00:00-06:00',
      end: '2026-11-10T14:00:00-06:00',
    },
    {
      ...base,
      id: 'b',
      title: 'B',
      start: '2026-11-10T13:30:00-06:00',
      end: '2026-11-10T14:30:00-06:00',
    },
    {
      ...base,
      id: 'c',
      title: 'C',
      start: '2026-11-10T15:00:00-06:00',
      end: '2026-11-10T16:00:00-06:00',
    },
  ];
  const result = layoutDay(values);
  assert.equal(result[0].lanes, 2);
  assert.equal(result[1].lanes, 2);
  assert.notEqual(result[0].lane, result[1].lane);
  assert.equal(result[2].lanes, 1);
  assert.equal(result[0].startMinute, 780);
});
