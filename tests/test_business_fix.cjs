const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');
(async()=>{
 const repo=path.resolve(__dirname,'..'),publicRoot=path.join(repo,'services/workspace-auth/public'),out=process.env.BUSINESS_QA_OUTPUT||path.join(repo,'outputs/business-fix');await fs.mkdir(out,{recursive:true});
 const {recommend}=await import('../assets/js/business-model.js');const {bubbleLayout}=await import('../assets/js/business-scene.js');
 const browser=await chromium.launch({channel:'chrome',headless:true});const origin='https://fmw-business.test',KEY='fmw-business-adventure-v1';
 try{
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();const errors=[],serverSnapshots=[],geometry=[];
 page.on('pageerror',e=>errors.push(e.message));
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png'};
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.fulfill({contentType:'text/html',body:'<p>External scheduler fixture; no real booking.</p>'});
  if(url.pathname==='/api/account')return route.fulfill({json:{user:{email:'synthetic@example.invalid'},workspaces:[],primaryWorkspace:null,owner:false,providers:{email:true}}});
  if(url.pathname==='/api/business/config')return route.fulfill({json:{bookingUrl:'https://calendly.com/freemarketwildlife/30min'}});
  if(url.pathname==='/api/business/inquiries'){
   const body=req.postDataJSON(),matches=recommend(body.skills,body.interests);assert.ok(matches.some(b=>b.id===body.chosen));serverSnapshots.push({body,matches});
   return route.fulfill({status:201,json:{ok:true,id:'11111111-1111-4111-8111-111111111111',notification:'pending'}});
  }
  assert.equal(req.method(),'GET');let file=path.resolve(publicRoot,'.'+url.pathname);assert.ok(file.startsWith(publicRoot+path.sep));
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}catch{return route.fulfill({status:404,body:'Not found'});}
 });
 const seed=async(skills,interests,stage=2)=>{await page.evaluate(({KEY,skills,interests,stage})=>localStorage.setItem(KEY,JSON.stringify({version:1,savedAt:Date.now(),stage,skills,interests,chosen:'',name:'Preserved draft name',notes:'Preserved draft notes',consent:false,requestId:crypto.randomUUID(),receipt:null})),{KEY,skills,interests,stage});await page.reload();};
 const fits=async(width,height)=>{
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),`viewport ${width}x${height}`);
  const arena=await page.locator('.game-arena').boundingBox(),targets=await page.locator('.skill-target').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,font:parseFloat(getComputedStyle(n).fontSize),centerHit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n};}));
  const stage=await page.locator('.game-arena').getAttribute('class'),expected=bubbleLayout(arena.width,arena.height,stage.includes('interests')).count;assert.equal(targets.length,expected);
  for(const t of targets){assert.ok(t.w>=44&&t.h>=44&&t.font>=12);assert.ok(t.x>=arena.x-1&&t.y>=arena.y-1&&t.x+t.w<=arena.x+arena.width+1&&t.y+t.h<=arena.y+arena.height+1,JSON.stringify({width,height,t,arena}));assert.ok(t.centerHit,'Every bubble center can be activated');}
  for(const selector of ['.continue-button','.choice-tools','.selection-list']){const r=await page.locator(selector).boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,`${selector} fits ${width}x${height}`);}
  geometry.push({width,height,stage,targets:targets.length,font:targets[0].font});
 };
 for(const [width,height] of [[1440,900],[1366,768],[768,1024],[390,844],[320,568],[844,390]]){
  await page.setViewportSize({width,height});await page.goto(origin+'/build-a-business/');await page.evaluate(KEY=>localStorage.removeItem(KEY),KEY);await page.reload();await page.locator('.skill-target').first().waitFor();await page.evaluate(()=>document.fonts.ready);await fits(width,height);
  if(width>=1000)assert.equal(await page.locator('.skill-target').count(),15);if(width<=390)assert.equal(await page.locator('.skill-target').count(),6);
  const first=await page.locator('.skill-target').allTextContents();await page.getByRole('button',{name:'More bubbles',exact:true}).click();assert.notDeepEqual(await page.locator('.skill-target').allTextContents(),first);assert.equal(await page.locator('.selection-chip').count(),0);
  await page.getByRole('button',{name:/Search all skills/}).click();await page.getByRole('searchbox',{name:'Find a skill'}).fill('Video scripts');await page.getByRole('button',{name:'Video scripts',exact:true}).click();
  assert.equal(await page.locator('.selection-chip').count(),1);await page.getByRole('button',{name:'Close',exact:true}).click();assert.equal(await page.locator('.choice-tools button').first().evaluate(n=>n===document.activeElement),true);
  await page.screenshot({path:path.join(out,`skills-${width}-${height}.png`),fullPage:true});await page.getByRole('button',{name:'Continue to interests',exact:true}).click();await fits(width,height);
  await page.getByRole('button',{name:/Search all interests/}).click();await page.getByRole('searchbox',{name:'Find an interest'}).fill('Native plants');await page.getByRole('button',{name:'Native plants',exact:true}).click();await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.screenshot({path:path.join(out,`interests-${width}-${height}.png`),fullPage:true});await page.getByRole('button',{name:'Continue to business ideas',exact:true}).click();assert.ok(await page.locator('.business-card').count()>=1);assert.equal(await page.getByText('No strong matches yet.',{exact:false}).count(),0);
  await seed(['Systems'],['Dance']);assert.equal(await page.locator('.business-card').count(),1);await page.getByText('SKILL-FIRST STARTER',{exact:true}).waitFor();assert.match(await page.locator('.starter-fit').textContent(),/Dance.*not established/);assert.ok(!(await page.locator('.business-card').innerText()).includes('Your selected interests: Dance'));
  await page.screenshot({path:path.join(out,`starter-${width}-${height}.png`),fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});await seed(['Dog walking'],['Music']);await page.getByRole('heading',{name:'Pet handoff checklist review',exact:true}).waitFor();
 await page.getByRole('button',{name:'GET TO WORK',exact:true}).click();await page.getByRole('heading',{name:'Let’s test this starting point together.',exact:true}).waitFor();
 assert.equal(await page.getByLabel('Your name',{exact:true}).inputValue(),'Preserved draft name');assert.equal(await page.getByLabel('Anything else you wanna share with me?').inputValue(),'Preserved draft notes');
 await page.getByLabel('Your name',{exact:true}).fill('Synthetic browser tester');await page.reload();assert.equal(await page.getByLabel('Your name',{exact:true}).inputValue(),'Synthetic browser tester');await page.locator('input[type=checkbox]').check();await page.getByRole('button',{name:'Send my business plan →',exact:true}).click();await page.locator('.booking-frame').waitFor();
 assert.equal(serverSnapshots.length,1);assert.equal(serverSnapshots[0].matches[0].matchKind,'starter');assert.deepEqual(serverSnapshots[0].matches[0].interestMatches,[]);assert.deepEqual(serverSnapshots[0].matches[0].exploringInterests,['Music']);
 assert.match(await page.locator('.booking-frame').getAttribute('src'),/^https:\/\/calendly.com\/freemarketwildlife\/30min\?embed_domain=/);
 await seed(['unknown skill'],['Music']);assert.equal(await page.locator('.business-card').count(),0);await page.getByText('Choose at least one available skill and interest to get a starting idea.',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'result.json'),JSON.stringify({passed:true,geometry,serverFixtureSubmissions:serverSnapshots.length,realSubmissions:0,errors},null,2)+'\n');console.log('PASS: denser responsive bubbles, all-choice search/leaf selection, deterministic more choices, readable/tappable mobile/landscape, honest starter cards, preserved drafts, reload and server-derived fixture submission/booking embed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
