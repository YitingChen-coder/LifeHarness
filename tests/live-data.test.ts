import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { DashboardData } from '../src/lib/store';
import { mergeLastGood } from '../src/lib/live-data';
const previous:DashboardData={date:'2026-11-10',today:'2026-11-08',fetchedAt:new Date().toISOString(),academic:JSON.parse(readFileSync('data/sources/academic.json','utf8')),jobs:JSON.parse(readFileSync('data/sources/jobs.json','utf8')),plan:null,warnings:[]};
test('partial source reads retain last good source data with an explicit stale warning',()=>{
 const next={...previous,academic:null,jobs:null,warnings:['academic.json invalid','jobs.json invalid']};
 const merged=mergeLastGood(previous,next);
 assert.equal(merged.academic,previous.academic);assert.equal(merged.jobs,previous.jobs);
 assert.match(merged.warnings.join(' '),/last valid academic/i);assert.match(merged.warnings.join(' '),/last valid career/i);
 assert.equal(mergeLastGood({...previous,date:'2026-11-09'},next).academic,null);
 assert.equal(mergeLastGood(previous,previous).warnings.length,0);
});
