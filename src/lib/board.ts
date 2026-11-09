import type { DashboardData } from './store';
import type { TaskStatus } from './task-state';
import { chicagoDate } from './dates';
export type BoardTask = {
  id: string;
  title: string;
  label: string;
  context: string;
  domain: 'academic' | 'career';
  due: string;
  durationMinutes: number;
  status: TaskStatus;
  kind: string;
  priority: boolean;
};
export function boardTasks(data: DashboardData): BoardTask[] {
  const completed = new Set(
    [...(data.plan?.priorities ?? []), ...(data.plan?.blocks ?? [])]
      .filter((p) => p.status === 'completed')
      .map((p) => p.sourceId),
  );
  const priorities = new Set(
    (data.plan?.priorities ?? []).map((p) => p.sourceId),
  );
  function status(id: string, source: string): TaskStatus {
    const saved = data.taskState?.tasks[id];
    if (
      saved &&
      (!completed.has(id) ||
        Date.parse(saved.updatedAt) >= Date.parse(data.plan!.confirmedAt))
    )
      return saved.status;
    return completed.has(id) || source === 'completed'
      ? 'done'
      : (saved?.status ?? 'todo');
  }
  return [
    ...(data.academic?.tasks ?? []).map((t) => ({
      ...t,
      label:
        data.academic?.courses.find((c) => c.id === t.courseId)?.code ??
        'Coursework',
      context:
        data.academic?.courses.find((c) => c.id === t.courseId)?.name ?? '',
      domain: 'academic' as const,
      status: status(t.id, t.status),
      priority: priorities.has(t.id),
    })),
    ...(data.jobs?.tasks ?? []).map((t) => ({
      ...t,
      label:
        data.jobs?.applications.find((a) => a.id === t.applicationId)
          ?.company ?? 'Job search',
      context:
        data.jobs?.applications.find((a) => a.id === t.applicationId)?.role ??
        '',
      domain: 'career' as const,
      status: status(t.id, t.status),
      priority: priorities.has(t.id),
    })),
  ].sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
}
export function filterTasks(
  tasks: BoardTask[],
  options: {
    query: string;
    domain: 'all' | 'academic' | 'career';
    due: 'all' | 'today' | 'urgent';
    date: string;
  },
): BoardTask[] {
  const query = options.query.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      (options.domain === 'all' || t.domain === options.domain) &&
      (!query ||
        `${t.title} ${t.label} ${t.context}`.toLowerCase().includes(query)) &&
      (options.due === 'all' ||
        (options.due === 'today'
          ? chicagoDate(new Date(t.due)) === options.date
          : chicagoDate(new Date(t.due)) <= options.date)),
  );
}
