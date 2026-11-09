import { readFile, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, join, isAbsolute } from 'node:path';
import {
  academicSchema,
  jobsSchema,
  planSchema,
  notesSchema,
  validateReferences,
} from './schema';
import { chicagoDate } from './dates';
type Decision = { allowed: boolean; reason: string };
const deny = (reason: string): Decision => ({ allowed: false, reason });
const inside = (root: string, path: string) => {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};
async function safePath(root: string, target: string): Promise<boolean> {
  if (!inside(root, target)) return false;
  let current = root;
  for (const part of relative(root, target).split('/').filter(Boolean)) {
    current = join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink > 1))
        return false;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return false;
    }
  }
  return true;
}
export async function validateGeneratedWrite(
  filePath: string,
  content: string,
  projectRoot: string,
): Promise<Decision> {
  try {
    const root = await realpath(projectRoot);
    const input = { file_path: filePath, content };
    const lexicalRoot = resolve(projectRoot);
    const target = resolve(
        root,
        relative(lexicalRoot, resolve(lexicalRoot, input.file_path)),
      ),
      rel = relative(root, target);
    if (!/^data\/generated\/(?:\d{4}-\d{2}-\d{2}|notes)\.json$/.test(rel))
      return deny(
        'Protected file: write only dated plans or notes.json under data/generated',
      );
    if (!(await safePath(root, target)))
      return deny(
        'Unsafe path: links, hard links and directory traversal are blocked',
      );
    if (Buffer.byteLength(input.content) > 131072)
      return deny('Generated JSON exceeds 128 KiB');
    const parsed = JSON.parse(input.content);
    const academic = academicSchema.parse(
      JSON.parse(
        await readFile(join(root, 'data/sources/academic.json'), 'utf8'),
      ),
    );
    const jobs = jobsSchema.parse(
      JSON.parse(await readFile(join(root, 'data/sources/jobs.json'), 'utf8')),
    );
    if (rel.endsWith('/notes.json')) {
      const notes = notesSchema.parse(parsed);
      const ids = new Set([...academic.tasks, ...jobs.tasks].map((t) => t.id));
      if (!notes.carryOver.every((id) => ids.has(id)))
        return deny('Notes reference an unknown task');
    } else {
      const plan = planSchema.parse(parsed);
      if (rel !== `data/generated/${plan.date}.json`)
        return deny('Plan date must match filename');
      if (!validateReferences(plan, academic, jobs))
        return deny('Unknown source reference or changed fixed event');
      const fixed = [...academic.events, ...jobs.interviews].filter(
        (e) => chicagoDate(new Date(e.start)) === plan.date,
      );
      if (
        !fixed.every((e) =>
          plan.blocks.some(
            (b) =>
              b.sourceId === e.id && b.start === e.start && b.end === e.end,
          ),
        )
      )
        return deny(
          'Plan must preserve every fixed event on the selected date',
        );
    }
    return {
      allowed: true,
      reason:
        'Validated generated output. Save only after explicit user agreement.',
    };
  } catch (error) {
    return deny(
      `Cannot validate output: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
const readerNames = new Set([
  'academic',
  'jobs',
  'notes',
  'progress',
  'history',
  'context',
  'schema',
  'skill',
  'clock',
]);
export function commandWords(command: string): string[] | null {
  const words: string[] = [];
  let offset = 0;
  const pattern = /\s*('([^']*)'|"([^"$`\\]*)"|([A-Za-z0-9_./:@+\-=]+))/y;
  while (offset < command.length) {
    if (!command.slice(offset).trim()) break;
    pattern.lastIndex = offset;
    const match = pattern.exec(command);
    if (!match) return null;
    words.push(match[2] ?? match[3] ?? match[4]);
    offset = pattern.lastIndex;
  }
  return words;
}
export async function evaluateTool(
  event: unknown,
  projectRoot: string,
): Promise<Decision> {
  try {
    if (!event || typeof event !== 'object')
      return deny('Invalid hook payload');
    const {
      tool_name: name,
      tool_input: input,
      cwd,
    } = event as {
      tool_name?: string;
      tool_input?: Record<string, unknown>;
      cwd?: string;
    };
    if (name !== 'Bash' || !input)
      return deny(
        'Only the constrained planner file commands are enabled. Patches, other tools and source changes are blocked.',
      );
    const root = await realpath(projectRoot);
    const working = resolve(
      typeof input.workdir === 'string'
        ? input.workdir
        : typeof input.cwd === 'string'
          ? input.cwd
          : (cwd ?? join(root, 'data/generated')),
    );
    const raw = input.command ?? input.cmd;
    if (typeof raw !== 'string') return deny('Expected one shell command');
    const helper = join(root, 'scripts/planner-files.mjs');
    const isHelper = (words: string[]) =>
      ['node', process.execPath].includes(words[0]) &&
      resolve(working, words[1] ?? '') === helper;
    const write = raw.match(
      /^([^\n]+?) <<'LIFEHARNESS_JSON'\r?\n([\s\S]*)\r?\nLIFEHARNESS_JSON\s*$/,
    );
    if (write) {
      const words = commandWords(write[1]);
      if (!words || !isHelper(words) || words[2] !== 'write')
        return deny('Use only the quoted LifeHarness JSON writer');
      let file: string;
      if (words.length === 4 && words[3] === 'notes') file = 'notes.json';
      else if (words.length === 5 && words[3] === 'plan')
        file = `${words[4]}.json`;
      else return deny('Invalid generated output target');
      return await validateGeneratedWrite(
        join(root, 'data/generated', file),
        write[2],
        root,
      );
    }
    const words = commandWords(raw);
    if (!words)
      return deny(
        'Shell operators, substitutions and arbitrary commands are blocked',
      );
    if (
      isHelper(words) &&
      words.length === 4 &&
      words[2] === 'read' &&
      readerNames.has(words[3])
    )
      return { allowed: true, reason: 'Constrained planner read' };
    if (words[0] === 'cat' && words.length >= 2) {
      const paths = words.slice(1);
      if (paths[0] === '--') paths.shift();
      const allowed = new Set([
        'AGENTS.md',
        '.agents/skills/morning-check-in/SKILL.md',
        'context/planning.md',
        'context/output-format.md',
        'src/lib/schema.ts',
        'data/sources/academic.json',
        'data/sources/jobs.json',
        'data/user/task-state.json',
        'data/generated/notes.json',
      ]);
      if (
        paths.length &&
        (await Promise.all(
          paths.map(async (raw) => {
            const path = resolve(working, raw);
            const rel = relative(root, path);
            return (
              (allowed.has(rel) ||
                /^data\/generated\/\d{4}-\d{2}-\d{2}\.json$/.test(rel)) &&
              (await safePath(root, path))
            );
          }),
        ).then((values) => values.every(Boolean)))
      )
        return { allowed: true, reason: 'Curated read-only planner files' };
    }
    return deny(
      'Protected workspace: use planner-files read, or its validated quoted-JSON writer after confirmation.',
    );
  } catch (error) {
    return deny(
      `Cannot validate operation: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
