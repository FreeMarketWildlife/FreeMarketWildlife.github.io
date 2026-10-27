import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker,{hash} from '../src/worker.js';
const origin='https://freemarketwildlife.com';
const bytes=new TextEncoder().encode('%PDF-1.7\nSynthetic test fixture only.\n%%EOF');
const id=await hash(new TextDecoder().decode(bytes));
const meta={sha256:id,title:'Synthetic agreement',filename:'sample agreement.pdf',size:bytes.length,addedAt:'2026-10-27T12:00:00.000Z'};
const route=workspace=>`/${workspace}/api/contracts`;
function environment() {
 const db=new DatabaseSync(':memory:');
 for(const name of ['0001_auth.sql','0002_email_auth.sql','0003_google_identity_links.sql'])db.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...params){const s=db.prepare(sql);return {async first(){return s.get(...params)||null;},async all(){return {results:s.all(...params)};},async run(){return s.run(...params);}};}};}};
 const objects=new Map(),reads=[];
 for(const workspace of ['kat-kai','philip-aram']) {
  const prefix=`workspace-contracts/${workspace}/`;
  objects.set(prefix+id+'.pdf',bytes);objects.set(prefix+id+'.json',JSON.stringify(meta));
 }
 const bucket={
  async get(key){reads.push(key);const value=objects.get(key);return value===undefined?null:{size:typeof value==='string'?value.length:value.length,body:value,text:async()=>String(value)};},
  async head(key){reads.push(key);const value=objects.get(key);return value===undefined?null:{size:value.length};},
  async list({prefix}){reads.push(prefix);return {objects:[...objects].filter(([key])=>key.startsWith(prefix)).map(([key,value])=>({key,size:value.length})),truncated:false};},
  async put(){assert.fail('Read-only API must never write.');},async delete(){assert.fail('Read-only API must never delete.');}
 };
 return {db,DB,objects,reads,TASK_PHOTOS:bucket,SITE_ORIGIN:origin,GOOGLE_CLIENT_ID:'test',GOOGLE_CLIENT_SECRET:'test',OWNER_EMAIL:'owner@example.test',ASSETS:{fetch:async()=>new Response('PRIVATE STATIC')}};
}
async function session(env,workspace,owner=false) {
 const sub=workspace||'no-member';env.db.prepare('INSERT INTO users VALUES (?,?,?)').run(sub,sub+'@example.test',1);
 if(owner)env.db.prepare('INSERT INTO owner_identity VALUES (1,?)').run(sub);
 else if(workspace)env.db.prepare('INSERT INTO memberships VALUES (?,?,?)').run(sub+'@example.test',workspace,sub);
 const token=(owner?'b':'a').repeat(64);env.db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(await hash(token),sub,Math.floor(Date.now()/1000)+1000);
 return {cookie:`__Host-fmw-session=${token}`};
}
const call=(env,path,options={})=>worker.fetch(new Request(origin+path,options),env);
test('anonymous, expired, unrelated, and revoked memberships never reach contract storage',async()=>{
 for(const workspace of ['kat-kai','philip-aram']) {
  const env=environment();
  for(const path of [route(workspace),route(workspace)+'/'+id])assert.equal((await call(env,path)).status,303);
  const headers=await session(env,'troy-kearns');
  for(const path of [route(workspace),route(workspace)+'/'+id,`/${workspace}/contracts/`])assert.equal((await call(env,path,{headers})).status,403);
  assert.equal(env.reads.length,0);
 }
 const env=environment(),headers=await session(env,'kat-kai');
 assert.equal((await call(env,route('kat-kai'),{headers})).status,200);
 env.reads.length=0;env.db.exec('DELETE FROM memberships');
 assert.equal((await call(env,route('kat-kai')+'/'+id,{headers})).status,403);
 env.db.exec('UPDATE sessions SET expires_at=1');
 assert.equal((await call(env,route('kat-kai')+'/'+id,{headers})).status,303);assert.equal(env.reads.length,0);
 const empty=environment(),noMember=await session(empty,null);
 assert.equal((await call(empty,route('philip-aram'),{headers:noMember})).status,403);assert.equal(empty.reads.length,0);
});
test('each membership lists only its namespace and streams exact bytes with private headers',async()=>{
 for(const workspace of ['kat-kai','philip-aram']) {
  const env=environment(),headers=await session(env,workspace),base=route(workspace);
  const listed=await call(env,base,{headers});assert.equal(listed.status,200);
  assert.equal(listed.headers.get('cache-control'),'private, no-store');assert.equal(listed.headers.get('vary'),'Cookie');
  const data=await listed.json();assert.equal(data.documents.length,1);assert.equal(data.documents[0].url,base+'/'+id);
  const file=await call(env,base+'/'+id,{headers});assert.equal(file.status,200);
  assert.deepEqual(new Uint8Array(await file.arrayBuffer()),bytes);
  for(const [key,value] of Object.entries({'content-type':'application/pdf','cache-control':'private, no-store','vary':'Cookie','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow','cross-origin-resource-policy':'same-origin','content-security-policy':"default-src 'none'; sandbox"}))assert.equal(file.headers.get(key),value);
  assert.match(file.headers.get('content-disposition'),/^inline; filename\*=UTF-8''sample%20agreement.pdf$/);
  const download=await call(env,base+'/'+id+'?download=1',{headers});assert.match(download.headers.get('content-disposition'),/^attachment;/);
  const head=await call(env,base+'/'+id,{method:'HEAD',headers});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('content-length'),String(bytes.length));
  assert.ok(env.reads.every(key=>key.startsWith(`workspace-contracts/${workspace}/`)));
  const other=workspace==='kat-kai'?'philip-aram':'kat-kai';
  assert.equal((await call(env,route(other)+'/'+id,{headers})).status,403);
 }
});
test('existing owner can read both; method, path, metadata, and object checks fail safely',async()=>{
 const env=environment(),headers=await session(env,'owner',true);
 for(const workspace of ['kat-kai','philip-aram'])assert.equal((await call(env,route(workspace)+'/'+id,{headers})).status,200);
 const base=route('kat-kai');env.reads.length=0;
 for(const method of ['POST','PUT','DELETE','PATCH'])assert.equal((await call(env,base+'/'+id,{method,headers})).status,405);
 assert.equal(env.reads.length,0);
 for(const suffix of ['/not-a-digest','/'+id+'/extra','/%252e%252e','/%2Fphilip-aram'])assert.ok([400,404].includes((await call(env,base+suffix,{headers})).status));
 assert.equal((await call(env,base+'/'+('f'.repeat(64)),{headers})).status,404);
 const key='workspace-contracts/kat-kai/'+id;
 env.objects.set(key+'.json',JSON.stringify({...meta,filename:'../outside.pdf'}));
 assert.equal((await call(env,base+'/'+id,{headers})).status,404);assert.deepEqual((await (await call(env,base,{headers})).json()).documents,[]);
 env.objects.set(key+'.json',JSON.stringify(meta));env.objects.delete(key+'.pdf');
 assert.equal((await call(env,base+'/'+id,{headers})).status,404);
 env.TASK_PHOTOS=null;assert.equal((await call(env,base,{headers})).status,503);
});
