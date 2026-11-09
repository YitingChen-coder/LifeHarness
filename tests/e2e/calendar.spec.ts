import { test, expect } from '@playwright/test';

test('calendar opens directly beside the assistant, positions real events at their hours and remains usable during chat', async ({
  page,
}) => {
  await page.goto('/board?date=2026-11-10');
  const calendar = page.getByRole('region', { name: 'Schedule calendar' });
  const panel = page.getByRole('complementary', { name: 'Planning assistant' });
  await expect(calendar).toBeVisible();
  await expect(panel).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Open schedule', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const event = calendar
    .getByRole('button', { name: /^Algorithms, 10:30 AM to 11:50 AM/ })
    .first();
  await expect(event).toBeVisible();
  const position = await event.evaluate((e) => {
    const box = e.getBoundingClientRect();
    const day = e.parentElement!.getBoundingClientRect();
    return box.top - day.top;
  });
  // 10:30 is 2.5 hours after the grid's 08:00 start: not at the bottom of the day.
  expect(position).toBeGreaterThan(155);
  expect(position).toBeLessThan(165);
  const calBox = await calendar.boundingBox(),
    panelBox = await panel.boundingBox();
  expect(calBox!.x + calBox!.width).toBeLessThanOrEqual(panelBox!.x);
  await page
    .getByRole('button', { name: 'Thursday, November 12, 2026', exact: true })
    .click();
  await expect(page.getByLabel('Planning date')).toHaveValue('2026-11-12');
  await expect(calendar).toContainText('Overlapping commitments');
  await calendar.getByRole('button', { name: /Cedar/ }).click();
  await expect(
    page.getByText(
      'Overlaps another commitment. Fixed events have not been moved.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(12);
  await expect(
    page.getByRole('button', { name: 'Open schedule', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page
    .getByRole('button', { name: 'Coursework board', exact: true })
    .click();
  await expect(page.getByRole('article')).toHaveCount(7);
  await expect(panel).toBeVisible();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(calendar).toBeVisible();
  await page.getByRole('button', { name: 'Next week', exact: true }).click();
  await expect(page.getByLabel('Planning date')).toHaveValue('2026-11-19');
  await page
    .getByRole('button', { name: 'Previous week', exact: true })
    .click();
  await expect(page.getByLabel('Planning date')).toHaveValue('2026-11-12');
});

test('calendar displays a validated draft in place, discards without saving, and replaces it with confirmed blocks after explicit save', async ({
  page,
  request,
}) => {
  const date = '2026-11-10';
  const actual = await (await request.get('/api/calendar?date=' + date)).json();
  const state: any = {
    date,
    busy: false,
    messages: [],
    draft: null,
    saved: false,
    warning: null,
    connection: {
      ready: true,
      provider: 'Codex',
      message: 'Local ChatGPT account',
    },
  };
  let saved = false,
    confirmations = 0;
  const plan = {
    date,
    timezone: 'America/Chicago',
    confirmed: true,
    confirmedAt: new Date().toISOString(),
    summary: 'A clear focus block before class',
    priorities: [],
    blocks: [
      {
        id: 'focus-algo',
        sourceId: 'task-algo',
        title: 'Algorithms focus block',
        start: date + 'T09:00:00-06:00',
        end: date + 'T10:00:00-06:00',
        kind: 'task',
        status: 'pending',
      },
    ],
  };
  await page.route('**/api/calendar?*', (route) =>
    route.fulfill({
      json: saved
        ? {
            ...actual,
            days: actual.days.map((d: any) =>
              d.date === date ? { ...d, plan } : d,
            ),
          }
        : actual,
    }),
  );
  await page.route('**/api/planner**', (route) => {
    if (route.request().method() === 'POST') {
      const input = route.request().postDataJSON();
      if (input.action === 'message') {
        state.messages.push({
          role: 'assistant',
          text: 'Review this proposed focus block.',
        });
        state.draft = {
          id: crypto.randomUUID(),
          plan,
          carryOver: [],
          reflections: ['Study before class.'],
        };
      }
      if (input.action === 'discard') state.draft = null;
      if (input.action === 'confirm') {
        expect(input.draftId).toBe(state.draft.id);
        confirmations++;
        saved = true;
        state.draft = null;
        state.saved = true;
      }
    }
    return route.fulfill({ json: state });
  });
  await page.goto('/board?date=' + date);
  await page.getByRole('button', { name: 'Good morning', exact: true }).click();
  const calendar = page.getByRole('region', { name: 'Schedule calendar' });
  await expect(
    calendar.getByRole('button', { name: /^Draft: Algorithms focus block/ }),
  ).toBeVisible();
  await expect(calendar).toContainText('aren’t saved yet');
  expect(confirmations).toBe(0);
  await page.getByRole('button', { name: 'Don’t save', exact: true }).click();
  await expect(
    calendar.getByRole('button', { name: /^Draft: Algorithms focus block/ }),
  ).toHaveCount(0);
  expect(saved).toBe(false);
  await page
    .getByRole('textbox', { name: 'Message Codex' })
    .fill('Revise the plan');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page
    .getByRole('button', { name: 'Confirm & save', exact: true })
    .click();
  await expect(
    calendar.getByRole('button', { name: /^Algorithms focus block,/ }),
  ).toBeVisible({ timeout: 5000 });
  await expect(
    calendar.getByRole('button', { name: /^Draft: Algorithms focus block/ }),
  ).toHaveCount(0);
  await expect(calendar).toContainText(plan.summary);
  expect(confirmations).toBe(1);
});

test('calendar retains a marked last good week on refresh failure and phones start with a readable day view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/board?date=2026-11-10');
  await expect(
    page.getByRole('button', { name: 'Day', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const calendar = page.getByRole('region', { name: 'Schedule calendar' });
  const event = calendar.getByRole('button', { name: /^Systems Programming,/ });
  await expect(event).toBeVisible();
  await page.route('**/api/calendar?*', (route) => route.abort());
  await expect(
    calendar.getByRole('status').filter({ hasText: 'last available schedule' }),
  ).toBeVisible({ timeout: 5000 });
  await expect(event).toBeVisible();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole('button', { name: 'Plan with Codex', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Message Codex' }),
  ).toBeInViewport();
});
