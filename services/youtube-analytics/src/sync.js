import {syncBulk} from './reporting.js';
import {SCOPES,decrypt,encrypt,REPORTS,reportParams,yearWindows,coverageStatus,nowISO} from './core.js';
export class GoogleFailure extends Error {constructor(status){super('Google request failed');this.status=status;}}
export async function google(url,token,options={}) {
 const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers}});
 if(!response.ok) throw new GoogleFailure(response.status);
 return response.json();
}
export async function accessToken(env,connection) {
 const refresh=await decrypt(connection.encrypted_refresh_token,env.TOKEN_ENCRYPTION_KEY);
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:refresh})});
 if(!response.ok){if([400,401].includes(response.status))await env.DB.prepare("UPDATE connection SET status='reconnect_required' WHERE id=1").run();throw new GoogleFailure(response.status);}
 const payload=await response.json();
 if(payload.scope&&!SCOPES.every(s=>payload.scope.split(' ').includes(s))){await env.DB.prepare("UPDATE connection SET status='reconnect_required' WHERE id=1").run();throw new GoogleFailure(403);}
 const ownership=await google('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',payload.access_token);
 if(!ownership.items?.some(c=>c.id===env.EXPECTED_CHANNEL_ID)){await env.DB.prepare("UPDATE connection SET status='reconnect_required' WHERE id=1").run();throw new GoogleFailure(403);}
 await env.DB.prepare('UPDATE connection SET verified_at=? WHERE id=1').bind(nowISO()).run();
 return payload.access_token;
}
export async function syncInventory(env,token) {
 const channel=await google('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',token);
 const match=channel.items?.find(c=>c.id===env.EXPECTED_CHANNEL_ID);
 if(!match) throw new Error('Wrong channel');
 const uploads=match.contentDetails.relatedPlaylists.uploads;
 const state=await env.DB.prepare("SELECT value FROM cursors WHERE id='inventory'").first();
 const cursor=state?JSON.parse(state.value):{pageToken:'',cycle:nowISO()};
 const params=new URLSearchParams({part:'contentDetails',playlistId:uploads,maxResults:'50'});
 if(cursor.pageToken)params.set('pageToken',cursor.pageToken);
 const page=await google('https://www.googleapis.com/youtube/v3/playlistItems?'+params,token);
 const ids=page.items?.map(x=>x.contentDetails.videoId)||[];
 if(ids.length){
  const payload=await google('https://www.googleapis.com/youtube/v3/videos?'+new URLSearchParams({part:'snippet,contentDetails,status',id:ids.join(',')}),token);
  const statements=payload.items.filter(v=>v.snippet.channelId===env.EXPECTED_CHANNEL_ID).map(v=>env.DB.prepare('INSERT INTO videos(id,title,published_at,visibility,metadata,refreshed_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,visibility=excluded.visibility,metadata=excluded.metadata,refreshed_at=excluded.refreshed_at').bind(v.id,v.snippet.title,v.snippet.publishedAt,v.status.privacyStatus,JSON.stringify(v),nowISO()));
  if(statements.length)await env.DB.batch(statements);
 }
 if(page.nextPageToken){await env.DB.prepare("INSERT OR REPLACE INTO cursors VALUES('inventory',?)").bind(JSON.stringify({...cursor,pageToken:page.nextPageToken})).run();}
 else {
  // Revalidate each stored ID before retaining unavailable/private-video metadata.
  // An absent upload is not silently labelled deleted: mark for separate verification.
  await env.DB.prepare("UPDATE videos SET visibility='needs_recheck' WHERE refreshed_at<?").bind(cursor.cycle).run();
  await env.DB.prepare("DELETE FROM cursors WHERE id='inventory'").run();
 }
 return !page.nextPageToken;
}
export async function seedJobs(env,limit=25) {
 const candidates=await env.DB.prepare('SELECT * FROM videos WHERE id NOT IN (SELECT video_id FROM jobs) ORDER BY published_at DESC LIMIT ?').bind(limit).all();
 const end=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
 for(const video of candidates.results){
  const start=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}).format(new Date(video.published_at));const jobs=[];
  for(const days of [7,28,90]){const stop=new Date(Date.parse(start)+86400000*(days-1)).toISOString().slice(0,10);if(stop<=end)jobs.push(['activity',start,stop]);}
  for(const [from,to] of yearWindows(start,end))jobs.push(['activity',from,to]);
  for(const report of Object.keys(REPORTS).filter(r=>r!=='activity'))jobs.push([report,start,end]);
  const statements=jobs.map(([report,from,to])=>env.DB.prepare('INSERT OR IGNORE INTO jobs(id,video_id,report,start_date,end_date,updated_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),video.id,report,from,to,nowISO()));
  if(statements.length)await env.DB.batch(statements);
 }
}
export async function enqueueRecent(env) {
 // One resumable recurring sweep: every stored video gets a fresh 35-day window.
 // Job keys include the end date; never reset already-completed historical rows.
 const state=await env.DB.prepare("SELECT value FROM cursors WHERE id='recent'").first();
 let cursor=state?JSON.parse(state.value):{after:'',end:new Date(Date.now()-3*86400000).toISOString().slice(0,10)};
 const start=new Date(Date.parse(cursor.end)-34*86400000).toISOString().slice(0,10);
 const rows=await env.DB.prepare('SELECT id FROM videos WHERE id>? ORDER BY id LIMIT 25').bind(cursor.after).all();
 for(const video of rows.results){for(const report of Object.keys(REPORTS))await env.DB.prepare('INSERT OR IGNORE INTO jobs(id,video_id,report,start_date,end_date,updated_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),video.id,report,start,cursor.end,nowISO()).run();}
 if(rows.results.length){cursor.after=rows.results.at(-1).id;await env.DB.prepare("INSERT OR REPLACE INTO cursors VALUES('recent',?)").bind(JSON.stringify(cursor)).run();}
 else await env.DB.prepare("DELETE FROM cursors WHERE id='recent'").run();
}
export async function syncJob(env,token,job) {
 const payload=await google('https://youtubeanalytics.googleapis.com/v2/reports?'+reportParams(job,env.EXPECTED_CHANNEL_ID),token);
 const headers=payload.columnHeaders?.map(h=>h.name)||[];
 const rows=payload.rows||[];
 const statements=rows.map((values,index)=>env.DB.prepare('INSERT OR REPLACE INTO analytics_rows VALUES(?,?,?,?)').bind(job.id,String(job.next_index+index),JSON.stringify(Object.fromEntries(headers.map((name,i)=>[name,values[i]]))),nowISO()));
 const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM analytics_rows WHERE job_id=?').bind(job.id).first();
 statements.push(env.DB.prepare('UPDATE jobs SET next_index=?,status=?,attempts=0,last_error=NULL,updated_at=? WHERE id=?').bind(job.next_index+rows.length,rows.length===200?'pending':coverageStatus((count?.n||0)+rows.length),nowISO(),job.id));
 await env.DB.batch(statements);
}
export async function runSync(env) {
 const connection=await env.DB.prepare('SELECT * FROM connection WHERE id=1').first();
 if(!connection||connection.status!=='connected')return;
 // A DB lease prevents overlapping cron/manual work from doubling requests.
 const lease=await env.DB.prepare("UPDATE leases SET expires_at=? WHERE id='sync' AND expires_at<? RETURNING id").bind(Date.now()+12*60000,Date.now()).first();
 if(!lease)return;
 try {
  const token=await accessToken(env,connection);
  const inventory=await env.DB.prepare("SELECT value FROM cursors WHERE id='inventory'").first();
  const last=await env.DB.prepare("SELECT value FROM cursors WHERE id='inventory-complete'").first();
  if(inventory||!last||Date.now()-Number(last.value)>86400000){
   if(await syncInventory(env,token))await env.DB.prepare("INSERT OR REPLACE INTO cursors VALUES('inventory-complete',?)").bind(String(Date.now())).run();
  }
  await seedJobs(env);await enqueueRecent(env);
  try{await syncBulk(env,token);}catch{await env.DB.prepare("INSERT OR REPLACE INTO cursors VALUES('bulk-error',?)").bind(nowISO()).run();}
  // <=400 analytics rows/run; around 38,400 rows/day before bookkeeping.
  for(let i=0;i<2;i++){
   const job=await env.DB.prepare("SELECT * FROM jobs WHERE status IN ('pending','retry') AND retry_at<=? ORDER BY attempts, CASE WHEN start_date>=date('now','-40 days') THEN 0 ELSE 1 END, updated_at LIMIT 1").bind(Date.now()).first();
   if(!job)break;
   try{await syncJob(env,token,job);}catch(error){
    const code=error instanceof GoogleFailure?error.status:0;
    const terminal=[400,404].includes(code);
    await env.DB.prepare('UPDATE jobs SET status=?,attempts=attempts+1,retry_at=?,last_error=?,updated_at=? WHERE id=?').bind(terminal?'unavailable':'retry',Date.now()+Math.min(86400000,2**Math.min(job.attempts,10)*60000),'upstream_'+code,nowISO(),job.id).run();
    if([401,403,429].includes(code))break;
   }
  }
  // Refresh metadata no less often than monthly; clear old unavailable metadata.
  await env.DB.prepare("DELETE FROM videos WHERE refreshed_at<datetime('now','-27 days')").run();
  await env.DB.prepare('DELETE FROM oauth_states WHERE expires_at<?').bind(Date.now()).run();
  await env.DB.prepare('DELETE FROM invitations WHERE expires_at<?').bind(Date.now()).run();
 }finally{await env.DB.prepare("UPDATE leases SET expires_at=0 WHERE id='sync'").run();}
}
