#!/usr/bin/env node
// A redacted native diagnostic: never print the full account/user prompt context.
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  nativePolicy,
  disableMcp,
  sessionEnvironment,
} from './codex-session.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  const rules = readFileSync(join(root, 'AGENTS.md'), 'utf8');
  const args = disableMcp(
    nativePolicy(
      join(root, 'data/generated'),
      rules + '\nLifeHarness context inspection. Do not write files.',
    ),
    root,
  );
  const result = spawnSync(
    'codex',
    [...args, 'debug', 'prompt-input', 'Good morning'],
    {
      cwd: join(root, 'data/generated'),
      env: sessionEnvironment(),
      encoding: 'utf8',
      timeout: 20000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.status !== 0)
    throw new Error(
      'Native prompt inspection failed. Check the installed Codex version.',
    );
  const strings = [];
  const walk = (value) => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object')
      Object.values(value).forEach(walk);
  };
  walk(JSON.parse(result.stdout));
  const text = strings.join('\n');
  const skill = readFileSync(
    join(root, '.agents/skills/morning-check-in/SKILL.md'),
    'utf8',
  );
  const body = skill.slice(skill.indexOf('# Morning check-in')).trim();
  const report = {
    checkedAt: new Date().toISOString(),
    mechanism: 'native codex debug prompt-input (no model call)',
    standingContext: {
      file: 'AGENTS.md',
      bytes: Buffer.byteLength(rules),
      present: text.includes(rules.trim()),
    },
    skill: {
      name: 'morning-check-in',
      metadataVisible:
        text.includes('morning-check-in') &&
        text.includes('Use when the user says good morning'),
      fullBodyPreloaded: text.includes(body),
    },
    references: {
      planningBodyPreloaded: text.includes(
        readFileSync(join(root, 'context/planning.md'), 'utf8').trim(),
      ),
    },
    privacy:
      'Full model prompt and private account configuration are not printed.',
  };
  console.log(JSON.stringify(report, null, 2));
  if (
    !report.standingContext.present ||
    !report.skill.metadataVisible ||
    report.skill.fullBodyPreloaded ||
    report.references.planningBodyPreloaded
  )
    process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
