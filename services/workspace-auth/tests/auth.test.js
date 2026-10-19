import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import worker,{hash,protectedWorkspace,validClaims} from '../src/worker.js';
const origin='https://freemarketwildlife.com';
function environment(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../migrations/0001_auth.sql',import.meta.url),'utf8'));
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
 const originalFetch=globalThis.fetch;let nonce,sub='new-user',audience='test-client';
 globalThis.fetch=async url=>{
  if(String(url).includes('/certs'))return new Response(JSON.stringify({keys:[jwk]}),{headers:{'Content-Type':'application/json'}});
  const id_token=await new SignJWT({nonce,email:'client@gmail.com',email_verified:true}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer('https://accounts.google.com').setAudience(audience).setSubject(sub).setIssuedAt().setExpirationTime('5m').sign(privateKey);
  return new Response(JSON.stringify({id_token}));
 };
 try{
  const env=environment();env.db.prepare('INSERT INTO memberships VALUES (?,?,NULL)').run('client@gmail.com','kat-kai');
  const start=await call(env,'/auth/start');const google=new URL(start.headers.get('location'));nonce=google.searchParams.get('nonce');const state=google.searchParams.get('state');const headers={cookie:`__Host-fmw-state=${state}`};
  assert.equal(google.searchParams.get('scope'),'openid email');assert.equal(google.searchParams.get('code_challenge_method'),'S256');
  assert.equal((await call(env,`/auth/callback?state=${state}&code=example`)).status,400);
  const result=await call(env,`/auth/callback?state=${state}&code=example`,{headers});assert.equal(result.headers.get('location'),'/?workspaces=1');
  assert.equal(env.db.prepare('SELECT google_sub FROM memberships').get().google_sub,'new-user');
  assert.match(result.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.equal((await call(env,`/auth/callback?state=${state}&code=example`,{headers})).status,400);
  // An identically named email on another Google subject cannot inherit the existing binding.
  sub='different-user';const next=await call(env,'/auth/start');const g=new URL(next.headers.get('location'));nonce=g.searchParams.get('nonce');const s=g.searchParams.get('state');
  const noAccess=await call(env,`/auth/callback?state=${s}&code=example`,{headers:{cookie:`__Host-fmw-state=${s}`}});
  assert.equal(noAccess.headers.get('location'),'/build-a-business/');
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
