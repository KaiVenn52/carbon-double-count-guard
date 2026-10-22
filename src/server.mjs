import http from 'node:http';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {review,batch,history} from './engine.mjs';
import {createChain} from './chain.mjs';
const chain=await createChain();
const retirements=history.filter(e=>e.type==='RETIRE'); const receipts=[chain.seed];
let busy=false;
const server=http.createServer(async(req,res)=>{
 const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 try {
  if(req.headers.host!==`127.0.0.1:${server.address().port}`&&req.headers.host!==`localhost:${server.address().port}`) return json(403,{error:'Local host required'});
  if(req.method==='GET'&&req.url==='/api/state') return json(200,{batch,history,retirements,receipts});
  if(req.method==='POST'&&['/api/review','/api/record'].includes(req.url)){
   if(req.headers.origin&&!['http://127.0.0.1:'+server.address().port,'http://localhost:'+server.address().port].includes(req.headers.origin)) return json(403,{error:'Same origin required'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>16000) return json(413,{error:'Request too large'});}
   let claim;try{claim=JSON.parse(body);}catch{return json(400,{error:'Invalid JSON'});}
   const result=review(claim,retirements);
   if(req.url==='/api/review')return json(200,result);
   if(result.status==='BLOCKED')return json(409,result);
   if(busy)return json(409,{error:'A local record is in progress. Review again.'});
   busy=true;
   try{const receipt=await chain.record(claim,result.evidenceDigest);retirements.push({...claim,id:'LOCAL-'+receipt.blockNumber,type:'RETIRE'});receipts.push(receipt);return json(200,{...result,status:'LOCALLY_RECORDED',receipt});}finally{busy=false;}
  }
  const routes={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/favicon.svg':'favicon.svg'};
  if(req.method!=='GET'||!routes[req.url])return json(404,{error:'Not found'});
  const file=routes[req.url];const content=await fs.readFile(new URL('../public/'+file,import.meta.url));
  res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/javascript','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff'});res.end(content);
 }catch(error){console.error(error.message);json(500,{error:'Local service error. Retry or restart the demo.'});}
});
server.listen(Number(process.env.PORT||4387),'127.0.0.1',()=>console.log('Carbon Guard: http://127.0.0.1:'+server.address().port));
