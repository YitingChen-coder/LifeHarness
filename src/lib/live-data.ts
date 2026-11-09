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
  return {
    ...next,
    taskState: next.taskState ?? previous.taskState,
    academic: next.academic ?? previous.academic,
    jobs: next.jobs ?? previous.jobs,
    plan: next.plan ?? (keepPlan ? previous.plan : null),
    warnings,
  };
}
