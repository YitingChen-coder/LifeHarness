import { lstat, readFile, realpath, readdir } from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { z } from 'zod';
import {
  academicSchema,
  jobsSchema,
  planSchema,
  validateReferences,
  type Academic,
  type Jobs,
  type Plan,
} from './schema';
import { chicagoDate, validDate } from './dates';
import { readTaskState, type TaskState } from './task-state';
export type DashboardData = {
  date: string;
  today: string;
  fetchedAt: string;
  academic: Academic | null;
  jobs: Jobs | null;
  plan: Plan | null;
  warnings: string[];
  taskState?: TaskState;
  completedHistory?: Record<string, string>;
};
async function readJson(root: string, path: string): Promise<unknown> {
  const file = join(root, path),
    canonical = await realpath(file),
    rel = relative(await realpath(root), canonical);
  if (isAbsolute(rel) || rel.startsWith('..'))
    throw new Error('Path escapes project');
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 131072)
    throw new Error('Unsafe or oversized file');
  return JSON.parse(await readFile(file, 'utf8'));
}
export async function loadDashboard(
  root: string,
  date: string = chicagoDate(),
): Promise<DashboardData> {
  if (!validDate(date))
    throw new Error('Invalid date. Use a real YYYY-MM-DD calendar date.');
  const warnings: string[] = [];
  async function source<T>(
    name: string,
    schema: z.ZodType<T>,
  ): Promise<T | null> {
    try {
      return schema.parse(await readJson(root, `data/sources/${name}.json`));
    } catch {
      warnings.push(
        `${name}.json is missing, unreadable or invalid. Check the source file locally.`,
      );
      return null;
    }
  }
  const [academic, jobs] = await Promise.all([
    source('academic', academicSchema),
    source('jobs', jobsSchema),
  ]);
  let plan: Plan | null = null;
  try {
    const parsed = planSchema.parse(
      await readJson(root, `data/generated/${date}.json`),
    );
    if (
      parsed.date !== date ||
      !academic ||
      !jobs ||
      !validateReferences(parsed, academic, jobs)
    )
      throw new Error('Plan references do not match sources');
    const fixed = [...academic.events, ...jobs.interviews].filter(
      (e) => chicagoDate(new Date(e.start)) === date,
    );
    if (
      !fixed.every((e) =>
        parsed.blocks.some(
          (b) => b.sourceId === e.id && b.start === e.start && b.end === e.end,
        ),
      )
    )
      throw new Error('Missing fixed event');
    plan = parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      warnings.push(
        `The plan for ${date} is unreadable or invalid. Last confirmed content may still be available locally; ask Codex to repair it after confirmation.`,
      );
  }
  const completedHistory: Record<string, string> = {};
  if (academic && jobs) {
    try {
      const names = (await readdir(join(root, 'data/generated'))).filter(
        (name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name),
      );
      let invalidHistory = false;
      for (let index = 0; index < names.length; index += 20) {
        await Promise.all(
          names.slice(index, index + 20).map(async (name) => {
            try {
              const saved = planSchema.parse(
                await readJson(root, `data/generated/${name}`),
              );
              if (
                `${saved.date}.json` !== name ||
                !validateReferences(saved, academic, jobs)
              )
                throw new Error('Invalid saved plan');
              for (const item of [...saved.priorities, ...saved.blocks])
                if (item.status === 'completed' && item.sourceId) {
                  const previous = completedHistory[item.sourceId];
                  if (
                    !previous ||
                    Date.parse(saved.confirmedAt) > Date.parse(previous)
                  )
                    completedHistory[item.sourceId] = saved.confirmedAt;
                }
            } catch {
              invalidHistory = true;
            }
          }),
        );
      }
      if (invalidHistory)
        warnings.push(
          'Some saved plans could not be read for completion history. Showing the last available progress.',
        );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        warnings.push(
          'Completion history could not be read. Showing the last available progress.',
        );
    }
  }
  let taskState: TaskState | undefined;
  try {
    taskState = await readTaskState(root);
  } catch {
    warnings.push(
      'Task progress is unreadable. Showing the last available progress; retrying automatically.',
    );
  }
  return {
    taskState,
    completedHistory,
    date,
    today: chicagoDate(),
    fetchedAt: new Date().toISOString(),
    academic,
    jobs,
    plan,
    warnings,
  };
}
