import test from 'node:test';import assert from 'node:assert/strict';
import worker,{route,trustedMutation} from '../src/worker.js';
import {SCOPES,encrypt,decrypt,hash,yearWindows,reportParams,coverageStatus,safeCsv} from '../src/core.js';
import {summarizeCohort,comparable} from '../src/analysis.js';
const env={PUBLIC_ORIGIN:'https://analytics.example.com',EXPECTED_CHANNEL_ID:'UCtest'};
test('private endpoints fail closed without Access configuration and JWT',async()=>{
 for(const path of ['/admin','/api/export','/api/videos','/api/coverage','/api/experiments']){
  const response=await worker.fetch(new Request(env.PUBLIC_ORIGIN+path),env,{});assert.equal(response.status,401);assert.equal(response.headers.get('Cache-Control'),'no-store');
 }
});
test('OAuth not configured never redirects or grants access',async()=>{const r=await route(new Request(env.PUBLIC_ORIGIN+'/oauth/start',{method:'POST'}),env,{});assert.equal(r.status,503);});
test('cross-site mutation rejected even for valid content type',()=>{assert.equal(trustedMutation(new Request(env.PUBLIC_ORIGIN,{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'}}),env),false);});
test('OAuth callback rejects mismatched state before accessing storage',async()=>{const r=await route(new Request(env.PUBLIC_ORIGIN+'/oauth/callback?state=evil',{headers:{Cookie:'__Host-yt-state=good'}}),env,{});assert.equal(r.status,400);});
test('encryption authenticated; wrong key and ciphertext tampering fail',async()=>{
 const a=btoa('a'.repeat(32)),b=btoa('b'.repeat(32)),token=await encrypt('test-refresh-token',a);
 assert.equal(await decrypt(token,a),'test-refresh-token');assert(!token.includes('test-refresh-token'));await assert.rejects(()=>decrypt(token,b));
 const damaged=JSON.parse(token);damaged.data[0]^=1;await assert.rejects(()=>decrypt(JSON.stringify(damaged),a));
});
test('only read-only scopes; no management or monetary permissions',()=>{assert.equal(SCOPES.length,2);assert(SCOPES.every(s=>s.endsWith('.readonly')));assert(SCOPES.every(s=>!s.includes('monetary')));});
test('calendar windows preserve endpoints without missing leap days',()=>{assert.deepEqual(yearWindows('2020-02-29','2021-02-01'),[['2020-02-29','2020-12-31'],['2021-01-01','2021-02-01']]);});
test('retention is per-video, paginated reports never substitute null data with zero',()=>{const p=reportParams({report:'retention',video_id:'abc',start_date:'2021-01-01',end_date:'2026-01-01',next_index:201},'UCtest');assert.equal(p.get('filters'),'video==abc');assert.equal(p.get('startIndex'),'201');assert.equal(coverageStatus(0),'empty_or_suppressed');});
test('CSV exports neutralize spreadsheet formulas',()=>{assert.equal(safeCsv('=IMPORTXML("x")'),'"\'=IMPORTXML(""x"")"');});
test('watch duration uses weighted totals, not mean of per-video averages',()=>{const r=summarizeCohort([{views:1,estimatedMinutesWatched:10},{views:99,estimatedMinutesWatched:90}]);assert.equal(r.weightedAverageViewSeconds,60);assert.equal(summarizeCohort([]).views,null);});
test('mismatched age/format/duration cohorts cannot be marked comparable',()=>{assert.equal(comparable({ageWindowDays:7,creatorContentType:'SHORTS',durationBand:'short'},{ageWindowDays:28,creatorContentType:'VIDEO',durationBand:'long'}),false);});
test('state digest is deterministic and distinct',async()=>{assert.equal(await hash('a'),await hash('a'));assert.notEqual(await hash('a'),await hash('b'));});
import {csvRows} from '../src/reporting.js';
test('streaming CSV preserves escaped quotes and multiline fields across chunks',async()=>{
 const encoder=new TextEncoder();const stream=new ReadableStream({start(c){for(const part of ['a,b\n"x,','y","say "','"yes""\nnext"\n'])c.enqueue(encoder.encode(part));c.close();}});
 const rows=[];for await(const row of csvRows(stream))rows.push(row);
 assert.deepEqual(rows,[['a','b'],['x,y','say "yes"\nnext']]);
});

import {newestBulkVersions} from '../src/core.js';
test('corrected bulk reports supersede previous versions instead of double-counting',()=>{const common={type_id:'basic',start_time:'a',end_time:'b'};assert.deepEqual(newestBulkVersions([{...common,id:'old',created_at:'2026-01-01'},{...common,id:'new',created_at:'2026-01-02'}]).map(r=>r.id),['new']);});
