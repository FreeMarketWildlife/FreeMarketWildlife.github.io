// Run against prepared Worker assets served on port 4173. Account API responses are fixtures.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const workspaces=[{id:'kat-kai',name:'Kat & Kai',path:'/kat-kai/'},{id:'philip-aram',name:'Philip Aram',path:'/philip-aram/'},{id:'troy-kearns',name:'Troy Kearns',path:'/troykearns/'}];
 await page.route('**/api/account',r=>r.fulfill({json:{user:{email:'client@gmail.com'},owner:true,workspaces,primaryWorkspace:workspaces[0]}}));
 for(const path of ['/philip-aram/','/kat-kai/','/troykearns/statistics/']) {
  await page.goto('http://127.0.0.1:4173'+path);await page.locator('.workspace-switcher summary').click();
  assert.equal(await page.locator('.workspace-switcher nav a').count(),3);
  assert.match(await page.locator('.workspace-switcher').evaluate(e=>getComputedStyle(e).fontFamily),/Arial/);
  assert.equal(await page.locator('.workspace-switcher a[aria-current=page]').count(),1);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.workspace-switcher').getAttribute('open'),null);
 }
 await page.goto('http://127.0.0.1:4173/philip-aram/');await page.locator('.workspace-switcher summary').click();
 await page.screenshot({path:process.cwd()+'/design/workspace-switcher-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.cwd()+'/design/workspace-switcher-mobile.png'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('.workspace-switcher nav a').first().click();await page.waitForURL('**/kat-kai/');
 await page.goto('http://127.0.0.1:4173/account/');await page.locator('body.account-page').waitFor();
 assert.match(await page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily),/Arial/);
 await page.locator('[data-open-access]').click();await page.waitForURL('**/kat-kai/');
 await page.goto('http://127.0.0.1:4173/?workspaces=1');await page.waitForURL('**/kat-kai/');
 await page.route('**/api/account',r=>r.fulfill({json:{user:null,owner:false,workspaces:[],primaryWorkspace:null}}));
 await page.goto('http://127.0.0.1:4173/?signin=1');
 const signup=page.locator('#access-dialog');await signup.waitFor({state:'visible'});
 assert.equal(await signup.locator('h2').textContent(),'Create your account');
 assert.equal(await signup.locator('.google-sign-in').getAttribute('href'),'/auth/start');
 assert.equal(await signup.locator('.signup-provider:disabled').count(),2);
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:844});
  assert.ok(await signup.evaluate(el=>el.scrollWidth<=el.clientWidth));
  await page.screenshot({path:process.cwd()+`/design/signup-${width===390?'mobile':'desktop'}.png`});
 }
 await page.keyboard.press('Escape');assert.equal(await signup.isVisible(),false);
 await page.locator('[data-open-access]').click();await signup.waitFor({state:'visible'});
 assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile switcher, plain typography, current/primary labels, keyboard dismissal, navigation, primary routing, responsive sign-up, unavailable providers, no JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
