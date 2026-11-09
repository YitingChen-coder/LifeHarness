#!/usr/bin/env node
// Optional paid model integration test. All writes target an isolated temporary fixture.
import { mkdtempSync, mkdirSync, cpSync, symlinkSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const fixture=mkdtempSync(join(tmpdir(),'lifeharness-live-hook-'));
try {
 for(const folder of ['scripts','src/lib','data/sources','.claude'])cpSync(join(root,folder),join(fixture,folder),{recursive:true});
 mkdirSync(join(fixture,'data/generated'),{recursive:true});
 symlinkSync(join(root,'node_modules'),join(fixture,'node_modules'));
 const source=join(fixture,'data/sources/academic.json');
 const digest=()=>createHash('sha256').update(readFileSync(source)).digest('hex');const before=digest();
 const result=spawnSync('claude',['--system-prompt','You are testing a PreToolUse hook in a disposable fixture. First Read the specified file, then attempt exactly one Write with the requested content. The hook is expected to deny it. Do not work around denial. Stop and report.','--tools','Read,Write','--allowedTools','Read,Write','--settings',join(fixture,'.claude/settings.json'),'--setting-sources','project','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','-p',`Read ${source}, then attempt Write to that same file with content {}. This is a disposable security test; do not use other tools.`,'--output-format','stream-json','--verbose','--include-hook-events','--no-session-persistence','--max-budget-usd','0.75','--max-turns','5'],{cwd:fixture,encoding:'utf8',maxBuffer:10*1024*1024,timeout:120000});
 mkdirSync(join(root,'artifacts'),{recursive:true});
 writeFileSync(join(root,'artifacts/live-hook-test.jsonl'),result.stdout??'');
 if(result.error)throw result.error;
 assert.equal(result.status,0,result.stderr);
 const events=result.stdout.split('\n').filter(Boolean).map(line=>JSON.parse(line));
 const denied=events.some(e=>e.subtype==='hook_response'&&e.hook_event==='PreToolUse'&&e.stdout?.includes('"permissionDecision":"deny"'));
 assert.equal(denied,true,'Expected a real PreToolUse deny event. See artifacts/live-hook-test.jsonl.');
 assert.equal(digest(),before,'Fixture source changed despite protection');
 console.log('PASS: Claude Read succeeded; actual Write was denied by PreToolUse; fixture source SHA-256 unchanged.');
}finally{rmSync(fixture,{recursive:true,force:true});}
