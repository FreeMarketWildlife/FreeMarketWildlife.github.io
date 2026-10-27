// Headless local QA only. All document/account data below is synthetic.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'../services/workspace-auth/public');
 const out=path.resolve(process.env.CONTRACTS_QA_OUTPUT||'outputs/workspace-contracts');await fs.mkdir(out,{recursive:true});
 let state='document',apiCalls=0;
 const id='a'.repeat(64),item={id,title:'Sample signed agreement',filename:'sample.pdf',size:320000,addedAt:'2026-10-27T12:00:00.000Z'};
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://local.invalid'),workspace=url.pathname.split('/')[1];
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(url.pathname==='/api/account'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({user:{email:'test@example.invalid'},owner:false,workspaces:[{id:'kat-kai',name:'Kat & Kai',path:'/kat-kai/'},{id:'philip-aram',name:'Philip Aram',path:'/philip-aram/'}],primaryWorkspace:{id:'kat-kai',path:'/kat-kai/'}}));return;}
  if(url.pathname===`/${workspace}/api/contracts`) {
   apiCalls++;res.setHeader('Content-Type','application/json');
   if(state==='error'){res.writeHead(403);res.end('{}');return;}
   const documents=state==='empty'?[]:[{...item,title:state==='unsafe'?'<img src=x onerror=alert(1)>':item.title,url:`/${workspace}/api/contracts/${id}`}];
   res.end(JSON.stringify({documents,cursor:null}));return;
  }
  try{
   let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep))throw Error();
   if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:'chrome'});const errors=[],results=[];
 try {
  for(const workspace of ['kat-kai','philip-aram'])for(const width of [1440,390,320]) {
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
   await page.goto(base+`/${workspace}/contracts/`);await page.getByRole('heading',{name:item.title,exact:true}).waitFor();
   assert.equal(await page.locator('.contract-card').count(),1);assert.equal(await page.locator(`nav[aria-label="${workspace==='kat-kai'?'Kat & Kai':'Philip Aram'} workspace"] a[aria-current="page"]`).textContent(),'Contracts');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const open=page.getByRole('link',{name:'Open Sample signed agreement PDF in a new tab'}),download=page.getByRole('link',{name:'Download Sample signed agreement PDF'});
   assert.equal(await open.getAttribute('href'),`/${workspace}/api/contracts/${id}`);assert.equal(await open.getAttribute('target'),'_blank');assert.equal(await download.getAttribute('href'),`/${workspace}/api/contracts/${id}?download=1`);
   for(const control of [open,download]){const box=await control.boundingBox();assert.ok(box.height>=44&&box.width>=44);}
   await open.focus();assert.equal(await open.evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await download.evaluate(el=>el===document.activeElement),true);
   const fonts=await page.locator('.contract-card').evaluate(el=>getComputedStyle(el).fontFamily);assert.match(fonts,/Arial/);
   if(workspace==='kat-kai')assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(251, 248, 241)');
   await page.screenshot({path:path.join(out,`${workspace}-${width}.png`),fullPage:true});
   await page.reload();await page.getByRole('heading',{name:item.title,exact:true}).waitFor();assert.equal(await page.locator('.contract-card').count(),1);
   results.push({workspace,width,overflow:false,minimumActionTarget:44});await page.close();
  }
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  state='empty';await page.goto(base+'/kat-kai/contracts/');await page.getByRole('status').filter({hasText:'No contracts have been added'}).waitFor();assert.equal(await page.locator('.contract-card').count(),0);
  state='error';await page.reload();await page.getByRole('status').filter({hasText:'workspace access'}).waitFor();assert.equal(await page.locator('.contract-card').count(),0);
  state='document';await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('heading',{name:item.title,exact:true}).waitFor();
  state='unsafe';await page.reload();await page.getByRole('heading',{name:'<img src=x onerror=alert(1)>',exact:true}).waitFor();assert.equal(await page.locator('.contract-card img').count(),0);
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'result.json'),JSON.stringify({passed:true,results,emptyErrorRetryAndEscapedMetadata:true,apiCalls,errors,syntheticOnly:true,foregroundControl:false},null,2)+'\n');
  console.log('PASS: both workspace designs; desktop/390/320 mobile; 44px actions; navigation; keyboard; reload; empty/error/retry; escaped metadata; no JS errors.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1)});
