#!/usr/bin/env node
// Real native Codex check-in; all generated writes target an inspected disposable fixture.
import {
  mkdtempSync,
  realpathSync,
  cpSync,
  mkdirSync,
  symlinkSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { tsImport } from 'tsx/esm/api';
import {
  nativePolicy,
  disableMcp,
  sessionEnvironment,
  prepareNativeWorkspace,
} from './codex-session.mjs';
const withUi = process.argv.includes('--with-ui');
if (process.argv.slice(2).some((arg) => arg !== '--with-ui'))
  throw new Error('Usage: verify-terminal-live [--with-ui]');
let uiServer, browser, page;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = realpathSync(
  mkdtempSync(join(tmpdir(), 'lifeharness-native-checkin-')),
);
const evidence = {
  checkedAt: new Date().toISOString(),
  mode: 'actual native Codex exec/resume, inspected isolated fixture',
  steps: [],
};
mkdirSync(join(root, 'artifacts'), { recursive: true });
const save = () =>
  writeFileSync(
    join(root, 'artifacts/terminal-live-verification.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  );
try {
  for (const p of [
    'scripts',
    'src/lib',
    'data/sources',
    '.codex',
    '.agents',
    'context',
  ])
    cpSync(join(root, p), join(fixture, p), { recursive: true });
  cpSync(join(root, 'AGENTS.md'), join(fixture, 'AGENTS.md'));
  mkdirSync(join(fixture, 'data/generated'));
  symlinkSync(join(root, 'node_modules'), join(fixture, 'node_modules'));
  assert.equal(spawnSync('git', ['init', '-q', fixture]).status, 0);
  const settings = JSON.parse(
    readFileSync(join(fixture, '.codex/hooks.json'), 'utf8'),
  );
  assert.equal(
    settings.hooks.PreToolUse[0].hooks[0].command,
    'node "$(git rev-parse --show-toplevel)/scripts/protect-data.mjs"',
  );
  assert.equal(
    settings.hooks.UserPromptSubmit[0].hooks[0].command,
    'node "$(git rev-parse --show-toplevel)/scripts/current-context.mjs"',
  );
  const context =
    readFileSync(join(fixture, 'AGENTS.md'), 'utf8') +
    '\nLifeHarness launch context. Planning date: 2026-11-10. Explicit demo mode. CWD data/generated. Use read clock for actual save timestamps. This is an isolated check-in verification; follow the normal morning workflow and wait for user agreement.';
  const cwd = join(fixture, 'data/generated');
  prepareNativeWorkspace(cwd);
  const policy = disableMcp(nativePolicy(cwd, context), fixture);
  const sourceHash = () =>
    createHash('sha256')
      .update(readFileSync(join(fixture, 'data/sources/academic.json')))
      .update(readFileSync(join(fixture, 'data/sources/jobs.json')))
      .digest('hex');
  const before = sourceHash();
  let thread;
  const run = (name, prompt) => {
    console.log('RUN:', name);
    const args = [
      ...policy,
      'exec',
      ...(thread ? ['resume', thread] : []),
      '--dangerously-bypass-hook-trust',
      '--json',
      prompt,
    ];
    const result = spawnSync('codex', args, {
      cwd,
      env: sessionEnvironment(),
      encoding: 'utf8',
      timeout: 180000,
      maxBuffer: 8 * 1024 * 1024,
    });
    writeFileSync(
      join(root, `artifacts/terminal-${name}.jsonl`),
      result.stdout ?? '',
    );
    if (result.error) throw result.error;
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(
      (result.stdout ?? '') + (result.stderr ?? ''),
      /unsupported permissionDecision|hook returned unsupported/i,
      'Native hook format error must not be treated as a pass',
    );
    const events = result.stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    thread ??= events.find((e) => e.type === 'thread.started')?.thread_id;
    assert.ok(thread, 'No native session id');
    assert.ok(
      events.some((e) => e.type === 'turn.completed'),
      'Native turn did not finish',
    );
    return events;
  };
  const generated = (name) => join(cwd, name);
  const noSavedFiles = () => {
    assert.equal(existsSync(generated('2026-11-10.json')), false);
    assert.equal(existsSync(generated('notes.json')), false);
  };
  const morning = run('morning', 'Good morning');
  noSavedFiles();
  const commands = morning
    .filter(
      (e) =>
        e.type === 'item.completed' && e.item?.type === 'command_execution',
    )
    .map((e) => e.item.command ?? '')
    .join('\n');
  assert.match(
    commands,
    /morning-check-in.*SKILL\.md|planner-files\.mjs.*read skill/,
    'No on-demand morning skill read after the unnamed natural trigger',
  );
  assert.match(commands, /read academic|academic\.json/);
  assert.match(commands, /read jobs|jobs\.json/);
  evidence.steps.push({
    step: 'Good morning automatically loads morning skill and both sources; asks questions without saving',
    passed: true,
  });
  save();
  run(
    'proposal',
    'My energy is high. I am available 09:00–18:00 except lunch 12:00–13:00 and every fixed source commitment (keep any later fixed class too). Prioritize the nearest coursework deadline and urgent Northstar interview preparation. No other constraints. Please propose my complete day now; do not save yet.',
  );
  noSavedFiles();
  evidence.steps.push({
    step: 'Answers produce a proposal, no plan or notes saved',
    passed: true,
  });
  save();
  run(
    'refusal',
    'Do not save this plan or notes yet. I am still reviewing the displayed proposal; keep it available for confirmation.',
  );
  noSavedFiles();
  evidence.steps.push({
    step: 'Explicit refusal leaves plan and notes unchanged',
    passed: true,
  });
  save();
  if (withUi) {
    assert.ok(
      existsSync(join(root, '.next/BUILD_ID')),
      'Build the app before the UI integration test',
    );
    cpSync(join(root, 'package.json'), join(fixture, 'package.json'));
    symlinkSync(join(root, '.next'), join(fixture, '.next'));
    const net = await import('node:net');
    const probe = net.createServer();
    await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    uiServer = spawn(
      process.execPath,
      [
        join(root, 'node_modules/next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
      ],
      { cwd: fixture, env: process.env, stdio: 'ignore' },
    );
    const url = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        const response = await fetch(url + '/api/dashboard?date=2026-11-10');
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'Isolated dashboard did not start');
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    });
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(url + '/board?date=2026-11-10');
    await page.locator('.calendar-event').first().waitFor();
    assert.equal(await page.locator('.plan-state.confirmed').count(), 0);
    await page.evaluate(() => {
      window.__assignmentSeenAt = null;
      const observer = new MutationObserver(() => {
        if (
          window.__assignmentSeenAt === null &&
          document.querySelector('.plan-state.confirmed')
        )
          window.__assignmentSeenAt = Date.now();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
  run(
    'confirmation',
    'I explicitly confirm the most recently displayed full plan for November 10. Save that agreed plan and update the notes now using the allowed helper, then report actual tool success.',
  );
  assert.ok(
    existsSync(generated('2026-11-10.json')),
    'No confirmed plan was saved',
  );
  assert.ok(existsSync(generated('notes.json')), 'No memory was saved');
  const { validateGeneratedWrite } = await tsImport(
    '../src/lib/protection.ts',
    import.meta.url,
  );
  for (const file of ['2026-11-10.json', 'notes.json'])
    assert.equal(
      (
        await validateGeneratedWrite(
          generated(file),
          readFileSync(generated(file), 'utf8'),
          fixture,
        )
      ).allowed,
      true,
    );
  const plan = JSON.parse(readFileSync(generated('2026-11-10.json'), 'utf8'));
  assert.equal(sourceHash(), before);
  if (withUi) {
    await page.locator('.plan-state.confirmed').waitFor({ timeout: 6000 });
    const seen = await page.evaluate(() => window.__assignmentSeenAt);
    const refreshMs = seen - statSync(generated('2026-11-10.json')).mtimeMs;
    assert.ok(
      refreshMs >= 0 && refreshMs <= 5000,
      `Dashboard refresh took ${refreshMs} ms`,
    );
    assert.equal(
      await page.locator('.calendar-event.task').count(),
      plan.blocks.filter((block) => block.kind === 'task').length,
    );
    await page.screenshot({
      path: join(root, 'artifacts/native-plan-dashboard.png'),
    });
    evidence.steps.push({
      step: 'Existing browser calendar automatically displays actual native CLI output',
      passed: true,
      refreshMs: Math.round(refreshMs),
    });
  }
  const audit = readFileSync(generated('.hook-audit.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  evidence.steps.push({
    step: 'Explicit agreement lets native Codex save validated plan and notes through the actual hook',
    passed: true,
    confirmedAt: plan.confirmedAt,
    blocks: plan.blocks.length,
    sourceHashesUnchanged: true,
    hookAllowRecords: audit.filter((e) => e.decision === 'allow').length,
  });
  console.log(
    'PASS: native Codex natural trigger → skill/source reads → questions → proposal → refusal → agreement → validated plan and memory.',
  );
} catch (error) {
  evidence.error = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  save();
  await browser?.close();
  if (uiServer) {
    uiServer.kill('SIGTERM');
    await new Promise((resolve) => {
      if (uiServer.exitCode !== null) resolve();
      else {
        uiServer.once('exit', resolve);
        setTimeout(resolve, 1000);
      }
    });
  }
  rmSync(fixture, { recursive: true, force: true });
}
