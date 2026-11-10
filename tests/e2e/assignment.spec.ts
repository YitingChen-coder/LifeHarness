import { test, expect } from '@playwright/test';
test('default assignment calendar never calls a browser model and provides the selected-date native terminal command', async ({
  page,
  request,
}) => {
  const modelRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/planner'))
      modelRequests.push(request.url());
  });
  await page.goto('/board?date=2026-11-12');
  await expect(
    page.getByRole('heading', { name: 'Your calendar', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Message Codex' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('complementary', { name: 'Planning assistant' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Terminal check-in', exact: true })
    .click();
  const guide = page.getByRole('region', { name: 'Terminal check-in guide' });
  await expect(guide).toContainText('npm run planner -- --date 2026-11-12');
  await expect(guide).toContainText('calendar on the left');
  await expect(guide).toContainText('Codex terminal on the right');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Monday, November 9, 2026', exact: true })
    .click();
  await expect(guide).toContainText('2026-11-09');
  expect(modelRequests).toEqual([]);
  expect((await request.get('/api/planner?date=2026-11-10')).status()).toBe(
    404,
  );
  expect(
    (
      await request.post('/api/planner', {
        data: {
          action: 'message',
          date: '2026-11-10',
          message: 'Good morning',
        },
      })
    ).status(),
  ).toBe(404);
});
