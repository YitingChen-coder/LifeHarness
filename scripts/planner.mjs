#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tools = ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Skill'];
try {
  const input = process.argv.slice(2);
  let date,
    check = false;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === '--date' && !date) {
      if (!input[i + 1] || input[i + 1].startsWith('--'))
        throw new Error('--date requires YYYY-MM-DD.');
      date = input[++i];
    } else if (input[i] === '--check' && !check) check = true;
    else
      throw new Error(
        'Usage: npm run planner -- [--date YYYY-MM-DD] [--check]',
      );
  }
  const demo = date !== undefined;
  if (
    demo &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date)
  )
    throw new Error('Invalid --date: use a real YYYY-MM-DD calendar date.');
  const actualDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  date ??= actualDate;
  const context =
    readFileSync(resolve(root, 'AGENTS.md'), 'utf8') +
    `\n\nLifeHarness launch context\nActual current time: ${new Date().toISOString()}. Actual Chicago date: ${actualDate}.\nPlanning date: ${date}. Explicit demo mode: ${demo}.\nUse actual current time for confirmation timestamps.\n`;
  const args = [
    '--append-system-prompt',
    context,
    '--no-chrome',
    '--tools',
    tools.join(','),
    '--allowedTools',
    tools.join(','),
    '--setting-sources',
    'project',
    '--settings',
    resolve(root, '.claude/settings.json'),
    '--strict-mcp-config',
    '--mcp-config',
    '{"mcpServers":{}}',
  ];
  if (check) {
    console.log(JSON.stringify({ date, demo, tools, context, args }, null, 2));
    process.exit(0);
  }
  for (const file of [
    '.claude/settings.json',
    'scripts/protect-data.mjs',
    'scripts/current-context.mjs',
    'data/sources/academic.json',
    'data/sources/jobs.json',
  ])
    if (!existsSync(resolve(root, file)))
      throw new Error(
        `Missing ${file}. Complete setup before starting the planner.`,
      );
  const version = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  if (version.error)
    throw new Error('Claude Code is not installed. See README for setup.');
  const match = version.stdout.match(/(\d+)\.(\d+)\.(\d+)/);
  if (
    !match ||
    Number(match[1]) < 2 ||
    (Number(match[1]) === 2 &&
      (Number(match[2]) < 1 ||
        (Number(match[2]) === 1 && Number(match[3]) < 295)))
  )
    throw new Error(
      'Claude Code >= 2.1.295 is required for fail-closed hooks.',
    );
  console.log(
    `LifeHarness · ${date}${demo ? ' · DEMO' : ''} · America/Chicago\nType “Good morning” to begin. Use /context to inspect loaded context.`,
  );
  const child = spawnSync('claude', args, { cwd: root, stdio: 'inherit' });
  if (child.error) throw child.error;
  process.exit(child.status ?? 1);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
