import { chicagoDate, chicagoMinutes, validDate } from './dates';
import type { DashboardData } from './store';
import type { Plan } from './schema';
import { boardTasks } from './board';
export type CalendarEntry = {
  id: string;
  sourceId?: string;
  date: string;
  title: string;
  start: string;
  end: string;
  kind: 'class' | 'interview' | 'task' | 'break';
  draft: boolean;
  status: string;
  location?: string;
};
export type WeekData = { start: string; days: DashboardData[] };
export function shiftCalendarDate(date: string, amount: number) {
  if (!validDate(date) || !Number.isInteger(amount))
    throw new Error('Invalid calendar date');
  const value = new Date(date + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}
export function calendarWeek(date: string) {
  if (!validDate(date)) throw new Error('Invalid calendar date');
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  const monday = shiftCalendarDate(date, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftCalendarDate(monday, i));
}
export function calendarEntries(
  days: DashboardData[],
  preview?: Plan | null,
): CalendarEntry[] {
  const result: CalendarEntry[] = [];
  for (const day of days) {
    const fixed = [
      ...(day.academic?.events ?? []),
      ...(day.jobs?.interviews ?? []),
    ].filter((e) => chicagoDate(new Date(e.start)) === day.date);
    for (const event of fixed)
      result.push({
        ...event,
        sourceId: event.id,
        date: day.date,
        draft: false,
        status: 'pending',
      });
    const progress = new Map(
      boardTasks(day).map((task) => [task.id, task.status]),
    );
    const plan = preview?.date === day.date ? preview : day.plan;
    for (const block of plan?.blocks ?? []) {
      if (
        (block.kind === 'class' || block.kind === 'interview') &&
        fixed.some((e) => e.id === block.sourceId)
      )
        continue;
      result.push({
        ...block,
        status:
          block.kind === 'task' &&
          block.sourceId &&
          progress.has(block.sourceId)
            ? progress.get(block.sourceId) === 'done'
              ? 'completed'
              : 'pending'
            : block.status,
        date: day.date,
        draft: plan === preview,
      });
    }
  }
  return result.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}
export type PositionedEntry = CalendarEntry & {
  startMinute: number;
  endMinute: number;
  lane: number;
  lanes: number;
  conflict: boolean;
};
export function layoutDay(entries: CalendarEntry[]): PositionedEntry[] {
  const sorted = entries
    .map((event) => ({
      ...event,
      startMinute: chicagoMinutes(event.start),
      endMinute:
        chicagoDate(new Date(event.end)) > event.date
          ? 1440
          : chicagoMinutes(event.end),
      lane: 0,
      lanes: 1,
      conflict: false,
    }))
    .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);
  let group: PositionedEntry[] = [];
  let groupEnd = -1;
  const flush = () => {
    if (!group.length) return;
    const lanes = Math.max(...group.map((e) => e.lane)) + 1;
    for (const e of group) {
      e.lanes = lanes;
      e.conflict = group.some(
        (other) =>
          other !== e &&
          e.startMinute < other.endMinute &&
          e.endMinute > other.startMinute,
      );
    }
    group = [];
  };
  for (const event of sorted) {
    if (event.startMinute >= groupEnd) {
      flush();
      groupEnd = -1;
    }
    const used = new Set(
      group.filter((e) => e.endMinute > event.startMinute).map((e) => e.lane),
    );
    while (used.has(event.lane)) event.lane++;
    group.push(event);
    groupEnd = Math.max(groupEnd, event.endMinute);
  }
  flush();
  return sorted;
}
