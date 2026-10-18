export const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly','https://www.googleapis.com/auth/yt-analytics.readonly'];
export const REPORTS = {
  activity: {dimensions:'day',metrics:'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares'},
  traffic: {dimensions:'insightTrafficSourceType',metrics:'views,estimatedMinutesWatched'},
  countries: {dimensions:'country',metrics:'views,estimatedMinutesWatched'},
  devices: {dimensions:'deviceType',metrics:'views,estimatedMinutesWatched'},
  demographics: {dimensions:'ageGroup,gender',metrics:'viewerPercentage'},
  subscribed: {dimensions:'subscribedStatus',metrics:'views,estimatedMinutesWatched'},
  retention: {dimensions:'elapsedVideoTimeRatio',metrics:'audienceWatchRatio,relativeRetentionPerformance'}
};
export const nowISO = () => new Date().toISOString();
export function randomToken() {return crypto.randomUUID().replaceAll('-','') + crypto.randomUUID().replaceAll('-','');}
export function base64url(bytes) {return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export async function hash(text) {return base64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));}
async function keyFor(secret) {
  const bytes = Uint8Array.from(atob(secret),c=>c.charCodeAt(0));
  if(bytes.length!==32) throw new Error('Encryption configuration invalid');
  return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);
}
export async function encrypt(text,secret) {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('fmw-youtube-v1')},await keyFor(secret),new TextEncoder().encode(text));
 return JSON.stringify({iv:Array.from(iv),data:Array.from(new Uint8Array(ciphertext))});
}
export async function decrypt(text,secret) {
 const value=JSON.parse(text);
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(value.iv),additionalData:new TextEncoder().encode('fmw-youtube-v1')},await keyFor(secret),new Uint8Array(value.data));
 return new TextDecoder().decode(plain);
}
export function reportParams(job,channelId) {
 const report=REPORTS[job.report]; if(!report) throw new Error('Unsupported report');
 return new URLSearchParams({ids:`channel==${channelId}`,startDate:job.start_date,endDate:job.end_date,
  dimensions:report.dimensions,metrics:report.metrics,filters:`video==${job.video_id}`,maxResults:'200',startIndex:String(job.next_index)});
}
export function yearWindows(start,end) {
 if(!/^\d{4}-\d\d-\d\d$/.test(start)||!/^\d{4}-\d\d-\d\d$/.test(end)||start>end) return [];
 const windows=[]; let cursor=start;
 while(cursor<=end){const last=String(Number(cursor.slice(0,4)))+'-12-31'; const stop=last<end?last:end;windows.push([cursor,stop]);cursor=String(Number(cursor.slice(0,4))+1)+'-01-01';}
 return windows;
}
export function coverageStatus(rowCount) {return rowCount===0?'empty_or_suppressed':'complete';}
export function safeCsv(value) {const text=String(value??'');return '"'+(/^[=+@\-\t\r]/.test(text)?"'":'')+text.replaceAll('"','""')+'"';}
export function isDate(value){return /^\d{4}-\d\d-\d\d$/.test(value)&&!Number.isNaN(Date.parse(value));}

export function newestBulkVersions(reports){const latest=new Map();for(const report of reports){const key=[report.type_id,report.start_time,report.end_time].join('|');const previous=latest.get(key);if(!previous||report.created_at>previous.created_at)latest.set(key,report);}return [...latest.values()];}
