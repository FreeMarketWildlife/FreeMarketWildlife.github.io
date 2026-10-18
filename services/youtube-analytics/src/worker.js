import {createRemoteJWKSet,jwtVerify} from 'jose';
import {SCOPES,hash,randomToken,encrypt,decrypt,nowISO,isDate,safeCsv} from './core.js';
import {google,accessToken,runSync} from './sync.js';
const headers={'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{...headers,...extra}});
const page=(title,body)=>new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{font:16px/1.6 Arial,sans-serif;background:#000;color:#fff;max-width:960px;margin:24px}a{color:#fff}button,input,select,textarea{font:inherit;color:#fff;background:#000;border:1px solid #fff;padding:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere}label{display:block;margin:16px 0}img{image-rendering:pixelated}</style><a href="https://freemarketwildlife.com/"><img width="40" height="40" alt="Free Market Wildlife home" src="https://freemarketwildlife.com/assets/images/mark.svg"></a><h1>${title}</h1>${body}</html>`,{headers:{...headers,'Content-Type':'text/html','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src https://freemarketwildlife.com; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});
const keys=new Map();
export async function admin(request,env){
 if(!env.ACCESS_ISSUER||!env.ACCESS_AUD)throw new Error('unauthorized');
 const issuer=env.ACCESS_ISSUER.replace(/\/$/,'');
 if(!issuer.startsWith('https://')||!new URL(issuer).hostname.endsWith('.cloudflareaccess.com'))throw new Error('unauthorized');
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token)throw new Error('unauthorized');
 if(!keys.has(issuer))keys.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
 const {payload}=await jwtVerify(token,keys.get(issuer),{issuer,audience:env.ACCESS_AUD,algorithms:['RS256']});
 const allowed=(env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase());
 if(!payload.email||!allowed.includes(payload.email.toLowerCase()))throw new Error('unauthorized');
 return payload.email;
}
export function trustedMutation(request,env){return request.headers.get('Origin')===env.PUBLIC_ORIGIN&&request.headers.get('Content-Type')?.startsWith('application/json');}
async function audit(env,action,actor){await env.DB.prepare('INSERT INTO audit_events(action,actor,created_at) VALUES(?,?,?)').bind(action,actor,nowISO()).run();}
function configured(env){return !!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET&&env.TOKEN_ENCRYPTION_KEY&&env.ACCESS_ISSUER&&env.ACCESS_AUD);}
async function callback(request,env){
 const url=new URL(request.url),state=url.searchParams.get('state');
 const cookie=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('__Host-yt-state='))?.slice(16);
 if(!state||state!==cookie)return json({error:'Invalid or expired connection state.'},400);
 const record=await env.DB.prepare('DELETE FROM oauth_states WHERE hash=? AND expires_at>? RETURNING *').bind(await hash(state),Date.now()).first();
 if(!record)return json({error:'Connection link expired; request a new invitation.'},400);
 const invite=await env.DB.prepare('SELECT * FROM invitations WHERE hash=? AND used_at IS NULL AND expires_at>?').bind(record.invite_hash,Date.now()).first();
 if(!invite)return json({error:'Invitation expired or already used.'},400);
 if(url.searchParams.get('error'))return page('Connection cancelled','<p>No channel connection was created.</p>');
 const code=url.searchParams.get('code');if(!code)return json({error:'Authorization code missing.'},400);
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,code,grant_type:'authorization_code',redirect_uri:env.PUBLIC_ORIGIN+'/oauth/callback',code_verifier:await decrypt(record.verifier,env.TOKEN_ENCRYPTION_KEY)})});
 if(!response.ok)return json({error:'Google authorization could not be completed. Request a new invitation.'},400);
 const tokens=await response.json();
 async function reject(message){if(tokens.refresh_token)await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',body:new URLSearchParams({token:tokens.refresh_token})});return json({error:message},400);}
 if(!SCOPES.every(scope=>(tokens.scope||'').split(' ').includes(scope))||!tokens.refresh_token)return reject('Both read-only permissions and offline access are required.');
 const channels=await google('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',tokens.access_token);
 if(!channels.items?.some(c=>c.id===env.EXPECTED_CHANNEL_ID))return reject('That Google account did not authorize Troy’s expected channel. Switch to the correct channel owner.');
 // Verify Analytics ownership as well; a Studio invitation alone may not work for APIs.
 const report=await fetch('https://youtubeanalytics.googleapis.com/v2/reports?'+new URLSearchParams({ids:'channel=='+env.EXPECTED_CHANNEL_ID,startDate:'2026-01-01',endDate:'2026-01-02',metrics:'views'}),{headers:{Authorization:'Bearer '+tokens.access_token}});
 if(!report.ok)return reject('YouTube Analytics access was not granted for this channel. The channel owner needs to authorize it.');
 const claimed=await env.DB.prepare('UPDATE invitations SET used_at=? WHERE hash=? AND used_at IS NULL RETURNING hash').bind(Date.now(),record.invite_hash).first();
 if(!claimed)return reject('Invitation already used.');
 await env.DB.prepare('INSERT OR REPLACE INTO connection VALUES(1,?,?,?,?,?,?)').bind(env.EXPECTED_CHANNEL_ID,await encrypt(tokens.refresh_token,env.TOKEN_ENCRYPTION_KEY),tokens.scope,nowISO(),nowISO(),'connected').run();
 await audit(env,'channel_connected','channel_owner');
 return new Response(await page('YouTube connected','<p>Read-only channel access is connected. Historical collection will run in the background. No video-management or revenue access was requested.</p><p>You can revoke access through your <a href="https://myaccount.google.com/connections">Google account connections</a>.</p>').text(),{headers:{...headers,'Content-Type':'text/html','Set-Cookie':'__Host-yt-state=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src https://freemarketwildlife.com; frame-ancestors 'none'"}});
}
const adminHtml=`<p>Private analytics administration. Public website passwords do not grant access here.</p>
<button data-action="invite">Create 24-hour Troy invitation</button> <button data-action="sync">Run sync batch</button> <button data-action="disconnect">Disconnect and erase analytics</button>
<p id="status" role="status"></p><pre id="result"></pre>
<h2>Reports</h2><p><a href="/api/coverage">Collection coverage (JSON)</a> · <a href="/api/videos">Video inventory (JSON)</a> · <a href="/api/export">Collected report rows (CSV)</a></p>
<h2>Analysis notes</h2><form id="experiment"><label>Video ID (optional) <input name="video_id"></label><label>Hypothesis <textarea name="hypothesis" required></textarea></label><label>Outcome metric <input name="outcome_metric" required></label><label>Matched cohort (format, duration, topic, publication age) <input name="cohort" required></label><label>Start <input type="date" name="window_start" required></label><label>End <input type="date" name="window_end" required></label><label>Notes <textarea name="notes"></textarea></label><button>Save analysis plan</button></form>
<p><a href="/api/experiments">Saved analysis plans</a></p><script src="/admin.js"></script>`;
export async function route(request,env,ctx){
 const path=new URL(request.url).pathname;
 if(request.method==='POST'&&Number(request.headers.get('Content-Length')||0)>16384)return json({error:'Request too large.'},413);
 if(path==='/health')return json({service:'youtube-analytics',ready:configured(env)});
 if(path==='/privacy')return page('YouTube analytics privacy','<p>Free Market Wildlife uses read-only YouTube channel and analytics access to help the authorizing creator evaluate content performance. Credentials are encrypted at rest. Analytics are stored on a private service accessible only to approved administrators. We do not sell data, request channel-management rights, or request revenue access.</p><p>Revoke through Google account connections or contact <a href="mailto:FreeMarketWildlife@gmail.com">FreeMarketWildlife@gmail.com</a>. Disconnection through this service revokes the token and erases stored channel analytics. Revocation detected during scheduled updates triggers deletion within seven days. Authorized history is retained while the connection remains valid; authorization is rechecked on each scheduled run. No individual viewer identities are collected.</p><p>Uses the <a href="https://www.youtube.com/t/terms">YouTube API Services</a> and <a href="https://policies.google.com/privacy">Google privacy policy</a>.</p>');
 if(path==='/connect'&&request.method==='GET')return page('Connect Troy’s YouTube channel',`<p>This invitation requests read-only channel and analytics access. No password sharing, video editing, deletion, publishing, or revenue access.</p><p><a href="/privacy">Privacy and data deletion</a></p><form id="connect"><button>Continue with Google</button></form><p id="status" role="status"></p><script src="/connect.js"></script>`);
 if(path==='/connect.js')return new Response(`document.querySelector('#connect').onsubmit=async e=>{e.preventDefault();const invite=location.hash.slice(1);history.replaceState(null,'',location.pathname);const r=await fetch('/oauth/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invite})});const d=await r.json();if(r.ok)location.assign(d.url);else document.querySelector('#status').textContent=d.error;};`,{headers:{...headers,'Content-Type':'text/javascript'}});
 if(path==='/oauth/start'&&request.method==='POST'){
  if(!configured(env))return json({error:'Private analytics is not configured yet.'},503);
  if(!trustedMutation(request,env))return json({error:'Invalid origin.'},403);
  const {invite}=await request.json();if(typeof invite!=='string'||invite.length!==64)return json({error:'Invalid invitation.'},400);
  const invitation=await env.DB.prepare('SELECT * FROM invitations WHERE hash=? AND used_at IS NULL AND expires_at>?').bind(await hash(invite),Date.now()).first();
  if(!invitation)return json({error:'Invitation expired or used. Request a new invitation.'},400);
  const state=randomToken(),verifier=randomToken();
  await env.DB.prepare('INSERT INTO oauth_states VALUES(?,?,?,?)').bind(await hash(state),await hash(invite),await encrypt(verifier,env.TOKEN_ENCRYPTION_KEY),Date.now()+10*60000).run();
  const params=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:env.PUBLIC_ORIGIN+'/oauth/callback',response_type:'code',scope:SCOPES.join(' '),access_type:'offline',prompt:'consent',state,code_challenge:await hash(verifier),code_challenge_method:'S256'});
  return json({url:'https://accounts.google.com/o/oauth2/v2/auth?'+params},200,{'Set-Cookie':`__Host-yt-state=${state}; Path=/; Max-Age=600; Secure; HttpOnly; SameSite=Lax`});
 }
 if(path==='/oauth/callback')return callback(request,env);
 let actor;
 try{actor=await admin(request,env);}catch{return json({error:'Approved administrator sign-in required.'},401);}
 if(path==='/admin')return page('Troy Kearns analytics',adminHtml);
 if(path==='/admin.js')return new Response(`const out=document.querySelector('#result');async function send(path,data={}){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});out.textContent=JSON.stringify(await r.json(),null,2);}document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{if(b.dataset.action==='disconnect'&&!confirm('Revoke access and erase all collected private analytics?'))return;send('/api/'+b.dataset.action);});document.querySelector('#experiment').onsubmit=e=>{e.preventDefault();send('/api/experiments',Object.fromEntries(new FormData(e.target)));};`,{headers:{...headers,'Content-Type':'text/javascript'}});
 if(request.method==='POST'&&!trustedMutation(request,env))return json({error:'Invalid origin.'},403);
 if(path==='/api/invite'&&request.method==='POST'){
  if(!configured(env))return json({error:'Complete hosting and Google OAuth configuration first.'},503);
  const invite=randomToken();await env.DB.prepare('INSERT INTO invitations VALUES(?,?,NULL)').bind(await hash(invite),Date.now()+86400000).run();await audit(env,'invitation_created',actor);
  return json({url:env.PUBLIC_ORIGIN+'/connect#'+invite,expiresInHours:24});
 }
 if(path==='/api/sync'&&request.method==='POST'){ctx.waitUntil(runSync(env));return json({queued:true});}
 if(path==='/api/coverage'){
  const connection=await env.DB.prepare('SELECT channel_id,status,connected_at,verified_at FROM connection WHERE id=1').first();
  const counts=await env.DB.prepare('SELECT report,status,COUNT(*) count FROM jobs GROUP BY report,status').all();
  return json({connection,inventory:await env.DB.prepare('SELECT COUNT(*) count FROM videos').first(),jobs:counts.results,meaning:'Empty/suppressed does not mean zero. Completion is tracked for each video, report, and date window.'});
 }
 if(path==='/api/bulk')return json((await env.DB.prepare('SELECT id,type_id,start_time,end_time,created_at,next_row,status,downloaded_at FROM bulk_reports ORDER BY start_time DESC LIMIT 100').all()).results);
 if(path==='/api/bulk-page'){const u=new URL(request.url);const r=await env.DB.prepare('SELECT payload FROM bulk_pages WHERE report_id=? AND page=?').bind(u.searchParams.get('report'),Math.max(0,Number(u.searchParams.get('page'))||0)).first();return json(r?JSON.parse(r.payload):{error:'Not found'},r?200:404);}
 if(path==='/api/videos')return json((await env.DB.prepare('SELECT id,title,published_at,visibility,refreshed_at FROM videos ORDER BY published_at DESC LIMIT 100 OFFSET ?').bind(Math.max(0,Number(new URL(request.url).searchParams.get('offset'))||0)).all()).results);
 if(path==='/api/experiments'&&request.method==='GET')return json((await env.DB.prepare('SELECT * FROM experiments ORDER BY created_at DESC LIMIT 100').all()).results);
 if(path==='/api/experiments'&&request.method==='POST'){
  const data=await request.json();const fields=['hypothesis','outcome_metric','cohort','window_start','window_end'];
  if(fields.some(f=>typeof data[f]!=='string'||!data[f].trim()||data[f].length>4000)||!isDate(data.window_start)||!isDate(data.window_end)||data.window_start>data.window_end)return json({error:'Provide a hypothesis, outcome, matched cohort, and valid date window.'},400);
  await env.DB.prepare('INSERT INTO experiments VALUES(?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),String(data.video_id||'').slice(0,100),data.hypothesis,data.outcome_metric,data.cohort,data.window_start,data.window_end,String(data.notes||'').slice(0,10000),nowISO()).run();await audit(env,'experiment_saved',actor);return json({saved:true});
 }
 if(path==='/api/export'){
  const offset=Math.max(0,Number(new URL(request.url).searchParams.get('offset'))||0);
  const rows=await env.DB.prepare('SELECT j.video_id,j.report,j.start_date,j.end_date,r.payload,r.fetched_at FROM analytics_rows r JOIN jobs j ON j.id=r.job_id ORDER BY j.id,r.row_key LIMIT 1000 OFFSET ?').bind(offset).all();
  const csv=['video_id,report,start_date,end_date,payload,fetched_at',...rows.results.map(r=>Object.values(r).map(safeCsv).join(','))].join('\n');
  return new Response(csv,{headers:{...headers,'Content-Type':'text/csv','Content-Disposition':'attachment; filename="youtube-analytics.csv"','X-Next-Offset':String(offset+rows.results.length)}});
 }
 if(path==='/api/disconnect'&&request.method==='POST'){
  const connection=await env.DB.prepare('SELECT * FROM connection WHERE id=1').first();
  if(connection){const refresh=await decrypt(connection.encrypted_refresh_token,env.TOKEN_ENCRYPTION_KEY);const revoked=await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',body:new URLSearchParams({token:refresh})});if(!revoked.ok&&revoked.status!==400)return json({error:'Google revocation failed. Revoke through Google account connections and try again.'},502);}
  await erase(env);await audit(env,'channel_disconnected_and_erased',actor);return json({disconnected:true,deleted:true});
 }
 return json({error:'Not found.'},404);
}
export async function erase(env){await env.DB.batch(['analytics_rows','jobs','videos','connection','oauth_states','invitations','bulk_pages','bulk_reports','reporting_jobs','experiments','cursors'].map(t=>env.DB.prepare('DELETE FROM '+t)));}
export default {
 async fetch(request,env,ctx){try{return await route(request,env,ctx);}catch{return json({error:'Request could not be completed.'},500);}},
 async scheduled(event,env,ctx){ctx.waitUntil((async()=>{try{await runSync(env);}catch{/* No token or upstream response is logged. */}const c=await env.DB.prepare('SELECT status,verified_at FROM connection WHERE id=1').first();if(c&&(c.status==='reconnect_required'||Date.now()-Date.parse(c.verified_at)>7*86400000))await erase(env);})());}
};
