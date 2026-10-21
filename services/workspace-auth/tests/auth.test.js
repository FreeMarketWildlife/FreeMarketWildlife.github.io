import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import worker,{hash,protectedWorkspace,validClaims} from '../src/worker.js';
const origin='https://freemarketwildlife.com';
function environment(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../migrations/0001_auth.sql',import.meta.url),'utf8'));
 db.exec(readFileSync(new URL('../migrations/0002_email_auth.sql',import.meta.url),'utf8'));
 db.exec(readFileSync(new URL('../migrations/0003_google_identity_links.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...params){const s=db.prepare(sql);return {async first(){return s.get(...params)||null;},async all(){return {results:s.all(...params)};},async run(){return s.run(...params);}};}};}};
 return {db,DB,SITE_ORIGIN:origin,GOOGLE_CLIENT_ID:'test-client',GOOGLE_CLIENT_SECRET:'test-secret',OWNER_EMAIL:'owner@gmail.com',ASSETS:{fetch:async()=>new Response('protected page')}};
}
const call=(env,path,options={})=>worker.fetch(new Request(origin+path,options),env);
async function session(env,sub,email,own=false){
 env.db.prepare('INSERT INTO users VALUES (?,?,?)').run(sub,email,1);
 if(own)env.db.prepare('INSERT INTO owner_identity VALUES (1,?)').run(sub);
 const token='a'.repeat(64);env.db.prepare('INSERT OR REPLACE INTO sessions VALUES (?,?,?)').run(await hash(token),sub,Math.floor(Date.now()/1000)+1000);
 return {cookie:`__Host-fmw-session=${token}`};
}
test('workspace routes include aliases, subpages and case variants',()=>{
 for(const p of ['/troykearns','/troy-kearns/statistics/','/TROYKEARNS/index.html'])assert.equal(protectedWorkspace(p),'troy-kearns');
 assert.equal(protectedWorkspace('/portfolio/'),null);
});
test('all private routes fail closed without configuration',async()=>{
 const env=environment();env.GOOGLE_CLIENT_ID='';
 for(const path of ['/philip-aram/','/kat-kai/statistics/','/api/account','/account/'])assert.equal((await call(env,path)).status,503);
});
test('anonymous sessions reveal no workspace list and direct links require login',async()=>{
 const env=environment();assert.deepEqual((await (await call(env,'/api/account')).json()).workspaces,[]);
 for(const path of ['/philip-aram/','/troy-kearns/','/kat-kai/','/foo/%2e%2e/philip-aram/','/%70hilip-aram/'])assert.equal((await call(env,path)).status,303);
});
test('membership restricts pages, account manager and aliases; revoke applies to current session',async()=>{
 const env=environment(),headers=await session(env,'client','client@gmail.com');
 env.db.prepare('INSERT INTO memberships VALUES (?,?,?)').run('client@gmail.com','kat-kai','client');
 assert.equal((await call(env,'/kat-kai/',{headers})).status,200);
 for(const path of ['/philip-aram/','/troykearns/','/troy-kearns/','/account/','/api/account/memberships'])assert.equal((await call(env,path,{headers})).status,403);
 const account=await (await call(env,'/api/account',{headers})).json();assert.equal(account.workspaces.length,1);assert.equal(account.workspaces[0].id,'kat-kai');
 assert.equal((await call(env,'/kat-kai/',{headers})).headers.get('cache-control'),'private, no-store');
 env.db.exec('DELETE FROM memberships');assert.equal((await call(env,'/kat-kai/',{headers})).status,403);
});
test('owner can grant and revoke, with CSRF and input checks',async()=>{
 const env=environment(),headers={...await session(env,'owner','owner@gmail.com',true),'Content-Type':'application/json',origin};
 assert.equal((await (await call(env,'/api/account',{headers})).json()).workspaces.length,3);
 const body=JSON.stringify({email:'Client@Gmail.com',workspace:'kat-kai'});
 assert.equal((await call(env,'/api/account/memberships',{method:'POST',headers:{...headers,origin:'https://other.example'},body})).status,403);
 assert.equal((await call(env,'/api/account/memberships',{method:'POST',headers,body})).status,200);
 assert.equal(env.db.prepare('SELECT email FROM memberships').get().email,'client@gmail.com');
 assert.equal((await call(env,'/api/account/memberships',{method:'POST',headers,body:'{"email":"x","workspace":"all"}'})).status,400);
 assert.equal((await call(env,'/api/account/memberships',{method:'DELETE',headers,body})).status,200);
 assert.equal(env.db.prepare('SELECT count(*) AS n FROM memberships').get().n,0);
});
test('logout requires same origin, expires cookie and invalidates session',async()=>{
 const env=environment(),headers=await session(env,'client','client@gmail.com');
 assert.equal((await call(env,'/auth/logout',{method:'POST',headers})).status,403);
 const r=await call(env,'/auth/logout',{method:'POST',headers:{...headers,origin}});assert.equal(r.status,303);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
 assert.equal((await (await call(env,'/api/account',{headers})).json()).user,null);
});
test('token claims reject unverified email, wrong nonce, and non-authoritative third-party email',()=>{
 const claims={sub:'123',email:'user@gmail.com',email_verified:true,nonce:'expected'};
 assert.ok(validClaims(claims,'expected'));assert.ok(!validClaims(claims,'wrong'));
 assert.ok(!validClaims({...claims,email_verified:false},'expected'));
 assert.ok(!validClaims({...claims,email:'user@example.org'},'expected'));
 assert.ok(validClaims({...claims,email:'user@example.org',hd:'example.org'},'expected'));
});
test('Google round trip verifies signed ID token, binds membership, prevents replay and redirects empty accounts',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='test';jwk.alg='RS256';
 const originalFetch=globalThis.fetch;let nonce,sub='new-user',audience='test-client',email='client@gmail.com';
 globalThis.fetch=async url=>{
  if(String(url).includes('/certs'))return new Response(JSON.stringify({keys:[jwk]}),{headers:{'Content-Type':'application/json'}});
  const id_token=await new SignJWT({nonce,email,email_verified:true}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer('https://accounts.google.com').setAudience(audience).setSubject(sub).setIssuedAt().setExpirationTime('5m').sign(privateKey);
  return new Response(JSON.stringify({id_token}));
 };
 try{
  const env=environment();env.db.prepare('INSERT INTO memberships VALUES (?,?,NULL)').run('client@gmail.com','kat-kai');
  const start=await call(env,'/auth/start');const google=new URL(start.headers.get('location'));nonce=google.searchParams.get('nonce');const state=google.searchParams.get('state');const headers={cookie:`__Host-fmw-state=${state}`};
  assert.equal(google.searchParams.get('scope'),'openid email');assert.equal(google.searchParams.get('code_challenge_method'),'S256');
  assert.equal((await call(env,`/auth/callback?state=${state}&code=example`)).status,400);
  const result=await call(env,`/auth/callback?state=${state}&code=example`,{headers});assert.equal(result.headers.get('location'),'/kat-kai/');
  assert.equal(env.db.prepare('SELECT google_sub FROM memberships').get().google_sub,'new-user');
  assert.match(result.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.equal((await call(env,`/auth/callback?state=${state}&code=example`,{headers})).status,400);
  // An identically named email on another Google subject cannot inherit the existing binding.
  sub='different-user';const next=await call(env,'/auth/start');const g=new URL(next.headers.get('location'));nonce=g.searchParams.get('nonce');const s=g.searchParams.get('state');
  const noAccess=await call(env,`/auth/callback?state=${s}&code=example`,{headers:{cookie:`__Host-fmw-state=${s}`}});
  assert.equal(noAccess.headers.get('location'),'/build-a-business/');
  // Google subject stays linked when an email-created account changes its email.
  const linkedEnv=environment();linkedEnv.db.prepare('INSERT INTO users VALUES (?,?,?)').run('email:stable','client@gmail.com',1);
  linkedEnv.db.prepare('INSERT INTO memberships VALUES (?,?,?)').run('client@gmail.com','troy-kearns','email:stable');
  sub='linked-google';
  async function linkedLogin(){const r=await call(linkedEnv,'/auth/start');const u=new URL(r.headers.get('location'));nonce=u.searchParams.get('nonce');const state=u.searchParams.get('state');return call(linkedEnv,`/auth/callback?state=${state}&code=example`,{headers:{cookie:`__Host-fmw-state=${state}`}});}
  assert.equal((await linkedLogin()).headers.get('location'),'/troykearns/strategy/');
  email='renamed@gmail.com';assert.equal((await linkedLogin()).headers.get('location'),'/troykearns/strategy/');
  assert.equal(linkedEnv.db.prepare('SELECT user_sub FROM google_identity_links').get().user_sub,'email:stable');
  audience='wrong-client';const wrong=await call(env,'/auth/start');const wg=new URL(wrong.headers.get('location'));nonce=wg.searchParams.get('nonce');const ws=wg.searchParams.get('state');
  const invalid=await call(env,`/auth/callback?state=${ws}&code=example`,{headers:{cookie:`__Host-fmw-state=${ws}`}});
  assert.equal(invalid.headers.get('location'),'/?signin=failed');
  assert.ok(!invalid.headers.get('set-cookie').includes('__Host-fmw-session'));

 }finally{globalThis.fetch=originalFetch;}
});

test('expired sessions and unexpected hosts are rejected',async()=>{
 const env=environment(),headers=await session(env,'expired','expired@gmail.com');
 env.db.exec('UPDATE sessions SET expires_at=1');
 assert.equal((await call(env,'/philip-aram/',{headers})).status,303);
 assert.equal((await worker.fetch(new Request('https://other.example/philip-aram/'),env)).status,421);
});
test('canonical redirects preserve path and only allow expected hosts',async()=>{
 const env=environment();
 for(const address of ['http://freemarketwildlife.com/kat-kai/','https://www.freemarketwildlife.com/kat-kai/']){
  const r=await worker.fetch(new Request(address),env);assert.equal(r.status,308);assert.equal(r.headers.get('location'),origin+'/kat-kai/');
 }
});
test('only public metrics use origin passthrough and cookies are stripped',async()=>{
 const env=environment();env.PUBLIC_DATA_PASSTHROUGH='github-pages';const saved=globalThis.fetch;let forwarded;
 globalThis.fetch=async req=>{forwarded=req;return new Response('{"status":"ok"}',{headers:{'Set-Cookie':'unwanted=1'}});};
 try {
  const r=await call(env,'/assets/data/youtube.json',{headers:{cookie:'__Host-fmw-session=secret'}});
  assert.equal(r.status,200);assert.equal(forwarded.headers.get('cookie'),null);assert.equal(r.headers.get('set-cookie'),null);
  forwarded=null;await call(env,'/assets/data/workspace-auth.json');assert.equal(forwarded,null);
  await call(env,'/assets/data/private.json');assert.equal(forwarded,null);
 }finally{globalThis.fetch=saved;}
});

test('ambiguous duplicate-slash routes cannot bypass workspace authorization',async()=>{
 const env=environment();
 for(const path of ['//philip-aram/','/%2fphilip-aram/','/foo/%2e%2e/%2fphilip-aram/'])assert.notEqual((await call(env,path)).status,200);
});

test('first assigned workspace is primary even when catalog order differs; new grants preserve it',async()=>{
 const env=environment(),headers=await session(env,'client','client@gmail.com');
 const grant=env.db.prepare('INSERT INTO memberships VALUES (?,?,?)');
 grant.run('client@gmail.com','kat-kai','client');
 grant.run('client@gmail.com','philip-aram','client');
 let account=await (await call(env,'/api/account',{headers})).json();
 assert.equal(account.primaryWorkspace.id,'kat-kai');
 assert.deepEqual(account.workspaces.map(w=>w.id),['kat-kai','philip-aram']);
 grant.run('client@gmail.com','troy-kearns','client');
 account=await (await call(env,'/api/account',{headers})).json();
 assert.equal(account.primaryWorkspace.id,'kat-kai');
 // Browsing another workspace never changes the default.
 await call(env,'/troykearns/',{headers});
 assert.equal((await (await call(env,'/api/account',{headers})).json()).primaryWorkspace.id,'kat-kai');
 env.db.exec("DELETE FROM memberships WHERE workspace='kat-kai'");
 assert.equal((await (await call(env,'/api/account',{headers})).json()).primaryWorkspace.id,'philip-aram');
 env.db.exec('DELETE FROM memberships');
 assert.equal((await (await call(env,'/api/account',{headers})).json()).primaryWorkspace,null);
});

test('task photos are shared within Kat & Kai, validate uploads, and revoke with membership',async()=>{
 const env=environment(),objects=new Map();
 env.TASK_PHOTOS={
  async put(key,bytes,metadata){objects.set(key,{bytes,...metadata});},
  async get(key){const o=objects.get(key);return o?{...o,body:o.bytes}:null;},
  async list({prefix}){return {objects:[...objects].filter(([key])=>key.startsWith(prefix)).map(([key,o])=>({key,size:o.bytes.length,customMetadata:o.customMetadata})),truncated:false};}
 };
 const path='/kat-kai/api/task-photos/kat-photos';
 assert.equal((await call(env,path)).status,303);
 const headers={...await session(env,'kat','kat@gmail.com'),origin,'Content-Type':'image/png'};
 assert.equal((await call(env,path,{headers})).status,403);
 env.db.prepare('INSERT INTO memberships VALUES (?,?,?)').run('kat@gmail.com','kat-kai','kat');
 const png=new Uint8Array([137,80,78,71,13,10,26,10,0]);
 assert.equal((await call(env,path,{method:'POST',headers:{...headers,origin:'https://evil.example'},body:png})).status,403);
 assert.equal((await call(env,path,{method:'POST',headers,body:'not an image'})).status,415);
 assert.equal((await call(env,path,{method:'POST',headers:{...headers,'Content-Type':'image/svg+xml'},body:'<svg/>'})).status,415);
 assert.equal((await call(env,path,{method:'POST',headers:{...headers,'Content-Length':String(21*1024*1024)},body:png})).status,413);
 assert.equal((await call(env,'/kat-kai/api/task-photos/unknown',{headers})).status,404);
 const uploaded=await call(env,path+'?name=Kat%20smile.png',{method:'POST',headers,body:png});
 assert.equal(uploaded.status,201);const photo=await uploaded.json();
 assert.equal(photo.name,'Kat smile.png');
 assert.equal((await (await call(env,path,{headers})).json()).photos.length,1);
 assert.equal((await (await call(env,'/kat-kai/api/task-photos/kai-photos',{headers})).json()).photos.length,0);
 const download=await call(env,photo.url,{headers});
 assert.equal(download.status,200);assert.equal(download.headers.get('content-type'),'image/png');
 assert.equal(download.headers.get('cache-control'),'private, no-store');
 assert.deepEqual(new Uint8Array(await download.arrayBuffer()),png);
 assert.equal((await call(env,photo.url.replace('kat-photos','kai-photos'),{headers})).status,404);
 const ownerHeaders=await session(env,'owner-photos','owner@gmail.com',true);
 assert.equal((await (await call(env,path,{headers:ownerHeaders})).json()).photos.length,1);
 // Reset the test token to Kat, then revoke her membership.
 env.db.prepare('UPDATE sessions SET google_sub=?').run('kat');
 env.db.exec('DELETE FROM memberships');
 assert.equal((await call(env,photo.url,{headers})).status,403);
 assert.equal(objects.size,1);
});
test('task photo storage fails clearly when not configured',async()=>{
 const env=environment(),headers=await session(env,'photo-owner','owner@gmail.com',true);
 const r=await call(env,'/kat-kai/api/task-photos/kat-photos',{headers});
 assert.equal(r.status,503);assert.match((await r.json()).error,/Storage setup/);
});

async function emailFixture(run){
 const env=environment();env.RESEND_API_KEY='test-key';env.EMAIL_FROM='Free Market Wildlife <signin@auth.example.com>';
 const previous=globalThis.fetch;const sent=[];
 globalThis.fetch=async (url,options)=>{assert.equal(url,'https://api.resend.com/emails');sent.push(JSON.parse(options.body));return new Response('{"id":"test"}',{status:200});};
 const post=(path,body,cookie='')=>call(env,'/auth/email/'+path,{method:'POST',headers:{origin,'Content-Type':'application/json','cf-connecting-ip':'192.0.2.1',cookie},body:JSON.stringify(body)});
 try{await run({env,sent,post});}finally{globalThis.fetch=previous;}
}
test('email code requires inbox proof, binds Troy grant, restricts workspace and prevents replay',async()=>emailFixture(async({env,sent,post})=>{
 env.db.prepare('INSERT INTO memberships VALUES (?,?,NULL)').run('tk@troykearns.com','troy-kearns');
 const start=await post('start',{email:'TK@TroyKearns.com'});assert.equal(start.status,200);
 const cookie=start.headers.get('set-cookie').split(';')[0];assert.match(cookie,/__Host-fmw-email=[a-f0-9]{64}/);
 const code=sent[0].text.match(/code is (\d{8})/)[1];
 assert.equal(sent[0].to[0],'tk@troykearns.com');
 const stored=env.db.prepare('SELECT * FROM email_challenges').get();assert.ok(!Object.values(stored).includes(code));
 assert.equal((await post('verify',{code})).status,400);
 const wrong=code==='00000000'?'11111111':'00000000';assert.equal((await post('verify',{code:wrong},cookie)).status,400);
 const verified=await post('verify',{code},cookie);assert.equal(verified.status,200);
 assert.equal((await verified.json()).redirect,'/troykearns/strategy/');
 const sessionCookie=verified.headers.getSetCookie().find(c=>c.startsWith('__Host-fmw-session=')).split(';')[0];
 const headers={cookie:sessionCookie};assert.equal((await call(env,'/troykearns/strategy/',{headers})).status,200);
 assert.equal((await call(env,'/philip-aram/',{headers})).status,403);
 assert.equal((await post('verify',{code},cookie)).status,400);
 env.db.exec('DELETE FROM memberships');assert.equal((await call(env,'/troykearns/',{headers})).status,403);
}));
test('email expiry and five wrong guesses invalidate codes; sending is throttled',async()=>emailFixture(async({env,sent,post})=>{
 const start=await post('start',{email:'test@example.com'});const cookie=start.headers.get('set-cookie').split(';')[0];
 const code=sent[0].text.match(/code is (\d{8})/)[1];const wrong=code==='00000000'?'11111111':'00000000';
 for(let i=0;i<5;i++)assert.equal((await post('verify',{code:wrong},cookie)).status,400);
 assert.equal((await post('verify',{code},cookie)).status,400);
 assert.equal((await post('start',{email:'test@example.com'})).status,429);assert.equal(sent.length,1);
 const another=await post('start',{email:'other@example.com'});const nextCookie=another.headers.get('set-cookie').split(';')[0];
 env.db.exec('UPDATE email_challenges SET expires_at=1');
 assert.equal((await post('verify',{code:sent[1].text.match(/code is (\d{8})/)[1]},nextCookie)).status,400);
}));
test('email sign-in fails closed, rejects CSRF and owner login, handles delivery failure',async()=>emailFixture(async({env,sent,post})=>{
 assert.equal((await post('start',{email:'owner@gmail.com'})).status,400);assert.equal(sent.length,0);
 assert.equal((await call(env,'/auth/email/start',{method:'POST',headers:{origin:'https://evil.example','Content-Type':'application/json'},body:'{"email":"a@example.com"}'})).status,403);
 assert.equal((await post('start',null)).status,400);
 globalThis.fetch=async()=>new Response('{}',{status:429});assert.equal((await post('start',{email:'fail@example.com'})).status,502);
 assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM email_challenges').get().n,0);
 delete env.RESEND_API_KEY;assert.equal((await post('start',{email:'a@example.com'})).status,503);
}));
test('email login preserves existing Google membership; unassigned accounts get no workspace',async()=>emailFixture(async({env,sent,post})=>{
 await session(env,'google-client','client@example.com');env.db.prepare('INSERT INTO memberships VALUES (?,?,?)').run('client@example.com','kat-kai','google-client');
 let start=await post('start',{email:'client@example.com'});let cookie=start.headers.get('set-cookie').split(';')[0];
 let result=await post('verify',{code:sent[0].text.match(/code is (\d{8})/)[1]},cookie);
 assert.equal((await result.json()).redirect,'/kat-kai/');assert.equal(env.db.prepare('SELECT google_sub FROM memberships').get().google_sub,'google-client');
 start=await post('start',{email:'unassigned@example.com'});cookie=start.headers.get('set-cookie').split(';')[0];
 result=await post('verify',{code:sent[1].text.match(/code is (\d{8})/)[1]},cookie);assert.equal((await result.json()).redirect,'/build-a-business/');
}));


test('Troy opens Strategy by default and protects To-Do List and Links with the same membership',async()=>{
 const env=environment(),headers=await session(env,'troy-client','client@gmail.com');
 env.db.prepare('INSERT INTO memberships VALUES (?,?,?)').run('client@gmail.com','troy-kearns','troy-client');
 const account=await (await call(env,'/api/account',{headers})).json();
 assert.equal(account.primaryWorkspace.path,'/troykearns/strategy/');
 for(const path of ['/troykearns','/troykearns/','/troykearns/index.html','/troy-kearns/','/TROY-KEARNS/index.html']){
  const result=await call(env,path,{headers});assert.equal(result.status,303);assert.equal(result.headers.get('location'),'/troykearns/strategy/');
 }
 for(const path of ['/troykearns/strategy/','/troykearns/to-do/','/troykearns/links/']){
  assert.equal((await call(env,path,{headers})).status,200);
  assert.equal((await call(env,path)).status,303);
 }
 env.db.exec('DELETE FROM memberships');
 for(const path of ['/troykearns/','/troykearns/to-do/','/troykearns/links/'])assert.equal((await call(env,path,{headers})).status,403);
});
