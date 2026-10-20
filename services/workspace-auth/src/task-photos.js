const TASKS = new Set(['kat-photos', 'kai-photos']);
const LIMIT = 20 * 1024 * 1024;
const reply = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {'Content-Type':'application/json', 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff'}});
function imageType(b) {
  if (b[0]===255 && b[1]===216 && b[2]===255) return 'image/jpeg';
  if (b.length>=8 && [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)) return 'image/png';
  if (new TextDecoder().decode(b.slice(0,4))==='RIFF' && new TextDecoder().decode(b.slice(8,12))==='WEBP') return 'image/webp';
  return null;
}
export async function taskPhotos(req, env, path) {
  const match = /^\/kat-kai\/api\/task-photos\/([^/]+)(?:\/([a-f0-9-]{36}))?$/.exec(path);
  if (!match || !TASKS.has(match[1])) return reply({error:'Photo task not found.'},404);
  if (!env.TASK_PHOTOS) return reply({error:'Photo uploads are not available yet. Storage setup is still needed.'},503);
  const [,task,id] = match;
  const prefix = `kat-kai/${task}/`;
  if (req.method==='GET' && id) {
    const photo = await env.TASK_PHOTOS.get(prefix+id);
    if (!photo) return reply({error:'Photo not found.'},404);
    const name = photo.customMetadata?.name || 'photo';
    return new Response(photo.body,{headers:{'Content-Type':photo.httpMetadata.contentType,'Content-Disposition':`inline; filename*=UTF-8''${name}`, 'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
  }
  if (req.method==='GET' && !id) {
    const url = new URL(req.url);
    const result = await env.TASK_PHOTOS.list({prefix,limit:100,include:['customMetadata'],cursor:url.searchParams.get('cursor') || undefined});
    return reply({photos:result.objects.map(o=>({id:o.key.slice(prefix.length),name:decodeURIComponent(o.customMetadata?.name || 'photo'),size:o.size,url:`/kat-kai/api/task-photos/${task}/${o.key.slice(prefix.length)}`})),cursor:result.truncated?result.cursor:null});
  }
  if (req.method!=='POST' || id) return reply({error:'Method not allowed.'},405);
  if (req.headers.get('origin')!==env.SITE_ORIGIN) return reply({error:'Forbidden.'},403);
  if (!['image/jpeg','image/png','image/webp'].includes(req.headers.get('content-type'))) return reply({error:'Please use JPG, PNG, or WebP photos.'},415);
  if (Number(req.headers.get('content-length'))>LIMIT) return reply({error:'Each photo must be 20 MB or smaller.'},413);
  const reader=req.body?.getReader();
  if(!reader) return reply({error:'Choose a photo to upload.'},400);
  let size=0; const chunks=[];
  while(true) {
    const {done,value}=await reader.read(); if(done)break;
    size+=value.byteLength;
    if(size>LIMIT){await reader.cancel();return reply({error:'Each photo must be 20 MB or smaller.'},413);}
    chunks.push(value);
  }
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const type=imageType(bytes);
  if(!type || type!==req.headers.get('content-type')) return reply({error:'This file is not a supported photo. Please use JPG, PNG, or WebP.'},415);
  const rawName=new URL(req.url).searchParams.get('name') || 'photo';
  const name=rawName.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,180);
  const photoId=crypto.randomUUID();
  await env.TASK_PHOTOS.put(prefix+photoId,bytes,{httpMetadata:{contentType:type},customMetadata:{name:encodeURIComponent(name)}});
  return reply({id:photoId,name,size,url:`/kat-kai/api/task-photos/${task}/${photoId}`},201);
}
