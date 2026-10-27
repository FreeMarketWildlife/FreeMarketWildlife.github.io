import {LIMIT,cleanSelections,recommend} from '../../../assets/js/business-model.js';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie'}});
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const time=()=>Math.floor(Date.now()/1000);
export function bookingUrl(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='calendly.com'||url.port||url.username||url.password||!/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname))return '';return url.origin+url.pathname;}catch{return '';}}
async function settings(env){const row=await env.DB.prepare("SELECT value FROM business_settings WHERE key='booking_url'").bind().first();return {bookingUrl:bookingUrl(row?.value||env.BUSINESS_BOOKING_URL||'')};}
function unpack(row){return {...row,skills:JSON.parse(row.skills),interests:JSON.parse(row.interests),recommendations:JSON.parse(row.recommendations)};}
export async function notifyInquiry(env,id){
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM||!env.OWNER_EMAIL)return false;
 const claimed=await env.DB.prepare("UPDATE business_inquiries SET notification_attempts=notification_attempts+1,notification_next_at=? WHERE id=? AND notification_status='pending' AND notification_attempts<5 AND notification_next_at<=? RETURNING *").bind(time()+900,id,time()).first();
 if(!claimed)return false;
 const row=unpack(claimed),selected=row.recommendations.find(b=>b.id===row.chosen);
 const text=`New Build a Business inquiry\n\nName: ${row.name}\nVerified email: ${row.email}\nChosen business: ${selected?.title||row.chosen}\n\nSkills: ${row.skills.join(', ')}\n\nInterests: ${row.interests.join(', ')}\n\nBusiness recommendations:\n${row.recommendations.map((b,i)=>`${i+1}. ${b.title}\nFit: ${b.matchKind==='starter'?'Skill-first starter; direct interest fit not established':b.matchKind==='direct'?'Direct skill and interest match':'Saved recommendation; review original selection evidence'}\n${b.service}\nCustomer: ${b.customer}\nSkills matched: ${b.skillMatches.join(', ')||'Exploratory'}\nInterests matched: ${b.interestMatches.join(', ')||'Exploratory'}\nNeeds: ${b.needs}\nFirst customer: ${b.first}`).join('\n\n')}\n\nAnything else:\n${row.notes||'(Nothing added)'}\n\nView privately: ${env.SITE_ORIGIN}/account/business/?inquiry=${row.id}\nInquiry ID: ${row.id}`;
 try{const result=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'business-inquiry/'+id},body:JSON.stringify({from:env.EMAIL_FROM,to:[env.OWNER_EMAIL],reply_to:row.email,subject:'New business inquiry: '+(selected?.title||'Build a Business'),text})});
  if(!result.ok)return false;
  await env.DB.prepare("UPDATE business_inquiries SET notification_status='sent' WHERE id=?").bind(id).run();return true;
 }catch{return false;}
}
export async function retryBusinessNotifications(env){
 const {results}=await env.DB.prepare("SELECT id FROM business_inquiries WHERE notification_status='pending' AND notification_attempts<5 AND notification_next_at<=? ORDER BY created_at LIMIT 10").bind(time()).all();
 for(const row of results)await notifyInquiry(env,row.id);
}
export async function businessAPI(req,env,path,user,isOwner){
 if(!env.DB)return json({error:'Business signup is unavailable. Please try again later.'},503);
 if(path==='/api/business/config'&&req.method==='GET')return json(await settings(env));
 const admin=path.startsWith('/api/business/admin');
 if(admin&&!isOwner)return json({error:'Forbidden.'},403);
 if(!user)return json({error:'Verify your email or sign in before sending your plan.'},401);
 if(req.method==='GET'&&path==='/api/business/admin/inquiries'){
  const query=new URL(req.url).searchParams,id=query.get('id');
  if(id){if(!uuid(id))return json({error:'Invalid inquiry.'},400);const row=await env.DB.prepare('SELECT * FROM business_inquiries WHERE id=?').bind(id).first();return row?json(unpack(row)):json({error:'Inquiry not found.'},404);}
  const offset=Math.max(0,Math.min(100000,Number(query.get('offset'))||0));
  const {results}=await env.DB.prepare('SELECT * FROM business_inquiries ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?').bind(offset).all();
  return json({inquiries:results.map(unpack),nextOffset:results.length===50?offset+50:null,...await settings(env)});
 }
 if(req.method!=='POST')return json({error:'Method not allowed.'},405);
 if(req.headers.get('origin')!==env.SITE_ORIGIN||!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Forbidden.'},403);
 if(Number(req.headers.get('content-length'))>20000)return json({error:'Request too large.'},413);
 const text=await req.text();if(text.length>20000)return json({error:'Request too large.'},413);
 let body;try{body=JSON.parse(text);}catch{return json({error:'Invalid request.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Invalid request.'},400);
 if(path==='/api/business/admin/settings'){
  if(typeof body.bookingUrl!=='string'||body.bookingUrl.length>500||body.bookingUrl&&!bookingUrl(body.bookingUrl))return json({error:'Use a Calendly event link such as https://calendly.com/your-name/business-chat, or leave it empty.'},400);
  await env.DB.prepare("INSERT INTO business_settings VALUES ('booking_url',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(bookingUrl(body.bookingUrl)).run();return json(await settings(env));
 }
 if(path==='/api/business/admin/retry'){
  if(!uuid(body.id))return json({error:'Invalid inquiry.'},400);
  const record=await env.DB.prepare('SELECT notification_status FROM business_inquiries WHERE id=?').bind(body.id).first();if(!record)return json({error:'Inquiry not found.'},404);
  if(record.notification_status!=='sent'){await env.DB.prepare('UPDATE business_inquiries SET notification_attempts=0,notification_next_at=0 WHERE id=?').bind(body.id).run();}
  const sent=record.notification_status==='sent'||await notifyInquiry(env,body.id);return json({notification:sent?'sent':'pending'});
 }
 if(path!=='/api/business/inquiries')return json({error:'Not found.'},404);
 const name=typeof body.name==='string'?body.name.trim():'',notes=typeof body.notes==='string'?body.notes.trim():'';
 if(!uuid(body.requestId)||!name||name.length>100||/[\x00-\x1f\x7f]/.test(name)||typeof body.notes!=='string'||notes.length>4000||body.consent!==true)return json({error:'Enter your name and agree to share your plan. Keep the message under 4,000 characters.'},400);
 const validSelections=values=>Array.isArray(values)&&values.length>0&&values.length<=LIMIT&&values.every(v=>typeof v==='string'&&v===v.trim()&&v.length>0&&v.length<=60&&!/[\x00-\x1f\x7f]/.test(v))&&cleanSelections(values).length===values.length;
 if(!validSelections(body.skills)||!validSelections(body.interests))return json({error:'Choose between 1 and 10 skills and interests.'},400);
 const matches=recommend(body.skills,body.interests);
 if(!matches.some(b=>b.id===body.chosen))return json({error:'Choose one of your current business matches.'},400);
 const skills=JSON.stringify(body.skills),interests=JSON.stringify(body.interests);
 const existing=await env.DB.prepare('SELECT * FROM business_inquiries WHERE user_sub=? AND request_id=?').bind(user.google_sub,body.requestId).first();
 if(existing){if(existing.name!==name||existing.notes!==notes||existing.skills!==skills||existing.interests!==interests||existing.chosen!==body.chosen)return json({error:'This plan was already submitted with different details. Start a new adventure to send another.'},409);return json({ok:true,id:existing.id,notification:existing.notification_status});}
 const id=crypto.randomUUID();
 // The conditional insert enforces the account limit even for simultaneous requests.
 const inserted=await env.DB.prepare("INSERT OR IGNORE INTO business_inquiries (id,user_sub,request_id,email,name,notes,skills,interests,recommendations,chosen,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM business_inquiries WHERE user_sub=? AND created_at>?)<3 RETURNING id").bind(id,user.google_sub,body.requestId,user.email,name,notes,skills,interests,JSON.stringify(matches),body.chosen,time(),user.google_sub,time()-86400).first();
 if(!inserted){const duplicate=await env.DB.prepare('SELECT id,notification_status FROM business_inquiries WHERE user_sub=? AND request_id=?').bind(user.google_sub,body.requestId).first();if(duplicate)return json({ok:true,id:duplicate.id,notification:duplicate.notification_status});return json({error:'You’ve sent three plans today. Please try again tomorrow or reply to your existing conversation.'},429);}
 const sent=await notifyInquiry(env,id);return json({ok:true,id,notification:sent?'sent':'pending'},201);
}

export function businessInboxWelcome(target,notice='') {
 const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Business inquiries — Free Market Wildlife</title><link rel="stylesheet" href="/assets/css/styles.css"></head><body><main class="page-main"><a href="/">Free Market Wildlife</a><h1>Business inquiries</h1><p>Sign in with the owner’s Google account to open the private inbox.</p><p>${escape(notice)}</p><a class="button primary" href="${escape('/auth/start?returnTo='+encodeURIComponent(target))}">Continue with Google</a></main></body></html>`;
}
