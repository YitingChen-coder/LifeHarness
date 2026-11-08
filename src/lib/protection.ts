import { readFile, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, join, isAbsolute } from 'node:path';
import { academicSchema, jobsSchema, planSchema, notesSchema, validateReferences } from './schema';
import { chicagoDate } from './dates';
type Decision = { allowed: boolean; reason: string };
const deny = (reason: string): Decision => ({allowed:false,reason});
const inside = (root: string, path: string) => { const rel=relative(root,path);return rel==='' || (!rel.startsWith('..')&&!isAbsolute(rel)); };
async function safePath(root: string, target: string): Promise<boolean> {
 if(!inside(root,target)) return false;
 let current=root;
 for(const part of relative(root,target).split('/').filter(Boolean)) {
  current=join(current,part);
  try { const stat=await lstat(current);if(stat.isSymbolicLink() || (stat.isFile() && stat.nlink>1))return false; }
  catch(error) { if((error as NodeJS.ErrnoException).code !== 'ENOENT')return false; }
 }
 return true;
}
export async function evaluateTool(event: unknown, projectRoot: string): Promise<Decision> {
 try {
  if(!event || typeof event !== 'object')return deny('Invalid hook payload');
  const {tool_name:name, tool_input:input}=event as {tool_name?:string;tool_input?:Record<string,unknown>};
  if(!input || typeof input !== 'object')return deny('Missing tool input');
  const root=await realpath(projectRoot);
  if(name==='Skill')return input.skill==='morning-check-in' ? {allowed:true,reason:'Morning check-in skill'} : deny('Only the morning-check-in skill is enabled');
  if(['Read','Glob','Grep'].includes(name??'')) {
   const raw=input.file_path ?? input.path ?? root;
   if(typeof raw !== 'string')return deny('Invalid read path');
   const target=resolve(root,raw);
   return await safePath(root,target) ? {allowed:true,reason:'Read-only project access'} : deny('Reads must stay inside the project without links');
  }
  if(name!=='Write')return deny('LifeHarness permits only reads, its morning skill, and whole-file generated writes. Source changes, shell commands and other tools are blocked.');
  if(typeof input.file_path!=='string' || typeof input.content!=='string')return deny('Write requires file_path and full JSON content');
  const target=resolve(root,input.file_path), rel=relative(root,target);
  if(!/^data\/generated\/(?:\d{4}-\d{2}-\d{2}|notes)\.json$/.test(rel))return deny('Protected file: write only dated plans or notes.json under data/generated');
  if(!await safePath(root,target))return deny('Unsafe path: links, hard links and directory traversal are blocked');
  if(Buffer.byteLength(input.content)>131072)return deny('Generated JSON exceeds 128 KiB');
  const content=JSON.parse(input.content);
  const academic=academicSchema.parse(JSON.parse(await readFile(join(root,'data/sources/academic.json'),'utf8')));
  const jobs=jobsSchema.parse(JSON.parse(await readFile(join(root,'data/sources/jobs.json'),'utf8')));
  if(rel.endsWith('/notes.json')) {
   const notes=notesSchema.parse(content);
   const ids=new Set([...academic.tasks,...jobs.tasks].map(t=>t.id));
   if(!notes.carryOver.every(id=>ids.has(id)))return deny('Notes reference an unknown task');
  } else {
   const plan=planSchema.parse(content);
   if(rel!==`data/generated/${plan.date}.json`)return deny('Plan date must match filename');
   if(!validateReferences(plan,academic,jobs))return deny('Unknown source reference or changed fixed event');
   const fixed=[...academic.events,...jobs.interviews].filter(e=>chicagoDate(new Date(e.start))===plan.date);
   if(!fixed.every(e=>plan.blocks.some(b=>b.sourceId===e.id && b.start===e.start && b.end===e.end)))return deny('Plan must preserve every fixed event on the selected date');
  }
  return {allowed:true,reason:'Validated generated output. Save only after explicit user agreement.'};
 }catch(error) {return deny(`Cannot validate operation: ${error instanceof Error ? error.message : 'unknown error'}`);}
}
