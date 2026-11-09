import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateWithCodex, codexStatus } from '../src/lib/codex-bridge';

test('native bridge initializes an isolated read-only thread, accepts ChatGPT login and returns actual protocol reply; API-key accounts are refused', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'lifeharness-codex-rpc-'));
  const previous = process.env.PATH;
  const install = (type: string) =>
    writeFileSync(
      join(folder, 'codex'),
      `#!/usr/bin/env node
const rl=require('node:readline');const a=process.argv.slice(2);
if(a.includes('mcp')){console.log('[]');process.exit(0)}
if(a.includes('login')){console.log('Logged in using ChatGPT');process.exit(0)}
if(!a.includes('features.shell_tool=false')||!a.includes('sandbox_mode="read-only"'))process.exit(3);
const send=x=>process.stdout.write(JSON.stringify(x)+'\\n');
rl.createInterface({input:process.stdin}).on('line',l=>{const q=JSON.parse(l);if(q.id===undefined)return;
let result={};
if(q.method==='account/read')result={account:{type:${JSON.stringify(type)}}};
if(q.method==='thread/start'){if(q.params.sandbox!=='read-only'||q.params.approvalPolicy!=='never'||q.params.modelProvider!=='openai')process.exit(4);result={thread:{id:'fixture-thread'},sandbox:{type:'readOnly'},approvalPolicy:'never'}}
send({id:q.id,result});
if(q.method==='turn/start'){send({method:'item/completed',params:{item:{type:'agentMessage',text:JSON.stringify({message:'How is your energy today?',draft:null})}}});send({method:'turn/completed',params:{turn:{status:'completed',items:[]}}})}
});`,
      { mode: 0o700 },
    );
  try {
    process.env.PATH = folder + ':' + previous;
    install('chatgpt');
    assert.equal((await codexStatus()).ready, true);
    const input = {
      root: process.cwd(),
      date: '2026-11-09',
      messages: [{ role: 'user' as const, text: 'Good morning' }],
      context: {},
    };
    assert.deepEqual(await generateWithCodex(input), {
      message: 'How is your energy today?',
      draft: null,
    });
    install('apiKey');
    await assert.rejects(generateWithCodex(input), /ChatGPT|API-key/);
  } finally {
    process.env.PATH = previous;
    rmSync(folder, { recursive: true, force: true });
  }
});
