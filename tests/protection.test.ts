import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, symlinkSync, linkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { evaluateTool } from '../src/lib/protection';
const goodPlan = {date:'2026-11-09',timezone:'America/Chicago',confirmed:true,confirmedAt:'2026-11-09T08:00:00-06:00',summary:'Study before class',priorities:[{id:'p1',sourceId:'task-algo',title:'Study',reason:'Due soon',status:'pending'}],blocks:[{id:'b1',sourceId:'task-algo',title:'Study',start:'2026-11-09T09:00:00-06:00',end:'2026-11-09T10:00:00-06:00',kind:'task',status:'pending'},{id:'b2',sourceId:'class-algo-mon',title:'Algorithms',start:'2026-11-09T10:30:00-06:00',end:'2026-11-09T11:50:00-06:00',kind:'class',status:'pending'}]};
test('hook allows only valid whole generated files and keeps protected data unchanged', async () => {
 const root=mkdtempSync(join(tmpdir(),'lifeharness-hook-'));
 mkdirSync(join(root,'data/sources'),{recursive:true});mkdirSync(join(root,'data/generated'));
 for(const name of ['academic','jobs'])copyFileSync(`data/sources/${name}.json`,join(root,`data/sources/${name}.json`));
 const source=join(root,'data/sources/academic.json');
 const hash=()=>createHash('sha256').update(readFileSync(source)).digest('hex');const before=hash();
 const event=(tool_name:string,file_path='data/generated/2026-11-09.json',content=JSON.stringify(goodPlan))=>({tool_name,tool_input:{file_path,content},cwd:root});
 try {
  assert.equal((await evaluateTool(event('Write'),root)).allowed,true);
  assert.equal((await evaluateTool(event('Write','data/generated/notes.json',JSON.stringify({updatedAt:goodPlan.confirmedAt,carryOver:['task-algo'],reflections:['A focused morning.']})),root)).allowed,true);
  for(const path of ['data/sources/academic.json','data/generated/../sources/academic.json','AGENTS.md','.claude/settings.json','src/app/page.tsx','data/generated/arbitrary.json',resolve(root,'../escape.json')]) assert.equal((await evaluateTool(event('Write',path),root)).allowed,false,path);
  for(const name of ['Bash','Agent','Task','NotebookEdit','mcp__anything__execute','Edit']) assert.equal((await evaluateTool(event(name),root)).allowed,false,name);
  for(const content of ['{bad',JSON.stringify({...goodPlan,confirmed:false}),JSON.stringify({...goodPlan,blocks:[]}),JSON.stringify({...goodPlan,priorities:[{...goodPlan.priorities[0],sourceId:'unknown'}]})]) assert.equal((await evaluateTool(event('Write',undefined,content),root)).allowed,false);
  assert.equal((await evaluateTool(event('Write','data/generated/2026-11-10.json'),root)).allowed,false);
  symlinkSync(source,join(root,'data/generated/2026-11-09.json'));
  assert.equal((await evaluateTool(event('Write'),root)).allowed,false);rmSync(join(root,'data/generated/2026-11-09.json'));
  linkSync(source,join(root,'data/generated/2026-11-09.json'));
  assert.equal((await evaluateTool(event('Write'),root)).allowed,false);rmSync(join(root,'data/generated/2026-11-09.json'));
  rmSync(join(root,'data/generated'),{recursive:true});symlinkSync(join(root,'data/sources'),join(root,'data/generated'));
  assert.equal((await evaluateTool(event('Write'),root)).allowed,false);
  assert.equal(hash(),before);
  assert.equal((await evaluateTool({},root)).allowed,false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('real hook subprocess fails closed on malformed stdin and denies a source modification',()=>{
 for(const input of ['not json',JSON.stringify({tool_name:'Write',tool_input:{file_path:resolve('data/sources/academic.json'),content:'{}'}})]) {
  const result=spawnSync(process.execPath,['scripts/protect-data.mjs'],{input,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,'deny');
 }
});
test('every user prompt receives a fresh actual timestamp without model command execution',()=>{
 const result=spawnSync(process.execPath,['scripts/current-context.mjs'],{input:'{}',encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const output=JSON.parse(result.stdout).hookSpecificOutput;
 assert.equal(output.hookEventName,'UserPromptSubmit');
 const stamp=output.additionalContext.match(/Current actual time: (\S+)/)?.[1];
 assert.ok(stamp);assert.ok(Math.abs(Date.now()-Date.parse(stamp))<5000);
});
