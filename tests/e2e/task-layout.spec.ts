import { test, expect } from '@playwright/test';
test('task cards keep their full content height while the list scrolls at desktop and phone widths', async ({
  page,
}) => {
  await page.goto('/board?date=2026-11-10');
  await page.getByRole('button', { name: 'Tasks', exact: true }).click();
  const column = page.getByRole('region', { name: 'To do column' });
  const cards = column.getByRole('article');
  await expect(cards).toHaveCount(12);
  for (const width of [1440, 1024, 900, 768, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    const measurements = await cards.evaluateAll((items) =>
      items.map((card) => {
        const box = card.getBoundingClientRect();
        const actions = card
          .querySelector('.task-actions')!
          .getBoundingClientRect();
        return {
          height: box.height,
          width: card.clientWidth,
          contentWidth: card.scrollWidth,
          contentHeight: card.scrollHeight,
          innerHeight: card.clientHeight,
          actionsBottom: actions.bottom - box.top,
        };
      }),
    );
    for (const card of measurements) {
      expect(card.height).toBeGreaterThan(120);
      expect(card.contentWidth).toBeLessThanOrEqual(card.width + 1);
      expect(card.contentHeight).toBeLessThanOrEqual(card.innerHeight + 1);
      expect(card.actionsBottom).toBeLessThanOrEqual(card.height);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 850 });
  const list = column.locator('.column-tasks');
  expect(await list.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(
    true,
  );
  const last = cards.last();
  await last
    .getByRole('button', { name: 'Start task', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(last.getByLabel('Task status')).toBeVisible();
  await expect(
    last.getByRole('button', { name: 'Start task', exact: true }),
  ).toBeInViewport();
});
