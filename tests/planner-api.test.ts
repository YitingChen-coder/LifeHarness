import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../src/app/api/planner/route';
const request = (
  origin: string | null,
  body: unknown,
  host = 'localhost:3000',
) =>
  new Request('http://localhost:3000/api/planner', {
    method: 'POST',
    headers: {
      host,
      'content-type': 'application/json',
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });
test('browser planner rejects cross-origin, remote hosts, invalid dates and client-supplied plan content before model usage', async () => {
  for (const origin of [null, 'https://evil.test'])
    assert.equal(
      (
        await POST(
          request(origin, {
            action: 'message',
            date: '2026-11-09',
            message: 'Hi',
          }),
        )
      ).status,
      403,
    );
  assert.equal(
    (
      await POST(
        request(
          'http://evil.test',
          { action: 'message', date: '2026-11-09', message: 'Hi' },
          'evil.test',
        ),
      )
    ).status,
    403,
  );
  for (const body of [
    { action: 'confirm', date: '2026-11-09', plan: {} },
    { action: 'message', date: '../../x', message: 'Hi' },
    { action: 'message', date: '2026-11-09', message: 'x'.repeat(4001) },
  ])
    assert.equal(
      (await POST(request('http://localhost:3000', body))).status,
      400,
    );
  assert.equal(
    (
      await GET(
        new Request('http://evil.test/api/planner', {
          headers: { host: 'evil.test' },
        }),
      )
    ).status,
    403,
  );
});
test('planner reset creates an HttpOnly session without invoking a model; stale IDs never save', async () => {
  const response = await POST(
    request('http://localhost:3000', { action: 'reset', date: '2026-11-09' }),
  );
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get('set-cookie')!,
    /HttpOnly; SameSite=Strict/,
  );
  const cookie = response.headers.get('set-cookie')!.split(';')[0];
  const r = request('http://localhost:3000', {
    action: 'confirm',
    date: '2026-11-09',
    draftId: '12345678-1234-4234-8234-123456789012',
  });
  r.headers.set('cookie', cookie);
  assert.equal((await POST(r)).status, 409);
});
