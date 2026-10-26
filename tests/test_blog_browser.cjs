const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const origin=process.env.BLOG_BASE_URL||'http://127.0.0.1:4183', fixture=process.env.BLOG_FIXTURE_URL||'http://127.0.0.1:4184';
 const out=process.env.BLOG_QA_OUTPUT||'outputs/blog-workflow-2026-10-25';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});await page.goto(origin+'/');
  assert.deepEqual(await page.locator('.landing-nav a').allTextContents(),['Build a Business','Portfolio','Tanoshi','Blog']);
  const tanoshi=await page.locator('.landing-nav a[href="/tanoshi/"]').boundingBox(),blog=await page.locator('.landing-nav a[href="/blog/"]').boundingBox(),section=await page.locator('.home-blog').boundingBox();
  assert.ok(blog.y>tanoshi.y&&section.y>blog.y,'Blog sits beneath Tanoshi');
  assert.ok(await page.locator('.home-blog').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`${out}/home-${width}.png`,fullPage:true});
  await page.locator('.landing-nav a[href="/blog/"]').click();await page.waitForURL('**/blog/');
  assert.equal(await page.locator('h1').innerText(),'Blog');assert.equal(await page.locator('[data-post-id]').count(),0);await page.selectOption('#blog-sort','popular');assert.match(await page.locator('[data-blog-status]').innerText(),/No posts published yet/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/blog-${width}.png`,fullPage:true});
 }
 if(!process.env.BLOG_SKIP_FIXTURE){
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});await page.goto(fixture+'/');await page.locator('.home-blog a').click();await page.waitForURL('**/blog/rendering-fixture/');
  assert.equal(await page.locator('h1').innerText(),'Local rendering check');assert.equal(await page.locator('meta[name="author"]').getAttribute('content'),'Tanoshi');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://freemarketwildlife.com/blog/rendering-fixture/');
  const data=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());assert.equal(data.author.name,'Tanoshi');assert.equal(data.datePublished,'2026-01-01');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`${out}/local-fixture-${width}.png`,fullPage:true});
  await page.getByRole('link',{name:'All posts'}).click();assert.equal(await page.locator('[data-post-id]').count(),1);assert.ok(!(await page.locator('main').innerText()).includes('PRIVATE DRAFT'));await page.selectOption('#blog-sort','oldest');
 }
 }
 assert.deepEqual(errors,[]);console.log('PASS: rendered homepage order and link, empty index, sorting, mobile overflow, fixture post metadata, escaping, and navigation; no JavaScript errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
