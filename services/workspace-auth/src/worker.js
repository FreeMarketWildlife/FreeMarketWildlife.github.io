import { businessAPI, retryBusinessNotifications, businessInboxWelcome } from './business.js';
import { emailAuth, emailReady, emailCookie } from './email-auth.js';
import { taskPhotos } from './task-photos.js';
import { contracts } from './contracts.js';
import { troySpreadsheetFile } from './troy-spreadsheets.js';
import { workspaceWelcome } from './workspace-welcome.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';
export const WORKSPACES = Object.freeze([
  {id:'philip-aram', name:'Philip Aram', path:'/philip-aram/'},
  {id:'troy-kearns', name:'Troy Kearns', path:'/troykearns/strategy/'},
  {id:'kat-kai', name:'Kat & Kai', path:'/kat-kai/'}
]);
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const now = () => Math.floor(Date.now()/1000);
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
export function isPublicData(path) {
  return /^\/assets\/data\/(?:youtube|kat-kai-youtube|tanoshi-youtube)(?:-videos|-history)?\.json$/.test(path)
    || /^\/assets\/data\/history\/(?:youtube|kat-kai-youtube|tanoshi-youtube)\/[A-Za-z0-9_-]+\.json$/.test(path);
}
export async function hash(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), b=>b.toString(16).padStart(2,'0')).join('');
}
function cookie(req, name) { return req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1) || ''; }
function setCookie(name,value,age) {return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;}
function response(body,status=200,headers={}) {return new Response(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}});}
function json(body,status=200) {return response(JSON.stringify(body),status,{'Content-Type':'application/json'});}
function redirect(path,cookies=[]) {const r=response(null,303,{Location:path});for(const c of cookies)r.headers.append('Set-Cookie',c);return r;}
function ready(env) {return !!(env.DB && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.OWNER_EMAIL && env.SITE_ORIGIN?.startsWith('https://'));}
export function protectedWorkspace(path) {
  if (/^\/philip-aram(?:\/|$)/i.test(path)) return 'philip-aram';
  if (/^\/(?:troykearns|troy-kearns)(?:\/|$)/i.test(path)) return 'troy-kearns';
  if (/^\/kat-kai(?:\/|$)/i.test(path)) return 'kat-kai';
  return null;
}
export async function identity(req,env) {
  const token=cookie(req,'__Host-fmw-session');
  if(!/^[a-f0-9]{64}$/.test(token))return null;
  return await env.DB.prepare('SELECT u.google_sub, u.email FROM sessions s JOIN users u ON u.google_sub=s.google_sub WHERE s.token_hash=? AND s.expires_at>?').bind(await hash(token),now()).first();
}
async function owner(user,env) {
  return !!user && !!await env.DB.prepare('SELECT google_sub FROM owner_identity WHERE singleton=1 AND google_sub=?').bind(user.google_sub).first();
}
export async function permitted(user,env) {
  if(!user)return [];
  if(await owner(user,env))return WORKSPACES;
  const {results}=await env.DB.prepare('SELECT workspace FROM memberships WHERE google_sub=? ORDER BY rowid').bind(user.google_sub).all();
  return results.map(r=>WORKSPACES.find(w=>w.id===r.workspace)).filter(Boolean);
}
export function validClaims(claims,nonce) {
  return !!(claims.sub && claims.nonce===nonce && claims.email_verified===true && typeof claims.email==='string' && (claims.email.toLowerCase().endsWith('@gmail.com') || claims.hd));
}
function returnPath(value) {
  if(typeof value!=='string' || !value.startsWith('/') || value.startsWith('//') || /[%\\\x00-\x20]/.test(value))return '';
  const url=new URL(value,'https://local.invalid');
  if(url.origin!=='https://local.invalid' || !(url.pathname==='/build-a-business/' || url.pathname==='/account/business/' || protectedWorkspace(url.pathname)) || !workspacePage(url.pathname))return '';
  return url.pathname+url.search+url.hash;
}
function workspacePage(path) {return !path.includes('/api/') && !/\.(?!html$)[^/]+$/i.test(path);}
const returnCookie=value=>setCookie('__Host-fmw-return',encodeURIComponent(returnPath(value)),600);
function savedReturn(req) {
  try{return returnPath(decodeURIComponent(cookie(req,'__Host-fmw-return')));}catch{return '';}
}
async function start(env,inputUrl) {
  const state=random(), verifier=random(),nonce=random();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
  const challenge=btoa(String.fromCharCode(...digest)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  await env.DB.prepare('DELETE FROM oauth_states WHERE expires_at<=?').bind(now()).run();
  await env.DB.prepare('INSERT INTO oauth_states VALUES (?,?,?,?)').bind(await hash(state),verifier,nonce,now()+600).run();
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:env.SITE_ORIGIN+'/auth/callback',response_type:'code',scope:'openid email',state,nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}).toString();
  return redirect(url.href,[setCookie('__Host-fmw-state',state,600),returnCookie(inputUrl.searchParams.get('returnTo'))]);
}
async function callback(req,env,url) {
  const state=url.searchParams.get('state'), browserState=cookie(req,'__Host-fmw-state');
  if(!state || state!==browserState)return response('Sign-in expired. Please try again.',400);
  const saved=await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash=? AND expires_at>? RETURNING verifier,nonce').bind(await hash(state),now()).first();
  if(!saved)return response('Sign-in expired. Please try again.',400);
  const cleared=setCookie('__Host-fmw-state','',0);
  const returnTo=savedReturn(req);
  const retry=reason=>redirect(returnTo ? returnTo.split('#')[0]+(returnTo.includes('?')?'&':'?')+'signin='+reason : '/?signin='+reason,[cleared]);
  if(url.searchParams.has('error'))return retry('cancelled');
  const code=url.searchParams.get('code');if(!code)return response('Missing authorization code.',400);
  const exchange=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:env.SITE_ORIGIN+'/auth/callback',grant_type:'authorization_code',code_verifier:saved.verifier})});
  if(!exchange.ok)return retry('failed');
  const tokens=await exchange.json();
  let payload;
  try { ({payload}=await jwtVerify(tokens.id_token,keys,{issuer:['https://accounts.google.com','accounts.google.com'],audience:env.GOOGLE_CLIENT_ID,algorithms:['RS256'],maxTokenAge:'10m'})); }
  catch { return retry('failed'); }
  if(!validClaims(payload,saved.nonce))return retry('failed');
  const email=payload.email.toLowerCase();
  const googleSubject=payload.sub;
  const linked=await env.DB.prepare('SELECT user_sub FROM google_identity_links WHERE google_sub=?').bind(googleSubject).first();
  const emailIdentity=linked?null:await env.DB.prepare("SELECT google_sub FROM users WHERE email=? AND google_sub LIKE 'email:%' ORDER BY created_at LIMIT 1").bind(email).first();
  payload.sub=linked?.user_sub || emailIdentity?.google_sub || googleSubject;
  await env.DB.prepare('INSERT INTO users VALUES (?,?,?) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email').bind(payload.sub,email,now()).run();
  await env.DB.prepare('INSERT OR IGNORE INTO google_identity_links VALUES (?,?)').bind(googleSubject,payload.sub).run();
  if(email===env.OWNER_EMAIL.toLowerCase())await env.DB.prepare('INSERT OR IGNORE INTO owner_identity VALUES (1,?)').bind(payload.sub).run();
  await env.DB.prepare('UPDATE memberships SET google_sub=? WHERE email=? AND google_sub IS NULL').bind(payload.sub,email).run();
  return finishSession(req,env,payload.sub,email);
}
async function finishSession(req,env,sub,email,asJson=false) {
  const old=cookie(req,'__Host-fmw-session');
  if(old)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(old)).run();
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(now()).run();
  const session=random();
  await env.DB.prepare('INSERT INTO sessions VALUES (?,?,?)').bind(await hash(session),sub,now()+86400).run();
  const list=await permitted({google_sub:sub,email},env);
  const requested=savedReturn(req);
  const destination=requested && (requested==='/build-a-business/' || requested.startsWith('/account/business/') && await owner({google_sub:sub,email},env) || list.some(w=>w.id===protectedWorkspace(new URL(requested,env.SITE_ORIGIN).pathname))) ? requested : list[0]?.path || '/build-a-business/';
  const cookies=[asJson?emailCookie('',0):setCookie('__Host-fmw-state','',0),setCookie('__Host-fmw-return','',0),setCookie('__Host-fmw-session',session,86400)];
  if(!asJson)return redirect(destination,cookies);
  const result=json({ok:true,redirect:destination});for(const value of cookies)result.headers.append('Set-Cookie',value);return result;
}
async function handle(req,env) {
  const url=new URL(req.url);
  const canonical=new URL(env.SITE_ORIGIN);
  if(url.hostname===canonical.hostname && url.protocol==='http:' || canonical.hostname==='freemarketwildlife.com' && url.hostname==='www.freemarketwildlife.com')
    return response(null,308,{Location:canonical.origin+url.pathname+url.search});
  if(url.origin!==env.SITE_ORIGIN)return response('Unknown host.',421);
  let path;
  try {path=decodeURIComponent(url.pathname);}catch{return response('Invalid path.',400);}
  if(path.includes('%') || path.includes('//') || path.includes('\\') || path.includes('\0'))return response('Invalid path.',400);
  path=new URL(path,env.SITE_ORIGIN).pathname;
  if(['GET','HEAD'].includes(req.method) && ['/game','/portfolio/critz','/portfolio/critz/','/portfolio/critz/index.html'].includes(path))
    return response(null,308,{Location:'/game/'+url.search});
  const workspace=protectedWorkspace(path), isAccount=/^\/account(?:\/|$)/i.test(path);
  // Troy's workspace is publicly viewable; writes and other workspaces keep their access checks.
  const publicView=workspace==='troy-kearns' && ['GET','HEAD'].includes(req.method);
  const requiresAccess=(workspace && !publicView) || isAccount;
  const business=path.startsWith('/api/business/');
  const auth=path.startsWith('/auth/') || path.startsWith('/api/account') || business;
  if((auth || requiresAccess) && !ready(env))return response('Sign-in is not configured yet.',503);
  if(path==='/auth/start' && req.method==='GET')return start(env,url);
  if(path==='/auth/callback' && req.method==='GET')return callback(req,env,url);
  if(path.startsWith('/auth/email/')) {
    const result=await emailAuth(req,env,path);
    if(result instanceof Response) {
      if(path==='/auth/email/start' && result.ok)result.headers.append('Set-Cookie',returnCookie(url.searchParams.get('returnTo')));
      return result;
    }
    return finishSession(req,env,result.sub,result.email,true);
  }
  const user=(auth || requiresAccess)?await identity(req,env):null;
  if(business)return businessAPI(req,env,path,user,await owner(user,env));
  if(path==='/api/account' && req.method==='GET') {
    const workspaces=await permitted(user,env);
    return json({user:user?{email:user.email}:null,owner:await owner(user,env),workspaces,primaryWorkspace:workspaces[0] || null,providers:{google:true,email:emailReady(env),apple:false}});
  }
  if(path==='/auth/logout' && req.method==='POST') {
    if(req.headers.get('origin')!==env.SITE_ORIGIN)return response('Forbidden.',403);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(cookie(req,'__Host-fmw-session'))).run();
    return redirect('/',[setCookie('__Host-fmw-session','',0)]);
  }
  if(path==='/api/account/memberships') {
    if(!await owner(user,env))return response('Forbidden.',403);
    if(req.method==='GET')return json((await env.DB.prepare('SELECT email,workspace FROM memberships ORDER BY email,workspace').all()).results);
    if(!['POST','DELETE'].includes(req.method))return response('Method not allowed.',405);
    if(req.headers.get('origin')!==env.SITE_ORIGIN || !req.headers.get('content-type')?.startsWith('application/json'))return response('Forbidden.',403);
    if(Number(req.headers.get('content-length'))>4096)return response('Request too large.',413);
    const text=await req.text();if(text.length>4096)return response('Request too large.',413);
    let body;try{body=JSON.parse(text);}catch{return response('Invalid request.',400);}
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!WORKSPACES.some(w=>w.id===body.workspace))return response('Invalid email or workspace.',400);
    if(req.method==='DELETE')await env.DB.prepare('DELETE FROM memberships WHERE email=? AND workspace=?').bind(email,body.workspace).run();
    else {
      const existing=await env.DB.prepare('SELECT google_sub FROM users WHERE email=? ORDER BY created_at LIMIT 1').bind(email).first();
      await env.DB.prepare('INSERT OR IGNORE INTO memberships VALUES (?,?,?)').bind(email,body.workspace,existing?.google_sub||null).run();
    }
    return json({ok:true});
  }
  if(auth)return response('Not found.',404);
  if(requiresAccess) {
    if(!user) {
      if(path==='/account/business/' && ['GET','HEAD'].includes(req.method)) {
        const target=new URL(url);target.searchParams.delete('signin');
        const notice=url.searchParams.has('signin')?'Sign-in did not complete. Please try again.':'';
        return response(req.method==='HEAD'?null:businessInboxWelcome(target.pathname+target.search,notice),200,{'Content-Type':'text/html; charset=utf-8','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'});
      }
      if(workspace && ['GET','HEAD'].includes(req.method) && workspacePage(path)) {
        const client=WORKSPACES.find(w=>w.id===workspace);
        const notice=url.searchParams.get('signin')==='cancelled'?'Sign-in cancelled. Please try again.':url.searchParams.get('signin')==='failed'?'Sign-in failed. Please try again.':'';
        const target=new URL(url);target.searchParams.delete('signin');
        return response(req.method==='HEAD'?null:workspaceWelcome(client,target.pathname+target.search,emailReady(env),notice),200,{'Content-Type':'text/html; charset=utf-8','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'});
      }
      return redirect(workspace?WORKSPACES.find(w=>w.id===workspace).path:'/?signin=required');
    }
    if(isAccount ? !await owner(user,env) : !(await permitted(user,env)).some(w=>w.id===workspace))return response('You do not have access to this workspace.',403);
  }
  if(['GET','HEAD'].includes(req.method) && /^\/(?:troykearns|troy-kearns)(?:\/(?:index\.html)?)?$/i.test(path))return redirect('/troykearns/strategy/');
  const spreadsheet = await troySpreadsheetFile(req,env,path);
  if(spreadsheet)return spreadsheet;
  if(path.startsWith('/kat-kai/api/task-photos/'))return taskPhotos(req,env,path);
  if(/^\/(?:kat-kai|philip-aram)\/api\/contracts(?:\/|$)/i.test(path))return contracts(req,env,path);
  // Only the existing PUBLIC YouTube datasets pass through to the GitHub Pages origin.
  // Same-zone route subrequests reach the origin, not this Worker again. Strip cookies.
  if(env.PUBLIC_DATA_PASSTHROUGH==='github-pages' && isPublicData(path)) {
    if(!['GET','HEAD'].includes(req.method))return response('Method not allowed.',405);
    const upstream=await fetch(new Request(url.href,{method:req.method,headers:{Accept:'application/json'}}),{cf:{cacheTtl:0}});
    const headers=new Headers(upstream.headers);headers.set('Cache-Control','no-store');headers.delete('Set-Cookie');
    return new Response(upstream.body,{status:upstream.status,headers});
  }
  const assetUrl=new URL(req.url);assetUrl.pathname=path;
  const asset=await env.ASSETS.fetch(new Request(assetUrl,req));
  const headers=new Headers(asset.headers);
  headers.set('X-Content-Type-Options','nosniff');
  if(workspace || isAccount) {headers.set('Cache-Control','private, no-store');headers.set('Vary','Cookie');headers.set('X-Robots-Tag','noindex, nofollow');}
  return new Response(asset.body,{status:asset.status,headers});
}
export default { async scheduled(event,env,ctx) {ctx.waitUntil(retryBusinessNotifications(env));}, async fetch(req,env) {try{return await handle(req,env);}catch{return response('Unable to complete this request. Please try again.',500);}} };
