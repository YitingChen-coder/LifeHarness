#!/usr/bin/env node
import {
  readFile,
  lstat,
  readdir,
  writeFile,
  rename,
  rm,
} from 'node:fs/promises';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { tsImport } from 'tsx/esm/api';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reads = {
  academic: 'data/sources/academic.json',
  jobs: 'data/sources/jobs.json',
  notes: 'data/generated/notes.json',
  progress: 'data/user/task-state.json',
  schema: 'src/lib/schema.ts',
  skill: '.agents/skills/morning-check-in/SKILL.md',
};
async function safeRead(path) {
  const rel = relative(root, path);
  if (rel.startsWith('..')) throw new Error('Read outside project');
  let current = root;
  for (const part of rel.split('/')) {
    current = join(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || (stat.isFile() && stat.nlink > 1))
      throw new Error('Linked planner files are blocked');
  }
  const stat = await lstat(path);
  if (!stat.isFile() || stat.size > 131072)
    throw new Error('Invalid planner file');
  return await readFile(path, 'utf8');
}
try {
  const [mode, target, date, ...extra] = process.argv.slice(2);
  if (extra.length) throw new Error('Unexpected arguments');
  if (mode === 'read' && !date) {
    if (target === 'clock')
      console.log(
        JSON.stringify({
          now: new Date().toISOString(),
          timezone: 'America/Chicago',
          root,
        }),
      );
    else if (target === 'context')
      console.log(
        (await safeRead(join(root, 'context/planning.md'))) +
          '\n' +
          (await safeRead(join(root, 'context/output-format.md'))),
      );
    else if (target === 'history') {
      const names = (await readdir(join(root, 'data/generated')))
        .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
        .sort()
        .reverse()
        .slice(0, 10);
      const result = [];
      for (const name of names) {
        const value = JSON.parse(
          await safeRead(join(root, 'data/generated', name)),
        );
        result.push({ file: name, ...value });
      }
      console.log(JSON.stringify(result, null, 2));
    } else if (reads[target]) {
      try {
        console.log(await safeRead(join(root, reads[target])));
      } catch (e) {
        if (e.code === 'ENOENT' && ['notes', 'progress'].includes(target))
          console.log(JSON.stringify({ missing: true }));
        else throw e;
      }
    } else throw new Error('Unknown read target');
  } else if (
    mode === 'write' &&
    ((target === 'notes' && !date) ||
      (target === 'plan' && /^\d{4}-\d{2}-\d{2}$/.test(date ?? '')))
  ) {
    const path = join(
      root,
      'data/generated',
      target === 'notes' ? 'notes.json' : `${date}.json`,
    );
    let input = '';
    for await (const chunk of process.stdin) {
      input += chunk;
      if (Buffer.byteLength(input) > 131072)
        throw new Error('Output too large');
    }
    const { validateGeneratedWrite } = await tsImport(
      '../src/lib/protection.ts',
      import.meta.url,
    );
    const decision = await validateGeneratedWrite(path, input, root);
    if (!decision.allowed) throw new Error(decision.reason);
    const temp = join(root, 'data/generated', `.planner-${randomUUID()}.tmp`);
    try {
      await writeFile(temp, input.trim() + '\n', { flag: 'wx', mode: 0o600 });
      await rename(temp, path);
    } finally {
      await rm(temp, { force: true });
    }
    console.log(`Saved ${relative(root, path)}`);
  } else
    throw new Error(
      'Usage: planner-files read <name> | write plan YYYY-MM-DD | write notes',
    );
} catch (error) {
  console.error(`LifeHarness: ${error.message}`);
  process.exit(1);
}
