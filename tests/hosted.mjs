import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {verifyExport} from '../src/verify-export.mjs';
const root=path.resolve('docs');
const server=http.createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/demo\//,'');
 const file=path.resolve(root,pathname||'index.html');
 if(!file.startsWith(root+path.sep))throw Error('Invalid path');
 const content=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'application/json');res.end(content);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[],requests=[];const url=`http://127.0.0.1:${server.address().port}/demo/`;
try{
 const page=await browser.newPage({viewport:{width:1280,height:960}});
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(url);await page.getByText('Browser-local EVM · Chain 1337',{exact:true}).waitFor({timeout:90000});
 await page.locator('#review').click();await page.getByText('This claim cannot proceed.',{exact:true}).waitFor();
 assert.match(await page.locator('#result').innerText(),/Serials 25–40/);assert.equal(await page.locator('#record').isDisabled(),true);
 await page.locator('#clean').click();await page.locator('#review').click();await page.getByText('No conflict in the loaded source.',{exact:true}).waitFor();
 await page.locator('#record').click();await page.getByText('Confirmed in ephemeral local EVM',{exact:true}).waitFor({timeout:30000});
 const downloaded=page.waitForEvent('download');await page.locator('#export').click();const download=await downloaded;
 await download.saveAs('evidence/hosted-review.json');
 const exported=JSON.parse(await fs.readFile('evidence/hosted-review.json','utf8'));
 assert.equal(verifyExport(exported).status,'INTERNALLY_CONSISTENT');
 assert.equal(exported.receipt.network,'Ephemeral browser-local EVM');
 await page.screenshot({path:'evidence/hosted-recorded.png',fullPage:true});
 await page.locator('#review').click();await page.getByText('This claim cannot proceed.',{exact:true}).waitFor();
 for(const width of [375,768]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.reload();await page.getByText('Browser-local EVM · Chain 1337',{exact:true}).waitFor({timeout:90000});assert.equal(await page.locator('#retired').innerText(),'40');
 assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith(url)),'No external network calls');
 await fs.writeFile('evidence/hosted-validation.json',JSON.stringify({status:'passed',testedAt:new Date().toISOString(),checks:['subdirectory hosting','blocked overlap 25-40','real browser-local Solidity transaction','offline-verifiable export','replay blocked','375/768/1280 layout','reload resets','no external requests','no runtime errors'],errors},null,2));
 console.log('Hosted browser EVM checks passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
