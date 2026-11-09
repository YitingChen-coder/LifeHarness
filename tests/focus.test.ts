import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newFocus,
  startFocus,
  pauseFocus,
  remainingFocus,
  parseFocus,
  focusLabel,
} from '../src/lib/focus';
test('focus timer uses wall-clock deadlines and can pause, resume and survive serialized reload', () => {
  const initial = newFocus('task-algo');
  assert.equal(initial.remainingMs, 1500000);
  const running = startFocus(initial, 1000);
  assert.equal(remainingFocus(running, 11000), 1490000);
  const paused = pauseFocus(running, 11000);
  assert.equal(remainingFocus(paused, 90000), 1490000);
  const resumed = startFocus(paused, 100000);
  const restored = parseFocus(JSON.stringify(resumed));
  assert.ok(restored);
  assert.equal(remainingFocus(restored!, 110000), 1480000);
  assert.equal(remainingFocus(resumed, 9999999), 0);
  assert.equal(parseFocus('{bad'), null);
  assert.equal(
    parseFocus('{"taskId":"x","remainingMs":-1,"endsAt":null}'),
    null,
  );
});

test('focus clock formats a partial minute without rounding the minutes up', () => {
  assert.equal(focusLabel(1499000), '24:59');
  assert.equal(focusLabel(61000), '01:01');
  assert.equal(focusLabel(0), '00:00');
});
test('starting a running timer keeps its deadline; restarting an expired timer is a fresh 25 minutes', () => {
  const active = startFocus(newFocus('task-algo'), 1000);
  assert.equal(remainingFocus(startFocus(active, 61000), 61000), 1440000);
  const resumed = startFocus(pauseFocus(active, 901000), 1000000);
  assert.equal(remainingFocus(startFocus(resumed, 2000000), 2000000), 1500000);
});
