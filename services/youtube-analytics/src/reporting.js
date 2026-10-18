import {google} from './sync.js';
import {nowISO} from './core.js';
const root='https://youtubereporting.googleapis.com/v1/';
const wanted=/^channel_(basic|traffic_source|device_os|demographics|reach_basic)_a\d+$/;
// Streaming CSV parser preserves quoted commas, newlines and escaped quotes,
// including when a network chunk ends between the two quotes of an escape.
export async function* csvRows(stream){
 const reader=stream.getReader(),decoder=new TextDecoder();
 let field='',row=[],quoted=false,pendingQuote=false;
 try{
  while(true){const {value,done}=await reader.read();const text=done?decoder.decode():decoder.decode(value,{stream:true});
   for(const char of text){
    if(quoted){if(pendingQuote){if(char==='"'){field+='"';pendingQuote=false;continue;}quoted=false;pendingQuote=false;}else if(char==='"'){pendingQuote=true;continue;}else{field+=char;continue;}}
    if(char==='"'&&!field){quoted=true;}else if(char===','){row.push(field);field='';}else if(char==='\n'){row.push(field);yield row;row=[];field='';}else if(char!=='\r'){field+=char;}
    if(field.length>1000000)throw new Error('CSV field exceeds safe bound');
   }
   if(done)break;
  }
  if(quoted&&!pendingQuote)throw new Error('Truncated CSV');
  if(field||row.length){row.push(field);yield row;}
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export async function syncBulk(env,token){
 const check=await env.DB.prepare("SELECT value FROM cursors WHERE id='reporting-discovery'").first();
 if(!check||Date.now()-Number(check.value)>86400000){
  const payload=await google(root+'reportTypes',token);
  const types=payload.reportTypes?.filter(t=>wanted.test(t.id))||[];
  const latest=new Map();
  for(const type of types){const family=type.id.replace(/_a\d+$/,'');const existing=latest.get(family);if(!existing||Number(type.id.split('_a').at(-1))>Number(existing.id.split('_a').at(-1)))latest.set(family,type);}
  const existing=await google(root+'jobs',token);
  for(const type of latest.values()){
   const stored=await env.DB.prepare('SELECT * FROM reporting_jobs WHERE type_id=?').bind(type.id).first();if(stored)continue;
   let job=existing.jobs?.find(j=>j.reportTypeId===type.id);
   if(!job)job=await google(root+'jobs',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reportTypeId:type.id,name:'Free Market Wildlife read-only analytics'})});
   await env.DB.prepare('INSERT OR REPLACE INTO reporting_jobs(type_id,google_job_id) VALUES(?,?)').bind(type.id,job.id).run();
  }
  await env.DB.prepare("INSERT OR REPLACE INTO cursors VALUES('reporting-discovery',?)").bind(String(Date.now())).run();
 }
 const job=await env.DB.prepare('SELECT * FROM reporting_jobs ORDER BY COALESCE(last_checked_at,\'\') LIMIT 1').first();
 if(job){
  const cursorKey='bulk-list:'+job.type_id;
  const cursor=await env.DB.prepare('SELECT value FROM cursors WHERE id=?').bind(cursorKey).first();
  const params=new URLSearchParams({pageSize:'50'});if(cursor)params.set('pageToken',cursor.value);
  const reports=await google(root+'jobs/'+encodeURIComponent(job.google_job_id)+'/reports?'+params,token);
  const statements=(reports.reports||[]).map(r=>env.DB.prepare('INSERT OR IGNORE INTO bulk_reports(id,type_id,start_time,end_time,created_at,download_url) VALUES(?,?,?,?,?,?)').bind(r.id,job.type_id,r.startTime,r.endTime,r.createTime,r.downloadUrl));
  if(statements.length)await env.DB.batch(statements);
  if(reports.nextPageToken)await env.DB.prepare('INSERT OR REPLACE INTO cursors VALUES(?,?)').bind(cursorKey,reports.nextPageToken).run();
  else{await env.DB.prepare('DELETE FROM cursors WHERE id=?').bind(cursorKey).run();await env.DB.prepare('UPDATE reporting_jobs SET last_checked_at=? WHERE type_id=?').bind(nowISO(),job.type_id).run();}
 }
 const report=await env.DB.prepare("SELECT * FROM bulk_reports WHERE status IN ('pending','partial') ORDER BY created_at DESC LIMIT 1").first();if(!report)return;
 const url=new URL(report.download_url);
 if(url.protocol!=='https:'||!url.hostname.endsWith('.googleapis.com'))throw new Error('Invalid report download host');
 const response=await fetch(url,{headers:{Authorization:'Bearer '+token},redirect:'error'});
 if(!response.ok){if([403,404,410].includes(response.status))await env.DB.prepare("UPDATE bulk_reports SET status='expired_or_unavailable' WHERE id=?").bind(report.id).run();return;}
 let headers=null,index=0,pages=0,batch=[];
 async function save(){if(!batch.length)return;await env.DB.batch([
  env.DB.prepare('INSERT OR REPLACE INTO bulk_pages VALUES(?,?,?)').bind(report.id,Math.floor((index-batch.length)/250),JSON.stringify({columns:headers,rows:batch})),
  env.DB.prepare("UPDATE bulk_reports SET next_row=?,status='partial' WHERE id=?").bind(index,report.id)
 ]);batch=[];pages++;}
 for await(const row of csvRows(response.body)){
  if(!headers){headers=row;continue;}
  index++;if(index<=report.next_row)continue;
  if(row.length!==headers.length)throw new Error('Malformed bulk row');
  batch.push(row);if(batch.length===250){await save();if(pages>=10)return;}
 }
 await save();await env.DB.prepare("UPDATE bulk_reports SET status='complete',downloaded_at=? WHERE id=?").bind(nowISO(),report.id).run();
}
