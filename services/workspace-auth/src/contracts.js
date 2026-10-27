// Call only after the Worker's existing identity and workspace membership checks.
const ROUTE = /^\/(kat-kai|philip-aram)\/api\/contracts(?:\/([a-f0-9]{64}))?\/?$/;
const PRIVATE_HEADERS = {
  'Cache-Control':'private, no-store', 'Vary':'Cookie',
  'X-Content-Type-Options':'nosniff', 'X-Robots-Tag':'noindex, nofollow',
  'Referrer-Policy':'no-referrer', 'Cross-Origin-Resource-Policy':'same-origin'
};
const reply = (body, status=200, extra={}) => new Response(JSON.stringify(body), {
  status, headers:{...PRIVATE_HEADERS,'Content-Type':'application/json; charset=utf-8',...extra}
});
function validMetadata(value, id) {
  return value && value.sha256===id && typeof value.title==='string' && value.title.length>0 && value.title.length<=200
    && typeof value.filename==='string' && value.filename.length>0 && value.filename.length<=200
    && !/[\x00-\x1f\x7f/\\]/.test(value.filename)
    && Number.isSafeInteger(value.size) && value.size>0
    && typeof value.addedAt==='string' && Number.isFinite(Date.parse(value.addedAt));
}
async function metadata(bucket, prefix, id) {
  const object = await bucket.get(prefix+id+'.json');
  if(!object || object.size>4096)return null;
  try {const value=JSON.parse(await object.text());return validMetadata(value,id)?value:null;} catch {return null;}
}
export async function contracts(req, env, path) {
  const match=ROUTE.exec(path);
  if(!match)return reply({error:'Contract not found.'},404);
  if(!['GET','HEAD'].includes(req.method))return reply({error:'Method not allowed.'},405,{Allow:'GET, HEAD'});
  const bucket=env.TASK_PHOTOS;
  if(!bucket)return reply({error:'Contracts are temporarily unavailable.'},503);
  const [,workspace,id]=match, prefix=`workspace-contracts/${workspace}/`;
  if(id) {
    const meta=await metadata(bucket,prefix,id);
    if(!meta)return reply({error:'Contract not found.'},404);
    const object=await bucket[req.method==='HEAD'?'head':'get'](prefix+id+'.pdf');
    if(!object || object.size!==meta.size)return reply({error:'Contract not found.'},404);
    const disposition=new URL(req.url).searchParams.get('download')==='1'?'attachment':'inline';
    return new Response(req.method==='HEAD'?null:object.body,{headers:{
      ...PRIVATE_HEADERS, 'Content-Type':'application/pdf', 'Content-Length':String(object.size),
      'Content-Disposition':`${disposition}; filename*=UTF-8''${encodeURIComponent(meta.filename).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())}`,
      'Content-Security-Policy':"default-src 'none'; sandbox"
    }});
  }
  if(req.method==='HEAD')return new Response(null,{headers:{...PRIVATE_HEADERS,'Content-Type':'application/json; charset=utf-8'}});
  const cursor=new URL(req.url).searchParams.get('cursor');
  if(cursor && cursor.length>2048)return reply({error:'Invalid page.'},400);
  const result=await bucket.list({prefix,limit:100,cursor:cursor||undefined});
  const documents=[];
  for(const object of result.objects) {
    const found=/^([a-f0-9]{64})\.json$/.exec(object.key.slice(prefix.length));
    if(!found)continue;
    const item=await metadata(bucket,prefix,found[1]);
    if(item)documents.push({id:found[1],title:item.title,filename:item.filename,size:item.size,addedAt:item.addedAt,url:`/${workspace}/api/contracts/${found[1]}`});
  }
  documents.sort((a,b)=>b.addedAt.localeCompare(a.addedAt)||a.id.localeCompare(b.id));
  return reply({documents,cursor:result.truncated?result.cursor:null});
}
