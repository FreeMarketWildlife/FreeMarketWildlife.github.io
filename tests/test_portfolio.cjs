// Serve the site on port 4173; run with Playwright available.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/portfolio/');await page.locator('.portfolio-card').nth(2).waitFor();
 assert.deepEqual(await page.locator('.portfolio-card h2').allTextContents(),['Tanoshi','Critz','EQUIP']);
 assert.deepEqual(await page.locator('a.portfolio-card').evaluateAll(es=>es.map(e=>e.getAttribute('href'))),['/tanoshi/','/portfolio/critz/','/portfolio/equip/']);
 assert.equal(await page.locator('.creator-row, blockquote').count(),0);
 assert.ok(!/Troy Kearns|Kat & Kai|Philip Aram/.test(await page.locator('main').innerText()));
 let boxes=await page.locator('.portfolio-card').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect(),h=e.firstElementChild.getBoundingClientRect(),t=e.lastElementChild.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,header:h.height,thumb:t.height};}));
 assert.equal(new Set(boxes.map(b=>b.y)).size,1);
 for(const b of boxes){assert.ok(Math.abs(b.thumb-(b.w-2))<2);assert.ok(Math.abs(b.header*2-b.thumb)<3);}
 await page.screenshot({path:'design/portfolio-grid-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'design/portfolio-grid-mobile.png',fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 boxes=await page.locator('.portfolio-card').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert.equal(new Set(boxes).size,2);
 assert.equal(await page.locator('[data-portfolio-more]').isVisible(),false);
 for(const [path,title] of [['/portfolio/critz/','Critz'],['/portfolio/equip/','EQUIP'],['/tanoshi/music/','Music'],['/tanoshi/youtube/','YouTube'],['/portfolio/critz/games/','Games'],['/portfolio/critz/stories/','Stories']]) {
  await page.goto('http://127.0.0.1:4173'+path);
  assert.equal(await page.locator('h1').innerText(),title);
 }
 await page.goto('http://127.0.0.1:4173/tanoshi/');assert.deepEqual(await page.locator('main .portfolio-card h2').allTextContents(),['YouTube','Music']);
 await page.goto('http://127.0.0.1:4173/portfolio/critz/');
 assert.deepEqual(await page.locator('main .portfolio-card h2').allTextContents(),['Games','Stories']);
 for(const [path,id] of [['/tanoshi/music/','6vHUuOIt6n6TjRfywPL6Tj'],['/portfolio/equip/','6CriqFwf0qX9bJhcNzCNZc']]) {
  await page.goto('http://127.0.0.1:4173'+path);
  assert.ok((await page.locator('iframe.spotify-player').getAttribute('src')).includes('/embed/artist/'+id));
  assert.ok(await page.locator('main a[href="https://open.spotify.com/artist/'+id+'"]').count());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 for(const path of ['/portfolio/critz/games/','/portfolio/critz/stories/']) {
  await page.goto('http://127.0.0.1:4173'+path);await page.locator('main').getByText('Coming Soon',{exact:true}).waitFor();
 }
 await page.goto('http://127.0.0.1:4173/portfolio/critz/dragex/');await page.waitForURL('**/portfolio/critz/stories/');
 // Public growth uses actual observations and preserves unavailable counts.
 const now=Date.now();
 await page.route('**/assets/data/tanoshi-youtube.json',r=>r.fulfill({json:{status:'ok',snapshots:[{observedAt:new Date(now).toISOString(),subscribers:120,views:null,videos:8},{observedAt:new Date(now-86400000).toISOString(),subscribers:100,views:800,videos:7}]}}));
 await page.goto('http://127.0.0.1:4173/tanoshi/youtube/');await page.locator('.portfolio-growth-table').waitFor();
 assert.match(await page.locator('.portfolio-growth-table').innerText(),/\+20/);
 assert.match(await page.locator('.portfolio-growth-table').innerText(),/Unavailable/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.route('**/assets/data/tanoshi-youtube.json',r=>r.fulfill({json:{status:'not_configured',snapshots:[]}}));
 await page.reload();await page.locator('[data-public-growth]').getByText('Coming Soon', {exact:true}).waitFor();
 // Fixture catalog validates five desktop rows and subsequent 20-item batches.
 await page.setViewportSize({width:1440,height:1000});
 await page.route('**/assets/data/portfolio.json',r=>r.fulfill({json:Array.from({length:45},(_,i)=>({title:`Work ${i+1}`,href:'https://example.com',thumbnail:'/assets/images/portfolio/critz.svg'}))}));
 await page.goto('http://127.0.0.1:4173/portfolio/');await page.locator('.portfolio-card').nth(19).waitFor();
 assert.equal(await page.locator('.portfolio-card').count(),20);
 await page.locator('[data-portfolio-more]').scrollIntoViewIfNeeded();await page.locator('.portfolio-card').nth(39).waitFor();
 assert.equal(await page.locator('.portfolio-card').count(),40);
 await page.locator('[data-portfolio-more]').scrollIntoViewIfNeeded();await page.locator('.portfolio-card').nth(44).waitFor();assert.equal(await page.locator('.portfolio-card').count(),45);
 assert.equal(await page.locator('[data-portfolio-more]').isVisible(),false);assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: portfolio content, square thumbnails, 2:3 cards, four/two columns, 20-item incremental loading, no client showcase or JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
