// Isolated, headless only. No existing browser profile, cookies or user workspace data.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),publicRoot=path.join(root,'services/workspace-auth/public');
 const output=process.env.HOME_QA_OUTPUT||path.join(root,'outputs/homepage');await fs.mkdir(output,{recursive:true});
 const {default:mainWorker}=await import('../services/workspace-auth/src/worker.js');
 const {default:gamesWorker}=await import('../services/games/worker.mjs');
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'};
 const assets={async fetch(request){
  const pathname=decodeURIComponent(new URL(request.url).pathname);
  const base=pathname.startsWith('/games/')?root:publicRoot;
  let filename=path.resolve(base,'.'+pathname);
  if(filename!==base && !filename.startsWith(base+path.sep))return new Response('Not found',{status:404});
  try{if((await fs.stat(filename)).isDirectory())filename=path.join(filename,'index.html');return new Response(await fs.readFile(filename),{headers:{'Content-Type':types[path.extname(filename)]||'application/octet-stream'}});}
  catch{return new Response('Not found',{status:404});}
 }};
 const origin='https://fmw.test';
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[],writes=[];page.on('pageerror',error=>errors.push(error.message));
  const kat={id:'kat-kai',name:'Kat & Kai',path:'/kat-kai/'},phil={id:'philip-aram',name:'Philip Aram',path:'/philip-aram/'},troy={id:'troy-kearns',name:'Troy Kearns',path:'/troykearns/strategy/'};
  let account={user:null,owner:false,workspaces:[],primaryWorkspace:null},failure=false,enabled=true;
  await page.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==origin)return route.abort();
   if(request.method()!=='GET'){writes.push(url.pathname);return route.abort();}
   if(url.pathname==='/assets/data/workspace-auth.json')return route.fulfill({json:{enabled}});
   if(url.pathname==='/api/account')return route.fulfill(failure?{status:503,json:{error:'Unavailable'}}:{json:account});
   if(['/kat-kai/','/philip-aram/','/troykearns/strategy/'].includes(url.pathname))return route.fulfill({contentType:'text/html',body:'<h1>Synthetic authorized destination</h1>'});
   const worker=/^\/(games(?:\/|$)|portfolio\/critz\/games(?:\/|$))/.test(url.pathname)?gamesWorker:mainWorker;
   const result=await worker.fetch(new Request('https://freemarketwildlife.com'+url.pathname+url.search),{SITE_ORIGIN:'https://freemarketwildlife.com',ASSETS:assets});
   const headers=Object.fromEntries(result.headers);if(headers.location)headers.location=headers.location.replace('https://freemarketwildlife.com',origin);
   return route.fulfill({status:result.status,headers,body:Buffer.from(await result.arrayBuffer())});
  });
  const first=page.locator('[data-home-destination]');
  const load=async()=>{await page.goto(origin+'/');await page.waitForFunction(()=>document.querySelector('[data-open-access]').getAttribute('aria-label')==='Sign in'||document.querySelector('[data-home-destination-label]').textContent==='My Workspace');};
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});await load();
   assert.deepEqual(await page.locator('.landing-nav a').allTextContents(),['Build a Business','Games','Blog']);
   assert.deepEqual(await page.locator('.landing-nav a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))),['/build-a-business/','/game/','/blog/']);
   assert.equal(await page.locator('.home-blog').count(),0);assert.equal(await page.locator('.landing-nav a[href="/portfolio/"],.landing-nav a[href="/tanoshi/"]').count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(node=>node===document.activeElement),true);
   await page.keyboard.press('Enter');await page.keyboard.press('Tab');assert.equal(await first.evaluate(node=>node===document.activeElement),true);
   await page.screenshot({path:path.join(output,`home-anonymous-${width}.png`),fullPage:true});
   await page.getByRole('link',{name:'Games',exact:true}).click();await page.waitForURL('**/game/');
   assert.equal(await page.locator('h1').innerText(),'Games');assert.equal(await page.locator('.game-card').count(),6);
   const links=await page.locator('.game-card').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
   assert.deepEqual(links,['treetop-trebuchet','tycoon','baad-math','tower-defense','critz-kingdom-conquest','ctrl-alt-del'].map(id=>'/games/'+id+'/'));
   assert.ok(await page.locator('.game-card img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0)));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(output,`games-${width}.png`),fullPage:true});
   await page.getByRole('link',{name:'Blog',exact:true}).click();await page.waitForURL('**/blog/');
   await page.locator('[data-post-id]').first().waitFor();await page.locator('[data-post-id] a').first().click();
   assert.equal(await page.locator('h1').innerText(),'How Free Market Wildlife Began');
  }
  for(const workspace of [kat,troy,phil]){
   account={user:{email:'synthetic@example.invalid'},owner:false,workspaces:[workspace],primaryWorkspace:workspace};await load();
   assert.equal((await first.textContent()).trim(),'My Workspace');assert.equal(await first.getAttribute('href'),workspace.path);
   if(workspace===kat)await page.screenshot({path:path.join(output,'home-signed-in-320.png'),fullPage:true});
   await first.click();await page.waitForURL(origin+workspace.path);
  }
  // Server-selected primary wins over the array order. No inference from Phil's identity.
  account={user:{email:'synthetic@example.invalid'},workspaces:[phil,kat,troy],primaryWorkspace:troy};await load();await first.click();await page.waitForURL(origin+troy.path);
  for(const [workspaces,primaryWorkspace] of [[[],null],[[kat],null],[[kat,troy],null],[[kat],phil],[[kat],{...kat,path:'/philip-aram/'}]]){
   account={user:{email:'synthetic@example.invalid'},owner:false,workspaces,primaryWorkspace};await load();
   assert.equal(await first.getAttribute('href'),'/?workspaces=1');await first.click();
   await page.locator('#access-dialog[open]').waitFor();assert.equal(new URL(page.url()).pathname,'/');
   assert.deepEqual(await page.locator('#access-dialog nav a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))),workspaces.map(workspace=>workspace.path));
   await page.keyboard.press('Escape');assert.equal(await first.evaluate(node=>node===document.activeElement),true);
  }
  // Deselect/revoke while the page is open, then expire the session.
  account={user:{email:'synthetic@example.invalid'},workspaces:[kat],primaryWorkspace:kat};await load();
  account={...account,workspaces:[],primaryWorkspace:null};await first.click();await page.locator('#access-dialog[open]').waitFor();assert.equal(new URL(page.url()).pathname,'/');
  account={user:{email:'synthetic@example.invalid'},workspaces:[kat],primaryWorkspace:kat};await load();account={user:null,workspaces:[],primaryWorkspace:null};await first.click();await page.waitForURL('**/build-a-business/');
  account={user:{email:'synthetic@example.invalid'},workspaces:[kat],primaryWorkspace:kat};await load();failure=true;await first.click();await page.getByRole('status').getByText('Unable to load your account. Please try again.').waitFor();assert.equal(new URL(page.url()).pathname,'/');failure=false;
  // Test the actual Worker redirects directly: Playwright's synthetic fulfillment
  // follows HTTP redirect chains outside its first route interception.
  for(const legacy of ['/games','/games/','/games/index.html','/portfolio/critz/','/portfolio/critz/games/']){
   const worker=legacy==='/portfolio/critz/'?mainWorker:gamesWorker;
   const result=await worker.fetch(new Request('https://freemarketwildlife.com'+legacy+'?view=all'),{SITE_ORIGIN:'https://freemarketwildlife.com',ASSETS:assets});
   assert.equal(result.status,308);assert.equal(new URL(result.headers.get('location'),origin).pathname,'/game/');assert.equal(new URL(result.headers.get('location'),origin).search,'?view=all');
  }
  await page.route('**/portfolio/critz/',async route=>route.fulfill({contentType:'text/html',body:await fs.readFile(path.join(publicRoot,'portfolio/critz/index.html'),'utf8')}));
  await page.goto(origin+'/portfolio/critz/');await page.waitForURL('**/game/');
  await page.unroute('**/portfolio/critz/');
  for(const direct of ['/portfolio/','/tanoshi/','/portfolio/critz/stories/','/portfolio/equip/']){const result=await page.goto(origin+direct);assert.equal(result.status(),200);assert.equal(new URL(page.url()).pathname,direct);}
  enabled=false;await page.goto(origin+'/');assert.equal((await first.textContent()).trim(),'Build a Business');assert.equal(await first.getAttribute('href'),'/build-a-business/');
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  await fs.writeFile(path.join(output,'result.json'),JSON.stringify({passed:true,widths:[1440,390,320],listedGames:6,accountCases:['anonymous','each primary','multiple with valid primary','missing primary','no memberships','mismatched primary','revoked while open','expired session','API failure','static Pages fallback'],writes,errors},null,2)+'\n');
  console.log('PASS: desktop/mobile homepage and hub, account-safe primary routing/fallbacks, current-session recheck, accessible keyboard navigation, legacy redirects, direct legacy pages and original blog; no writes or browser errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
