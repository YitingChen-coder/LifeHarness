import { z } from 'zod';
import {
  readFile,
  lstat,
  mkdir,
  writeFile,
  rename,
  rm,
  realpath,
} from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { academicSchema, jobsSchema } from './schema';
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export const taskStateSchema = z
  .object({
    version: z.literal(1),
    tasks: z.record(
      z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
      z
        .object({
          status: taskStatusSchema,
          updatedAt: z.iso.datetime({ offset: true }),
        })
        .strict(),
    ),
  })
  .strict();
export type TaskState = z.infer<typeof taskStateSchema>;
const empty = (): TaskState => ({ version: 1, tasks: {} });
async function safeStatePath(root: string) {
  const canonical = await realpath(root);
  for (const path of ['data', 'data/user', 'data/user/task-state.json']) {
    try {
      const stat = await lstat(join(canonical, path));
      if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink > 1))
        throw new Error('Unsafe task-state path');
      if (path.endsWith('.json') && (!stat.isFile() || stat.size > 131072))
        throw new Error('Invalid task-state file');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  return join(canonical, 'data/user/task-state.json');
}
export async function readTaskState(root: string): Promise<TaskState> {
  const file = await safeStatePath(root);
  try {
    return taskStateSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return empty();
    throw error;
  }
}
const queues = new Map<string, Promise<unknown>>();
export async function writeTaskStatus(
  root: string,
  id: string,
  status: TaskStatus,
): Promise<TaskState> {
  taskStatusSchema.parse(status);
  const key = await realpath(root);
  const previous = queues.get(key) ?? Promise.resolve();
  const operation = previous
    .catch(() => {})
    .then(async () => {
      const academic = academicSchema.parse(
        JSON.parse(
          await readFile(join(key, 'data/sources/academic.json'), 'utf8'),
        ),
      );
      const jobs = jobsSchema.parse(
        JSON.parse(await readFile(join(key, 'data/sources/jobs.json'), 'utf8')),
      );
      if (![...academic.tasks, ...jobs.tasks].some((task) => task.id === id))
        throw new Error('Unknown task ID');
      const file = await safeStatePath(key),
        state = await readTaskState(key);
      state.tasks[id] = { status, updatedAt: new Date().toISOString() };
      const content =
        JSON.stringify(taskStateSchema.parse(state), null, 2) + '\n';
      if (Buffer.byteLength(content) > 131072)
        throw new Error('Task progress exceeds size limit');
      await mkdir(join(key, 'data/user'), { recursive: true });
      await safeStatePath(key);
      const temp = join(key, 'data/user', `.task-state-${randomUUID()}.tmp`);
      try {
        await writeFile(temp, content, { flag: 'wx', mode: 0o600 });
        await rename(temp, file);
      } finally {
        await rm(temp, { force: true });
      }
      return state;
    });
  queues.set(key, operation);
  try {
    return await operation;
  } finally {
    if (queues.get(key) === operation) queues.delete(key);
  }
}
