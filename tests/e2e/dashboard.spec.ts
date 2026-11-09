import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const hash = () =>
  createHash('sha256')
    .update(readFileSync('data/sources/academic.json'))
    .update(readFileSync('data/sources/jobs.json'))
    .digest('hex');
test('date controls, application details, conflict warnings and responsive layout', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/?date=2026-11-10');
  await expect(
    page.getByRole('heading', { name: 'Your schedule' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Systems Programming', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Northstar · technical interview', { exact: true }),
  ).toBeVisible();
  await page.getByText('View all 5 applications').click();
  await expect(page.getByText('Atlas Studio', { exact: true })).toBeVisible();
  await expect(page.getByText('rejected', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Morning check-in', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'npm run planner -- --date 2026-11-10',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Planning date').fill('2026-11-12');
  await expect(
    page.getByRole('status').filter({ hasText: 'overlaps' }),
  ).toBeVisible();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole('button', { name: 'Sample day' }).click();
  await expect(page.getByLabel('Planning date')).toHaveValue('2026-11-10');
  expect(errors).toEqual([]);
});
test('plan file changes appear within five seconds; bad data and outages retain last good content', async ({
  page,
}) => {
  const file = resolve('data/generated/2026-11-15.json'),
    backup = existsSync(file) ? readFileSync(file) : null,
    before = hash();
  const plan = {
    date: '2026-11-15',
    timezone: 'America/Chicago',
    confirmed: true,
    confirmedAt: new Date().toISOString(),
    summary: 'Browser test approved fixture',
    priorities: [
      {
        id: 'test-p1',
        sourceId: 'task-algo',
        title: 'Browser test focus block',
        reason: 'Explicitly synthetic test fixture',
        status: 'pending',
      },
    ],
    blocks: [
      {
        id: 'test-b1',
        sourceId: 'task-algo',
        title: 'Browser test study session',
        kind: 'task',
        status: 'pending',
        start: '2026-11-15T09:00:00-06:00',
        end: '2026-11-15T10:00:00-06:00',
      },
    ],
  };
  try {
    if (existsSync(file)) unlinkSync(file);
    await page.goto('/?date=2026-11-15');
    await expect(
      page.getByText('No confirmed check-in for this date'),
    ).toBeVisible();
    const start = Date.now();
    writeFileSync(file, JSON.stringify(plan));
    await expect(page.getByText('Browser test approved fixture')).toBeVisible({
      timeout: 5000,
    });
    console.log(`File-to-browser refresh: ${Date.now() - start} ms`);
    await expect(
      page.getByRole('heading', { name: 'Browser test study session' }),
    ).toBeVisible();
    writeFileSync(file, '{"partial":');
    await expect(
      page.getByRole('status').filter({ hasText: 'plan for' }),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Browser test approved fixture')).toBeVisible();
    await page.route('**/api/dashboard?*', (route) => route.abort());
    await expect(
      page.getByRole('status').filter({ hasText: 'Connection interrupted' }),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Browser test approved fixture')).toBeVisible();
    await page.unroute('**/api/dashboard?*');
    writeFileSync(
      file,
      JSON.stringify({
        ...plan,
        priorities: plan.priorities.map((p) => ({ ...p, status: 'completed' })),
        blocks: plan.blocks.map((b) => ({ ...b, status: 'completed' })),
      }),
    );
    await expect(page.getByText('Browser test focus block')).toHaveClass(
      'strike',
      { timeout: 5000 },
    );
    expect(hash()).toBe(before);
  } finally {
    if (backup) writeFileSync(file, backup);
    else if (existsSync(file)) unlinkSync(file);
  }
});
test('check-in dialog traps keyboard focus and returns it to the opener', async ({
  page,
}) => {
  await page.goto('/?date=2026-11-10');
  const opener = page.getByRole('button', {
    name: 'Morning check-in',
    exact: true,
  });
  await opener.click();
  await expect(
    page.getByRole('button', { name: 'Close check-in instructions' }),
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Got it' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Close check-in instructions' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});
test('all tracked tasks can be inspected and transient source errors retain the previous view', async ({
  page,
  request,
}) => {
  await page.goto('/?date=2026-11-10');
  await page.getByRole('button', { name: 'Show all 7 academic tasks' }).click();
  await expect(
    page.getByRole('heading', { name: 'Memory allocator lab', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Weekly notes & course review',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Show all 5 career tasks' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Tailor portfolio for Lumen',
      exact: true,
    }),
  ).toBeVisible();
  const response = await request.get('/api/dashboard?date=2026-11-10');
  const payload = await response.json();
  await page.route('**/api/dashboard?*', (route) =>
    route.fulfill({
      json: {
        ...payload,
        academic: null,
        jobs: null,
        plan: null,
        warnings: [
          'academic.json is missing, unreadable or invalid. Check the source file locally.',
          'jobs.json is missing, unreadable or invalid. Check the source file locally.',
        ],
      },
    }),
  );
  await expect(
    page.getByRole('status').filter({ hasText: 'academic.json' }),
  ).toBeVisible({ timeout: 5000 });
  await expect(
    page.getByRole('heading', { name: 'Memory allocator lab', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Tailor portfolio for Lumen',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Systems Programming', exact: true }),
  ).toBeVisible();
});
