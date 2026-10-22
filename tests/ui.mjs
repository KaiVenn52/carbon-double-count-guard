// Browser plugin not available in this session. Standard Playwright validates localhost only.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {verifyExport} from '../src/verify-export.mjs';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:960}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.APP_URL||'http://127.0.0.1:4387');await page.getByText('Local EVM · Chain 1337',{exact:true}).waitFor();
 assert.match(await page.title(),/Carbon Guard/);
 await page.getByRole('button',{name:'Review serial range'}).click();await page.getByText('This claim cannot proceed.',{exact:true}).waitFor();assert.equal(await page.locator('#record').isDisabled(),true);
 assert.match(await page.locator('#result').innerText(),/Serials 25–40/);
 await page.screenshot({path:'evidence/desktop-blocked.png',fullPage:true});
 await page.getByRole('button',{name:'Load unused range'}).click();await page.getByRole('button',{name:'Review serial range'}).click();await page.getByText('No conflict in the loaded source.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Record in local EVM',exact:true}).click();await page.getByText('Confirmed in ephemeral local EVM',{exact:true}).waitFor();
 await page.screenshot({path:'evidence/desktop-recorded.png',fullPage:true});
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export review JSON'}).click();const download=await downloadPromise;await download.saveAs('evidence/sample-local-review.json');
 const exported=JSON.parse(await fs.readFile('evidence/sample-local-review.json','utf8'));assert.equal(exported.status,'LOCALLY_RECORDED');assert.equal(exported.evidenceDigest,exported.receipt.evidenceDigest);
 assert.equal(verifyExport(exported).status,'INTERNALLY_CONSISTENT');
 await page.getByRole('button',{name:'Review serial range'}).click();await page.getByText('This claim cannot proceed.',{exact:true}).waitFor();
 for(const width of [375,768]){await page.setViewportSize({width,height:900});await page.screenshot({path:`evidence/responsive-${width}.png`,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow at '+width);}
 await page.locator('#start').fill('0');await page.getByRole('button',{name:'Review serial range'}).click();await page.getByText('INVALID_RANGE',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 await fs.writeFile('evidence/ui-results.json',JSON.stringify({status:'passed',viewports:[1280,768,375],checks:['identity','nonblank','no runtime overlay','console clean','overlap blocked','local EVM receipt','replay blocked','invalid range','no horizontal overflow'],errors},null,2));
 console.log('UI checks passed: overlap, local EVM record, replay, invalid input, responsive widths; zero console errors.');
}finally{await browser.close();}
