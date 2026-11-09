import type { DashboardData } from './store';
export function mergeLastGood(
  previous: DashboardData | null,
  next: DashboardData,
): DashboardData {
  if (!previous || previous.date !== next.date) return next;
  const warnings = [...next.warnings];
  if (!next.academic && previous.academic)
    warnings.push(
      'Showing last valid academic data until the source can be read again.',
    );
  if (!next.jobs && previous.jobs)
    warnings.push(
      'Showing last valid career data until the source can be read again.',
    );
  const keepPlan =
    next.warnings.some((w) => w.startsWith('The plan')) ||
    !next.academic ||
    !next.jobs;
  const history = { ...previous.completedHistory };
  for (const [id, stamp] of Object.entries(next.completedHistory ?? {}))
    if (!history[id] || Date.parse(stamp) > Date.parse(history[id]))
      history[id] = stamp;
  return {
    ...next,
    completedHistory:
      next.warnings.some(
        (w) =>
          w.includes('completion history') ||
          w.startsWith('Completion history'),
      ) ||
      !next.academic ||
      !next.jobs
        ? history
        : next.completedHistory,
    taskState:
      Date.parse(previous.fetchedAt) > Date.parse(next.fetchedAt)
        ? previous.taskState
        : (next.taskState ?? previous.taskState),
    academic: next.academic ?? previous.academic,
    jobs: next.jobs ?? previous.jobs,
    plan: next.plan ?? (keepPlan ? previous.plan : null),
    warnings,
  };
}
