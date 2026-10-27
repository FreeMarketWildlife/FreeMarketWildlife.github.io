import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import gamesWorker from '../services/games/worker.mjs';
const source=await readFile(new URL('../assets/js/account-destination.js',import.meta.url),'utf8');
const {primaryWorkspacePath}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const kat={id:'kat-kai',path:'/kat-kai/'},troy={id:'troy-kearns',path:'/troykearns/strategy/'};
const account=(workspaces,primaryWorkspace)=>({user:{email:'synthetic@example.invalid'},workspaces,primaryWorkspace});
assert.equal(primaryWorkspacePath(account([kat],kat)),'/kat-kai/');
assert.equal(primaryWorkspacePath(account([kat,troy],troy)),'/troykearns/strategy/');
for(const input of [null,{},account([],null),account([kat],null),account([kat,troy],null),account([],kat),account([kat],troy),account([kat],{...kat,path:'/philip-aram/'}),account([kat,kat],kat),{...account([kat],kat),user:null}])assert.equal(primaryWorkspacePath(input),null);
for(const path of ['https://evil.invalid/','//evil.invalid/','/\\evil.invalid/','/%2f%2fevil.invalid/','/kat-kai/?next=https://evil.invalid','/kat-kai/#x','/kat-kai/../philip-aram/','/kat-kai/\n','javascript:alert(1)']) {
 const invalid={id:'kat-kai',path};assert.equal(primaryWorkspacePath(account([invalid],invalid)),null,path);
}
const origin='https://freemarketwildlife.com';let reads=0;
const env={ASSETS:{fetch:async request=>{reads++;return new Response(new URL(request.url).pathname);}}};
for(const path of ['/games','/games/','/games/index.html','/portfolio/critz/games','/portfolio/critz/games/','/portfolio/critz/games/index.html']){
 const result=await gamesWorker.fetch(new Request(origin+path+'?view=all'),env);
 assert.equal(result.status,308);assert.equal(result.headers.get('location'),origin+'/game/?view=all');
}
assert.equal(reads,0);
for(const path of ['/games/baad-math/','/games/treetop-trebuchet/','/games/builds/baad-math/index.html','/games/catalog.json','/games/runner/']){
 const result=await gamesWorker.fetch(new Request(origin+path),env);assert.equal(result.status,200);assert.equal(await result.text(),path);
}
const legacy=await gamesWorker.fetch(new Request(origin+'/portfolio/critz/games/baad-math/?test=1'),env);
assert.equal(legacy.headers.get('location'),origin+'/games/baad-math/?test=1');
console.log('PASS: authorized primary selection, ambiguous/missing/revoked membership fallback, unsafe destinations rejected, legacy hub redirects and direct game routes preserved.');
