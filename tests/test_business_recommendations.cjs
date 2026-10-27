const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
const base=process.env.BUSINESS_BASE_URL||'http://127.0.0.1:4173';const out=process.env.BUSINESS_QA_OUTPUT||'outputs/business-catalog';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const errors=[];
 for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<681,hasTouch:width<681,reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',r=>r.fulfill({json:{user:null,providers:{email:true}}}));
  await page.addInitScript(()=>localStorage.setItem('fmw-business-adventure-v1',JSON.stringify({version:1,savedAt:Date.now(),stage:2,skills:['Writing'],interests:['Gardens'],chosen:'',requestId:crypto.randomUUID()})));
  await page.goto(base+'/build-a-business/');await page.locator('.business-card').first().waitFor();
  assert.equal(await page.locator('.business-card').count(),3);assert.equal(await page.locator('details,summary').count(),0);
  for(const card of await page.locator('.business-card').all()){
   assert.ok(await card.getByRole('heading',{name:'WHY YOU',exact:true}).isVisible());assert.ok(await card.getByRole('heading',{name:'START SMALL',exact:true}).isVisible());
   assert.equal(await card.locator('dt').allTextContents().then(xs=>xs.join('/')),'Startup/Learning/Growth');
   assert.match(await card.innerText(),/Writing/);assert.match(await card.innerText(),/Gardens/);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no overflow ${width}`);
  const positions=await page.locator('.business-card').evaluateAll(ns=>ns.map(n=>({x:n.offsetLeft,y:n.offsetTop})));
  assert.ok(width>680?positions.every(p=>p.y===positions[0].y):positions.every(p=>p.x===positions[0].x));
  await page.screenshot({path:`${out}/cards-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'GET TO WORK',exact:true}).first().focus();assert.equal(await page.locator(':focus').textContent(),'GET TO WORK');await page.keyboard.press('Enter');await page.getByLabel('Your name',{exact:true}).waitFor();
  await context.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.fulfill({json:{user:null}}));
 await page.goto(base+'/build-a-business/');
 const seed=async(stage,skills,interests)=>{await page.evaluate(({stage,skills,interests})=>localStorage.setItem('fmw-business-adventure-v1',JSON.stringify({version:1,savedAt:Date.now(),stage,skills,interests,chosen:'practical-dog-walk',requestId:crypto.randomUUID()})),{stage,skills,interests});await page.reload();};
 await seed(2,['Dog walking'],['Dogs','Walking']);await page.getByText('Individual dog walks',{exact:true}).waitFor();assert.ok(await page.locator('.business-card').count()<3);assert.match(await page.locator('.business-help').textContent(),/direct match/);await page.screenshot({path:out+'/sparse-match.png',fullPage:true});
 await page.getByRole('button',{name:'← Back',exact:true}).click();await page.getByRole('button',{name:'Remove Walking',exact:true}).click();await page.getByRole('button',{name:'Continue to business ideas',exact:true}).click();assert.equal(await page.getByText('Individual dog walks',{exact:true}).count(),0,'deselection removes stale match');
 await seed(2,['Dog walking'],['Outdoors']);await page.getByText('SKILL-FIRST STARTER',{exact:true}).waitFor();assert.equal(await page.locator('.business-card').count(),1);assert.ok(await page.getByRole('button',{name:'Explore more choices',exact:true}).isVisible());assert.match(await page.locator('.starter-fit').textContent(),/Outdoors.*not established/);assert.equal(await page.getByText('Individual dog walks',{exact:true}).count(),0);await page.screenshot({path:out+'/skill-first-starter.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: complete cards at 1440/768/390/320, keyboard action, evidence labels, sparse results, honest skill-first fallback, walking deselection removes stale match, no overflow/errors.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
