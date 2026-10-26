// Run against a Worker with email enabled. Optional WELCOME_ORIGIN selects production.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({ignoreHTTPSErrors:true});
 const origin=process.env.WELCOME_ORIGIN||'http://127.0.0.1:4173';
 if(!process.env.WELCOME_ORIGIN) {
  const {workspaceWelcome}=await import('../services/workspace-auth/src/workspace-welcome.js');
  const {WORKSPACES,protectedWorkspace}=await import('../services/workspace-auth/src/worker.js');
  await page.route(origin+'/**',async route=>{
   const url=new URL(route.request().url()),id=protectedWorkspace(url.pathname);
   if(id)return route.fulfill({contentType:'text/html',body:workspaceWelcome(WORKSPACES.find(w=>w.id===id),url.pathname+url.search,true)});
   return route.continue();
  });
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('outputs/workspace-welcome',{recursive:true});
 for(const [path,name] of [['/troykearns/','Troy Kearns'],['/kat-kai/','Kat & Kai'],['/philip-aram/','Philip Aram']]) {
  for(const width of [1440,390]) {
   await page.setViewportSize({width,height:900});
   const response=await page.goto(origin+path);assert.equal(response.status(),200);
   await page.getByRole('heading',{name:`Welcome to the ${name} Free Market Wildlife Workspace`,exact:true}).waitFor();
   assert.equal(await page.locator('#workspace-content').count(),0);
   assert.equal(await page.locator('dialog').count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.ok(await page.locator('.welcome-logo').evaluate(el=>el.complete&&el.naturalWidth>0));
   const google=new URL(await page.getByRole('link',{name:'Continue with Google'}).getAttribute('href'),origin);
   assert.equal(google.pathname,'/auth/start');assert.equal(google.searchParams.get('returnTo'),path);
   await page.screenshot({path:`outputs/workspace-welcome/${path.split('/')[1]}-${width}.png`,fullPage:true});
  }
 }
 await page.goto(origin+'/troykearns/links/');
 await page.route('**/auth/email/start?*',r=>r.fulfill({json:{ok:true}}));
 await page.route('**/auth/email/verify?*',r=>r.fulfill({status:400,json:{error:'Invalid or expired code. Please try again or request a new code.'}}));
 await page.getByLabel('Email address',{exact:true}).fill('client@example.com');
 await page.getByRole('button',{name:'Continue with email',exact:true}).click();
 await page.getByLabel('8-digit code',{exact:true}).waitFor();
 await page.getByLabel('8-digit code',{exact:true}).fill('12345678');
 await page.getByRole('button',{name:'Verify and continue',exact:true}).click();
 await page.getByRole('status').filter({hasText:'Invalid or expired code'}).waitFor();
 await page.getByRole('button',{name:'Use a different email or request a new code'}).click();
 await page.getByLabel('Email address',{exact:true}).waitFor();
 await page.goto(origin+'/');await page.getByRole('heading',{name:'Free Market Wildlife',exact:true}).waitFor();
 await page.getByRole('link',{name:'Build a Business',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: original homepage; branded welcome and inline sign-in for all workspaces on desktop/mobile; Google return links; email code/error/retry controls; no private content or JS errors');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
