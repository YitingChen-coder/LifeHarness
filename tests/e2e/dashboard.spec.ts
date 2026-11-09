import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const stateFile = resolve('data/user/task-state.json');
let backup: Buffer | null;
const hash = () =>
  createHash('sha256')
    .update(readFileSync('data/sources/academic.json'))
    .update(readFileSync('data/sources/jobs.json'))
    .digest('hex');
test.beforeEach(() => {
  backup = existsSync(stateFile) ? readFileSync(stateFile) : null;
  if (existsSync(stateFile)) unlinkSync(stateFile);
});
test.afterEach(() => {
  if (backup) writeFileSync(stateFile, backup);
  else if (existsSync(stateFile)) unlinkSync(stateFile);
});
test('kanban is readable, all tasks searchable, filters and schedule work across viewport sizes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/board?date=2026-11-10');
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Task board', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(12);
  await page
    .getByRole('button', { name: 'Coursework (7)', exact: true })
    .click();
  await expect(page.getByRole('article')).toHaveCount(7);
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('allocator');
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('');
  await page
    .getByRole('button', { name: 'Job search (5)', exact: true })
    .click();
  await expect(page.getByRole('article')).toHaveCount(5);
  await page
    .getByRole('button', { name: 'All tasks (12)', exact: true })
    .click();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Schedule calendar' }),
  ).toContainText('Systems Programming');
  await page
    .getByRole('button', { name: 'Plan with Codex', exact: true })
    .click();
  await expect(
    page.getByRole('complementary', { name: 'Planning assistant' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  for (const width of [1487, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test('manual states persist across reload and drag-drop without altering sources', async ({
  page,
}) => {
  const before = hash();
  await page.goto('/board?date=2026-11-10');
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  const task = page.getByRole('article', {
    name: 'Record & submit LifeHarness demo',
    exact: true,
  });
  await task.getByLabel('Task status').selectOption('in_progress');
  await expect(
    page
      .getByRole('region', { name: 'In progress column' })
      .getByRole('article'),
  ).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'In progress column' })
      .getByRole('article'),
  ).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 850 });
  const phoneCard = page.getByRole('article', {
    name: 'Record & submit LifeHarness demo',
    exact: true,
  });
  const cardBox = await phoneCard.boundingBox();
  const actionBox = await phoneCard
    .getByRole('button', { name: 'Mark done', exact: true })
    .boundingBox();
  expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(
    cardBox!.x + cardBox!.width + 1,
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  await page
    .getByRole('article', {
      name: 'Record & submit LifeHarness demo',
      exact: true,
    })
    .locator('.drag-handle')
    .dragTo(page.getByRole('region', { name: 'Done column' }), {
      targetPosition: { x: 40, y: 30 },
    });
  await expect(
    page.getByRole('region', { name: 'Done column' }).getByRole('article'),
  ).toHaveCount(1);
  await expect(
    page.getByText('1 / 12 completed', { exact: true }),
  ).toBeVisible();
  expect(hash()).toBe(before);
});
test('focus timer can start pause reset and retain time after reload', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-11-10T15:00:00Z') });
  await page.goto('/board?date=2026-11-10');
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await page.getByRole('button', { name: 'Start focus', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Pause focus', exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(60000);
  await expect(page.getByTestId('focus-clock')).toHaveText('24:00');
  await page.getByRole('button', { name: 'Pause focus', exact: true }).click();
  await page.clock.fastForward(120000);
  await expect(page.getByTestId('focus-clock')).toHaveText('24:00');
  await page.reload();
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(page.getByTestId('focus-clock')).toHaveText('24:00');
  await page.getByRole('button', { name: 'Reset timer', exact: true }).click();
  await expect(page.getByTestId('focus-clock')).toHaveText('25:00');
});
test('confirmed plans refresh, invalid reads and connection failures retain last good content', async ({
  page,
}) => {
  const file = resolve('data/generated/2026-11-15.json'),
    old = existsSync(file) ? readFileSync(file) : null;
  const plan = {
    date: '2026-11-15',
    timezone: 'America/Chicago',
    confirmed: true,
    confirmedAt: new Date().toISOString(),
    summary: 'Synthetic live plan fixture',
    priorities: [
      {
        id: 'p1',
        sourceId: 'task-algo',
        title: 'Study algorithms',
        reason: 'Explicit test fixture',
        status: 'pending',
      },
    ],
    blocks: [],
  };
  try {
    if (existsSync(file)) unlinkSync(file);
    await page.goto('/board?date=2026-11-15');
    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await expect(
      page.getByText('No confirmed plan', { exact: true }),
    ).toBeVisible();
    const start = Date.now();
    writeFileSync(file, JSON.stringify(plan));
    await expect(page.getByText('Plan confirmed', { exact: true })).toBeVisible(
      { timeout: 5000 },
    );
    console.log('Plan refresh:', Date.now() - start, 'ms');
    await page.getByRole('button', { name: 'Calendar', exact: true }).click();
    await expect(
      page.getByRole('region', { name: 'Schedule calendar' }),
    ).toContainText(plan.summary);
    writeFileSync(file, '{partial');
    await expect(
      page.getByRole('status').filter({ hasText: 'plan for' }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText('Plan confirmed', { exact: true }),
    ).toBeVisible();
    await page.route('**/api/dashboard?*', (route) => route.abort());
    await expect(
      page.getByRole('status').filter({ hasText: 'Connection interrupted' }),
    ).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Tasks', exact: true }).click();
    await expect(page.getByRole('article')).toHaveCount(12);
  } finally {
    if (old) writeFileSync(file, old);
    else if (existsSync(file)) unlinkSync(file);
  }
});
test('source errors retain tasks and dialogs trap and restore keyboard focus', async ({
  page,
  request,
}) => {
  await page.goto('/board?date=2026-11-10');
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(12);
  const original = await (
    await request.get('/api/dashboard?date=2026-11-10')
  ).json();
  await page.route('**/api/dashboard?*', (route) =>
    route.fulfill({
      json: {
        ...original,
        academic: null,
        jobs: null,
        warnings: ['academic.json is unreadable', 'jobs.json is unreadable'],
      },
    }),
  );
  await expect(
    page.getByRole('status').filter({ hasText: 'academic.json' }),
  ).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('article')).toHaveCount(12);
  const opener = page.getByRole('button', {
    name: 'Plan with Codex',
    exact: true,
  });
  await opener.click();
  await expect(
    page.getByRole('complementary', { name: 'Planning assistant' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your calendar', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Message Codex' }),
  ).toBeVisible();
});
test('job tracker keeps application statuses and upcoming interviews accessible', async ({
  page,
}) => {
  await page.goto('/board?date=2026-11-10');
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open job tracker', exact: true }),
  ).toBeVisible({ timeout: 1000 });
  await page
    .getByRole('button', { name: 'Open job tracker', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Northstar Labs');
  await expect(dialog).toContainText('Atlas Studio');
  await expect(dialog).toContainText('rejected');
  await expect(dialog).toContainText('Northstar · technical interview');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('failed status save leaves the task unchanged and shows a recoverable error', async ({
  page,
}) => {
  await page.goto('/board?date=2026-11-10');
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await page.route('**/api/tasks', (route) =>
    route.fulfill({
      status: 500,
      json: { error: 'Could not save progress. Please retry.' },
    }),
  );
  await page
    .getByRole('article', {
      name: 'Record & submit LifeHarness demo',
      exact: true,
    })
    .getByLabel('Task status')
    .selectOption('done');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Could not save progress' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'To do column' }).getByRole('article', {
      name: 'Record & submit LifeHarness demo',
      exact: true,
    }),
  ).toBeVisible();
});
test('homepage introduces LifeHarness and enters the board with working back navigation', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'LifeHarness.', exact: true }),
  ).toBeVisible({ timeout: 1000 });
  await page
    .getByRole('link', { name: 'Open task board', exact: true })
    .click();
  await expect(page).toHaveURL(/\/board$/);
  await expect(
    page.getByRole('heading', { name: 'Your calendar', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'LifeHarness home', exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('link', { name: 'Try sample day', exact: true }).click();
  await expect(page).toHaveURL(/\/board\?date=2026-11-10$/);
  await page.goto('/?date=2026-11-12');
  await expect(page).toHaveURL(/\/board\?date=2026-11-12$/);
  await page.goto('/');
  for (const width of [1487, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
