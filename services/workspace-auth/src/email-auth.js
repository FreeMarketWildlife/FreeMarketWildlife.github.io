const now=()=>Math.floor(Date.now()/1000);
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export const emailReady=env=>!!(env.RESEND_API_KEY && env.EMAIL_FROM);
export const emailCookie=(token,age=600)=>`__Host-fmw-email=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
async function rate(env,key,seconds,limit){
 const time=now(),bucket=await hash(key)+':'+Math.floor(time/seconds);
 return !!await env.DB.prepare('INSERT INTO email_rate_limits VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET requests=requests+1 WHERE requests<? RETURNING requests').bind(bucket,time+seconds,limit).first();
}
export async function emailAuth(req,env,path){
 if(!emailReady(env))return json({error:'Email sign-in is not available yet.'},503);
 if(req.method!=='POST')return json({error:'Method not allowed.'},405);
 if(req.headers.get('origin')!==env.SITE_ORIGIN || !req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Forbidden.'},403);
 if(Number(req.headers.get('content-length'))>1024)return json({error:'Request too large.'},413);
 const text=await req.text();if(text.length>1024)return json({error:'Request too large.'},413);
 let body;try{body=JSON.parse(text);}catch{return json({error:'Invalid request.'},400);}
 if(!body || typeof body!=='object')return json({error:'Invalid request.'},400);
 const ip=req.headers.get('cf-connecting-ip')||'unknown';
 if(path==='/auth/email/start'){
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Enter a valid email address.'},400);
  // Email verification never bootstraps or unlocks the site owner's identity.
  if(email===env.OWNER_EMAIL.toLowerCase())return json({error:'Please use Google to sign in to the owner account.'},400);
  await env.DB.prepare('DELETE FROM email_rate_limits WHERE expires_at<=?').bind(now()).run();
  if(!await rate(env,'cooldown:'+email,60,1) || !await rate(env,'email:'+email,3600,5) || !await rate(env,'ip:'+ip,3600,10) || !await rate(env,'all',86400,80))return json({error:'Too many requests. Please try again later.'},429);
  await env.DB.prepare('DELETE FROM email_challenges WHERE expires_at<=?').bind(now()).run();
  const token=random();
  // Eight random digits, sampled without modulo bias.
  let number;do{number=crypto.getRandomValues(new Uint32Array(1))[0];}while(number>=4200000000);
  const code=String(number%100000000).padStart(8,'0');
  const tokenHash=await hash(token);
  await env.DB.prepare('INSERT INTO email_challenges (token_hash,email,code_hash,expires_at) VALUES (?,?,?,?)').bind(tokenHash,email,await hash(token+':'+code),now()+600).run();
  let sent;
  try{sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[email],subject:'Your Free Market Wildlife sign-in code',text:`Your Free Market Wildlife sign-in code is ${code}.\n\nEnter it in the browser where you requested it. This code expires in 10 minutes and works once.\n\nIf you did not request this code, you can ignore this email.`})});}catch{}
  if(!sent?.ok){await env.DB.prepare('DELETE FROM email_challenges WHERE token_hash=?').bind(tokenHash).run();return json({error:'Unable to send a code. Please try again later.'},502);}
  const result=json({ok:true});result.headers.set('Set-Cookie',emailCookie(token));return result;
 }
 if(path==='/auth/email/verify'){
  if(typeof body.code!=='string' || !/^\d{8}$/.test(body.code))return json({error:'Enter the 8-digit code from your email.'},400);
  if(!await rate(env,'verify:'+ip,3600,50))return json({error:'Too many attempts. Please try again later.'},429);
  const token=req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('__Host-fmw-email='))?.slice('__Host-fmw-email='.length)||'';
  if(!/^[a-f0-9]{64}$/.test(token))return json({error:'Request a new code in this browser.'},400);
  const tokenHash=await hash(token);
  const challenge=await env.DB.prepare('UPDATE email_challenges SET attempts=attempts+1 WHERE token_hash=? AND expires_at>? AND attempts<5 RETURNING email,code_hash').bind(tokenHash,now()).first();
  if(!challenge || challenge.code_hash!==await hash(token+':'+body.code))return json({error:'Invalid or expired code. Please try again or request a new code.'},400);
  // Atomic consumption prevents concurrent replay from creating two sessions.
  const consumed=await env.DB.prepare('DELETE FROM email_challenges WHERE token_hash=? RETURNING email').bind(tokenHash).first();
  if(!consumed)return json({error:'This code has already been used.'},400);
  if(consumed.email===env.OWNER_EMAIL.toLowerCase())return json({error:'Please use Google to sign in to the owner account.'},403);
  const existing=await env.DB.prepare('SELECT google_sub FROM users WHERE email=? ORDER BY created_at LIMIT 1').bind(consumed.email).first();
  const sub=existing?.google_sub||'email:'+random();
  // An existing owner identity can never be entered using an emailed code.
  if(await env.DB.prepare('SELECT google_sub FROM owner_identity WHERE singleton=1 AND google_sub=?').bind(sub).first())return json({error:'Please use Google to sign in to the owner account.'},403);
  await env.DB.prepare('INSERT INTO users VALUES (?,?,?) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email').bind(sub,consumed.email,now()).run();
  await env.DB.prepare('UPDATE memberships SET google_sub=? WHERE email=? AND google_sub IS NULL').bind(sub,consumed.email).run();
  return {sub,email:consumed.email};
 }
 return json({error:'Not found.'},404);
}
