const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const out='outputs/business-viewport-2026-10-25';fs.mkdirSync(out,{recursive:true});
try{for(const [width,height] of [[1440,900],[390,844],[320,568]]){
 const page=await browser.newPage({viewport:{width,height},isMobile:width<681,hasTouch:width<681,reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({json:{user:null,workspaces:[],providers:{email:true}}}));
 await page.goto((process.env.BUSINESS_BASE_URL||'http://127.0.0.1:4173')+'/build-a-business/');await page.locator('.skill-target').first().waitFor();
 const fits=async()=>{assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth));for(const sel of ['.continue-button','.selection-list','.business-title']){const r=await page.locator(sel).boundingBox();assert.ok(r.y>=0&&r.y+r.height<=height&&r.x>=0&&r.x+r.width<=width,`${sel} fits ${width}`);}};
 await fits();assert.equal(await page.locator('.custom-selection,.target-depth,.business-help').count(),0);assert.equal(await page.locator('.skill-target').count(),width<681?6:15);
 await page.locator('.skill-target').first().click();const before=await page.locator('.continue-button').boundingBox();
 for(let i=1;i<9;i++)await page.locator('.skill-target').first().click();await fits();const after=await page.locator('.continue-button').boundingBox();assert.ok(after.width>before.width&&after.height>before.height);
 await page.screenshot({path:`${out}/skills-${width}.png`,fullPage:true});await page.locator('.skill-target').first().click();await page.getByText('VICTORY',{exact:true}).waitFor();assert.equal(await page.locator('.selection-chip').count(),10);
 await page.getByRole('heading',{name:'What do you ENJOY doing?',exact:true}).waitFor();await fits();assert.equal(await page.locator('.game-victory').count(),0);
 for(let i=0;i<9;i++)await page.locator('.skill-target').first().click();await fits();await page.screenshot({path:`${out}/asteroids-${width}.png`,fullPage:true});await page.locator('.skill-target').first().click();await page.getByText('VICTORY',{exact:true}).waitFor();await page.locator('.business-cards').waitFor();
 assert.equal(await page.getByRole('button',{name:'GET TO WORK',exact:true}).count(),3);const cards=await page.locator('.business-card').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y};}));assert.ok(width>680?cards.every(c=>c.y===cards[0].y):cards.every(c=>c.x===cards[0].x));await page.screenshot({path:`${out}/options-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'GET TO WORK',exact:true}).first().click();await page.getByLabel('Your name',{exact:true}).waitFor();
 // Early Continue goes straight to the next page with no victory.
 await page.evaluate(()=>{localStorage.clear();});await page.reload();await page.locator('.skill-target').first().click();await page.locator('.continue-button').click();assert.equal(await page.locator('.game-victory').count(),0);await page.getByRole('heading',{name:'What do you ENJOY doing?',exact:true}).waitFor();
 assert.deepEqual(errors,[]);await page.close();
}console.log('PASS: desktop, mobile and small mobile fit one viewport; expanded target count; accessible scrolling selections; growing Continue; both 10-item victories auto advance; early Continue skips victory; three responsive cards and GET TO WORK.');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
