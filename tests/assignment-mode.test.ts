import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../src/app/api/planner/route';
test('assignment mode disables embedded model and plan mutation endpoints by default', async () => {
  const previous = process.env.LIFEHARNESS_BROWSER_CHAT;
  delete process.env.LIFEHARNESS_BROWSER_CHAT;
  try {
    assert.equal(
      (
        await GET(
          new Request('http://localhost:3000/api/planner?date=2026-11-10'),
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await POST(
          new Request('http://localhost:3000/api/planner', {
            method: 'POST',
            headers: {
              origin: 'http://localhost:3000',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              action: 'message',
              date: '2026-11-10',
              message: 'Good morning',
            }),
          }),
        )
      ).status,
      404,
    );
  } finally {
    if (previous === undefined) delete process.env.LIFEHARNESS_BROWSER_CHAT;
    else process.env.LIFEHARNESS_BROWSER_CHAT = previous;
  }
});
