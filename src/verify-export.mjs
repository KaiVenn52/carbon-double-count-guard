import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {digest,review,batch,history} from './engine.mjs';

// Checks internal consistency against this demo's rules. No authenticity or chain lookup.
export function verifyExport(value){
 const errors=[];
 if(!value||value.schemaVersion!==1||!value.sourceSnapshot)return {status:'UNVERIFIABLE',errors:['Version 1 export with a source snapshot required.'],boundary:'No registry or chain authenticity is verified.'};
 const source=value.sourceSnapshot;
 if(!value.claim||typeof value.claim!=='object'||!source.batch||!source.history||!Array.isArray(source.retirements)||!source.retirements.every(r=>r&&Number.isSafeInteger(r.start)&&Number.isSafeInteger(r.end)&&r.start>=1&&r.end>=r.start&&typeof r.id==='string'&&typeof r.beneficiary==='string'))return {status:'INCONSISTENT',errors:['Malformed claim or source snapshot.'],boundary:'No registry or chain authenticity is verified.'};
 if(digest(source)!==value.evidenceDigest)errors.push('Evidence digest mismatch.');
 if(digest(value.claim)!==value.claimDigest)errors.push('Claim digest mismatch.');
 if(digest(source.batch)!==digest(batch)||digest(source.history)!==digest(history)||!Array.isArray(source.retirements))errors.push('Unsupported source identity or fixture history.');
 if(!errors.length){
  const replay=review(value.claim,source.retirements);
  const expected=value.status==='LOCALLY_RECORDED'?'READY_FOR_LOCAL_RECORD':value.status;
  if(replay.status!==expected||digest(replay.findings)!==digest(value.findings)||digest(replay.overlaps)!==digest(value.overlaps))errors.push('Decision does not match the embedded snapshot.');
 }
 if(value.status==='LOCALLY_RECORDED'){
  const r=value.receipt;
  if(!r||r.claimDigest!==value.claimDigest||r.evidenceDigest!==value.evidenceDigest||r.chainId!==1337||!Number.isSafeInteger(r.blockNumber)||r.blockNumber<1||!/^0x[0-9a-f]{64}$/i.test(r.transactionHash)||!/^0x[0-9a-f]{40}$/i.test(r.contract))errors.push('Local receipt fields are inconsistent.');
 }
 return {status:errors.length?'INCONSISTENT':'INTERNALLY_CONSISTENT',errors,boundary:'Self-contained consistency check only. Forged but self-consistent data can pass; no registry signature, source truth, or chain receipt authenticity is verified.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{if(!process.argv[2])throw new Error('Usage: node src/verify-export.mjs <review.json>');const result=verifyExport(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));console.log(JSON.stringify(result,null,2));if(result.status!=='INTERNALLY_CONSISTENT')process.exitCode=1;}catch(error){console.error(error.message);process.exitCode=1;}
}
