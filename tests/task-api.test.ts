import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/tasks/route';
test('task write API rejects cross-origin, missing origin, path injection and arbitrary fields', async () => {
  const make = (body: unknown, origin?: string, type = 'application/json') =>
    new Request('http://127.0.0.1:3000/api/tasks', {
      method: 'POST',
      headers: { 'content-type': type, ...(origin ? { origin } : {}) },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await POST(make({ id: 'task-algo', status: 'done' }))).status,
    403,
  );
  assert.equal(
    (
      await POST(
        make({ id: 'task-algo', status: 'done' }, 'https://evil.example'),
      )
    ).status,
    403,
  );
  for (const body of [
    { id: '../../academic', status: 'done' },
    { id: 'task-algo', status: 'done', path: 'data/sources/academic.json' },
    { id: 'missing', status: 'done' },
    { id: 'task-algo', status: 'invalid' },
  ])
    assert.equal((await POST(make(body, 'http://127.0.0.1:3000'))).status, 400);
  assert.equal(
    (await POST(make({}, 'http://127.0.0.1:3000', 'text/plain'))).status,
    415,
  );
});
test('task API recognizes the actual loopback Host when Next normalizes its internal URL', async () => {
  const request = new Request('http://localhost:3100/api/tasks', {
    method: 'POST',
    headers: {
      host: '127.0.0.1:3100',
      origin: 'http://127.0.0.1:3100',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ id: 'missing', status: 'done' }),
  });
  assert.equal((await POST(request)).status, 400);
});
