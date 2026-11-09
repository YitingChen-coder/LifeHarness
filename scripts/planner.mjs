#!/usr/bin/env node
import { readFileSync, existsSync, realpathSync, lstatSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = realpathSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '..'),
);
try {
  let date,
    check = false;
  const input = process.argv.slice(2);
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
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  date ??= today;
  const cwd = join(root, 'data/generated');
  const context =
    readFileSync(join(root, 'AGENTS.md'), 'utf8') +
    `\nLifeHarness launch context\nRepository root: ${root}\nPlanning date: ${date}. Explicit demo mode: ${demo}. Actual Chicago date: ${today}.\nActual launch time: ${new Date().toISOString()}. Read the live clock for saves.\nCWD is data/generated. Use ../../scripts/planner-files.mjs for reads and confirmed writes.\nInitialize the planner without writing files, then wait for the user's morning request.\n`;
  const args = [
    '--no-daemon',
    '--cd',
    cwd,
    '--sandbox',
    'workspace-write',
    '--ask-for-approval',
    'never',
    '-c',
    'sandbox_workspace_write.writable_roots=[]',
    '-c',
    'sandbox_workspace_write.network_access=false',
    '-c',
    'sandbox_workspace_write.exclude_slash_tmp=true',
    '-c',
    'sandbox_workspace_write.exclude_tmpdir_env_var=true',
    '-c',
    'plugins._default.enabled=false',
    '-c',
    'web_search="disabled"',
    '-c',
    'features.multi_agent=false',
    '-c',
    'features.shell_snapshot=false',
    '-c',
    `developer_instructions=${JSON.stringify(context)}`,
  ];
  if (check) {
    console.log(
      JSON.stringify(
        { binary: 'codex', date, demo, cwd, context, args },
        null,
        2,
      ),
    );
    process.exit(0);
  }
  for (const path of [
    '.codex/config.toml',
    '.codex/hooks.json',
    '.agents/skills/morning-check-in/SKILL.md',
    'scripts/protect-data.mjs',
    'scripts/planner-files.mjs',
    'data/sources/academic.json',
    'data/sources/jobs.json',
  ])
    if (!existsSync(join(root, path)))
      throw new Error(`Missing ${path}. Complete setup first.`);
  if (lstatSync(cwd).isSymbolicLink() || realpathSync(cwd) !== cwd)
    throw new Error(
      'Generated directory must be a real project directory, not a link.',
    );
  const version = spawnSync('codex', ['--version'], { encoding: 'utf8' });
  if (version.error) throw new Error('Codex CLI is not installed.');
  const match = version.stdout.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match || (Number(match[1]) === 0 && Number(match[2]) < 160))
    throw new Error('Codex CLI >=0.160.0 is required.');
  // Enumerate names only in memory; never print MCP command/env credentials.
  const mcp = spawnSync('codex', ['mcp', 'list', '--json'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  if (mcp.status !== 0)
    throw new Error(
      'Could not inspect MCP configuration; refusing an uncontrolled planner launch.',
    );
  for (const server of JSON.parse(mcp.stdout)) {
    if (typeof server.name !== 'string')
      throw new Error('Invalid MCP configuration');
    args.push('-c', `mcp_servers.${JSON.stringify(server.name)}.enabled=false`);
  }
  const probe = spawnSync(
    'codex',
    [
      'sandbox',
      '-P',
      ':workspace',
      '-C',
      cwd,
      '-c',
      'sandbox_workspace_write.writable_roots=[]',
      '--',
      process.execPath,
      '-e',
      `const fs=require('fs');try{const fd=fs.openSync(${JSON.stringify(join(root, 'data/sources/academic.json'))},'a');fs.closeSync(fd);process.exit(3);}catch(e){if(!['EPERM','EACCES','EROFS'].includes(e.code))throw e;}`,
    ],
    { encoding: 'utf8' },
  );
  if (probe.status !== 0)
    throw new Error(
      'OS source-protection preflight failed; planner was not started.',
    );
  console.log(
    `LifeHarness · Codex · ${date}${demo ? ' · DEMO' : ''} · America/Chicago\nUse /hooks to review/trust project hooks on first launch.\nSay “Good morning” to begin. Source data are protected by the OS sandbox.`,
  );
  const child = spawnSync('codex', args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, TSX_DISABLE_CACHE: '1' },
  });
  if (child.error) throw child.error;
  process.exit(child.status ?? 1);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
