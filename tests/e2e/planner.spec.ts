import { test, expect } from '@playwright/test';
const date = '2026-11-10';
const initial = () => ({
  date,
  busy: false,
  messages: [] as { role: string; text: string }[],
  draft: null as any,
  saved: false,
  warning: null,
  connection: {
    ready: true,
    provider: 'Codex · ChatGPT account',
    message: 'Uses the locally signed-in ChatGPT account.',
  },
});
const draft = {
  id: '12345678-1234-4234-8234-123456789012',
  plan: {
    date,
    timezone: 'America/Chicago',
    confirmed: true,
    confirmedAt: '2026-11-09T06:00:00Z',
    summary: 'Make steady progress before class',
    priorities: [
      {
        id: 'p1',
        sourceId: 'task-algo',
        title: 'Algorithms homework',
        reason: 'Deadline approaching',
        status: 'pending',
      },
    ],
    blocks: [
      {
        id: 'b1',
        sourceId: 'task-algo',
        title: 'Algorithms homework',
        start: '2026-11-10T09:00:00-06:00',
        end: '2026-11-10T10:00:00-06:00',
        kind: 'task',
        status: 'pending',
      },
    ],
  },
  carryOver: ['task-algo'],
  reflections: ['Complete a focused study block.'],
};
test('page check-in supports questions, visible proposal, discard and explicit confirmation on phone and desktop', async ({
  page,
}) => {
  let state = initial();
  const actions: string[] = [];
  await page.route('**/api/planner**', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: state });
    const body = route.request().postDataJSON();
    actions.push(body.action);
    if (body.action === 'message') {
      state.messages.push({ role: 'user', text: body.message });
      if (state.messages.length === 1) {
        state.messages.push({
          role: 'assistant',
          text: 'How is your energy today?',
        });
        state.draft = null;
      } else {
        state.messages.push({
          role: 'assistant',
          text: 'Here is a proposed plan. Review it before saving.',
        });
        state.draft = { ...draft, id: crypto.randomUUID() };
      }
    } else if (body.action === 'discard') {
      state.draft = null;
      state.messages.push({
        role: 'assistant',
        text: 'Proposal discarded. Saved files are unchanged.',
      });
    } else if (body.action === 'confirm') {
      expect(body.draftId).toBe(state.draft?.id);
      expect(body.plan).toBeUndefined();
      state.saved = true;
      state.draft = null;
      state.messages.push({ role: 'assistant', text: 'Plan and notes saved.' });
    } else if (body.action === 'reset') state = initial();
    return route.fulfill({ json: state });
  });
  await page.goto('/board?date=' + date);
  await page
    .getByRole('button', { name: 'Plan with Codex', exact: true })
    .click();
  await expect(page.getByRole('dialog')).not.toContainText('terminal');
  await page.getByRole('button', { name: 'Good morning', exact: true }).click();
  await expect(page.getByRole('log')).toContainText(
    'How is your energy today?',
  );
  const composer = page.getByRole('textbox', { name: 'Message Codex' });
  await composer.fill('High energy, focus on coursework.');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Proposed plan' }),
  ).toContainText('PROPOSED · NOT SAVED');
  expect(actions).not.toContain('confirm');
  await page.getByRole('button', { name: 'Don’t save', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Proposed plan' })).toHaveCount(
    0,
  );
  await composer.fill('Please make a revised plan');
  await composer.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Confirm & save', exact: true }),
  ).toBeVisible();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const box = await page.getByRole('dialog').boundingBox();
    expect(box!.width).toBeLessThanOrEqual(width);
  }
  await page
    .getByRole('button', { name: 'Confirm & save', exact: true })
    .click();
  await expect(
    page.getByText('Confirmed plan saved. Your board updates automatically.'),
  ).toBeVisible();
  expect(actions).toEqual([
    'message',
    'message',
    'discard',
    'message',
    'confirm',
  ]);
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Plan with Codex', exact: true })
    .click();
  await expect(page.getByRole('log')).toContainText('Plan and notes saved.');
});
test('connection errors are visible, keep unsent text and never pretend a model answered or saved', async ({
  page,
}) => {
  const state = initial();
  await page.route('**/api/planner**', (route) =>
    route.fulfill({
      status: route.request().method() === 'GET' ? 200 : 502,
      json:
        route.request().method() === 'GET'
          ? state
          : {
              error: 'Codex connection timed out. No plan was saved.',
              snapshot: state,
            },
    }),
  );
  await page.goto('/board?date=' + date);
  await page
    .getByRole('button', { name: 'Plan with Codex', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Message Codex' })
    .fill('Help me prioritize');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'No plan was saved',
  );
  await expect(
    page.getByRole('textbox', { name: 'Message Codex' }),
  ).toHaveValue('Help me prioritize');
  await expect(
    page.getByRole('button', { name: 'Confirm & save', exact: true }),
  ).toHaveCount(0);
});
test('signed-out state disables messages and offers a connection check without model use', async ({
  page,
}) => {
  const state = {
    ...initial(),
    connection: {
      ready: false,
      provider: 'Codex',
      message: 'Sign in to Codex with ChatGPT on this computer.',
    },
  };
  let posts = 0;
  await page.route('**/api/planner**', (route) => {
    if (route.request().method() === 'POST') posts++;
    return route.fulfill({ json: state });
  });
  await page.goto('/board');
  await page
    .getByRole('button', { name: 'Plan with Codex', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Message Codex' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Check connection again', exact: true })
    .click();
  expect(posts).toBe(0);
});
test('a delayed old status response cannot erase a newer model reply', async ({
  page,
}) => {
  let reads = 0;
  let release!: () => void;
  let polled!: () => void;
  const started = new Promise<void>((resolve) => {
    polled = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const old = initial();
  let state = initial();
  await page.route('**/api/planner**', async (route) => {
    if (route.request().method() === 'GET') {
      reads++;
      if (reads === 2) {
        polled();
        await gate;
        return route.fulfill({ json: old });
      }
      return route.fulfill({ json: state });
    }
    state = {
      ...state,
      messages: [
        { role: 'assistant', text: 'What is your energy level today?' },
      ],
    };
    return route.fulfill({ json: state });
  });
  await page.goto('/board');
  await page
    .getByRole('button', { name: 'Plan with Codex', exact: true })
    .click();
  await started;
  await page.getByRole('button', { name: 'Good morning', exact: true }).click();
  await expect(page.getByRole('log')).toContainText(
    'What is your energy level today?',
  );
  const response = page.waitForResponse(
    (r) => r.url().includes('/api/planner') && r.request().method() === 'GET',
  );
  release();
  await response;
  await expect(page.getByRole('log')).toContainText(
    'What is your energy level today?',
  );
});
