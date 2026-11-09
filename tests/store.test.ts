import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadDashboard } from '../src/lib/store';
const plan = {
  date: '2026-11-10',
  timezone: 'America/Chicago',
  confirmed: true,
  confirmedAt: '2026-11-10T08:00:00-06:00',
  summary: 'An approved plan',
  priorities: [
    {
      id: 'p1',
      sourceId: 'task-lifeharness',
      title: 'Record demo',
      reason: 'Due today',
      status: 'pending',
    },
  ],
  blocks: [],
};
test('store reads fresh JSON, handles no plan and degrades honestly for malformed files', async () => {
  const root = mkdtempSync(join(tmpdir(), 'lifeharness-store-'));
  mkdirSync(join(root, 'data/sources'), { recursive: true });
  mkdirSync(join(root, 'data/generated'));
  for (const name of ['academic', 'jobs'])
    copyFileSync(
      `data/sources/${name}.json`,
      join(root, `data/sources/${name}.json`),
    );
  try {
    let data = await loadDashboard(root, '2026-11-10');
    assert.equal(data.plan, null);
    assert.equal(data.warnings.length, 0);
    assert.equal(data.academic?.courses.length, 3);
    const source = data.academic!;
    const fixed = source.events
      .filter((e) => e.start.startsWith(plan.date))
      .map((e) => ({
        id: e.id,
        sourceId: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        kind: e.kind,
        status: 'pending',
      }));
    writeFileSync(
      join(root, 'data/generated/2026-11-10.json'),
      JSON.stringify({ ...plan, blocks: fixed }),
    );
    data = await loadDashboard(root, '2026-11-10');
    assert.equal(data.plan?.summary, 'An approved plan');
    writeFileSync(
      join(root, 'data/generated/2026-11-10.json'),
      JSON.stringify({ ...plan, summary: 'Changed on disk', blocks: fixed }),
    );
    assert.equal(
      (await loadDashboard(root, '2026-11-10')).plan?.summary,
      'Changed on disk',
    );
    writeFileSync(join(root, 'data/generated/2026-11-10.json'), '{partial');
    data = await loadDashboard(root, '2026-11-10');
    assert.equal(data.plan, null);
    assert.match(data.warnings.join(' '), /plan/i);
    writeFileSync(join(root, 'data/sources/jobs.json'), '{}');
    data = await loadDashboard(root, '2026-11-10');
    assert.equal(data.jobs, null);
    assert.equal(data.academic?.courses.length, 3);
    assert.match(data.warnings.join(' '), /jobs/i);
    rmSync(join(root, 'data/sources/academic.json'));
    data = await loadDashboard(root, '2026-11-10');
    assert.equal(data.academic, null);
    assert.match(data.warnings.join(' '), /academic/i);
    await assert.rejects(loadDashboard(root, '../../secret'), /date/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test('store rejects generated symlinks instead of reading outside project', async () => {
  const root = mkdtempSync(join(tmpdir(), 'lifeharness-link-'));
  mkdirSync(join(root, 'data/generated'), { recursive: true });
  symlinkSync('/etc/hosts', join(root, 'data/generated/2026-11-10.json'));
  try {
    const data = await loadDashboard(root, '2026-11-10');
    assert.equal(data.plan, null);
    assert.match(data.warnings.join(' '), /plan/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
