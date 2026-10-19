// Serve the site on port 4173; run with Playwright available.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/portfolio/');await page.locator('.portfolio-card').nth(3).waitFor();
 assert.deepEqual(await page.locator('.portfolio-card h2').allTextContents(),['Critz','Equip','Tanoshi (Music)','Tanoshi (YouTube)']);
 assert.equal(await page.locator('a.portfolio-card').getAttribute('href'),'https://www.youtube.com/@TanoshiSan');
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
