import {sha256,toUtf8Bytes} from './vendor/ethers.js';
export const digest = value => sha256(toUtf8Bytes(JSON.stringify(value)));
export const batch = { registry: 'SYNTHETIC-DEMO', project: 'FOREST-017', vintage: '2025', start: 1, end: 100 };
export const history = [
 {id:'ISSUE-001',type:'ISSUE',start:1,end:100,owner:'Demo project',date:'2026-10-01',evidence:'fixture:issuance-001'},
 {id:'TRANSFER-001',type:'TRANSFER',start:1,end:100,owner:'Demo buyer',date:'2026-10-03',evidence:'fixture:transfer-001'},
 {id:'RETIRE-001',type:'RETIRE',start:1,end:40,owner:'Demo buyer',beneficiary:'Demo Airline',date:'2026-10-10',evidence:'fixture:retirement-001'}
];
export function review(claim, retirements = history.filter(e=>e.type==='RETIRE')) {
 const findings=[];
 const fail=(code,detail)=>findings.push({code,detail});
 if (!claim || typeof claim!=='object') return {status:'BLOCKED',findings:[{code:'INVALID_INPUT',detail:'Expected a claim object.'}],overlaps:[]};
 const validRange=Number.isSafeInteger(claim.start)&&Number.isSafeInteger(claim.end)&&claim.start>=1&&claim.end>=claim.start&&claim.end-claim.start<200;
 if (!validRange) fail('INVALID_RANGE','Use an ascending integer range of at most 200 serials.');
 if (claim.registry!==batch.registry||claim.project!==batch.project||claim.vintage!==batch.vintage) fail('UNKNOWN_IDENTITY','Registry, project and vintage must match the loaded source. No cross-registry inference is made.');
 if (validRange&&(claim.start<batch.start||claim.end>batch.end)) fail('OUTSIDE_ISSUANCE','Serials are outside the observed issuance range.');
 if (claim.owner!=='Demo buyer') fail('OWNER_MISMATCH','The claimant does not match the observed transfer recipient.');
 if (typeof claim.beneficiary!=='string'||!claim.beneficiary.trim()||claim.beneficiary.length>120) fail('MISSING_BENEFICIARY','Name a beneficiary of at most 120 characters.');
 if (claim.evidence!=='fixture:claim-001') fail('UNVERIFIED_EVIDENCE','Only the supplied synthetic evidence reference is loaded. A URL or hash alone is not verification.');
 const overlaps=validRange&&claim.registry===batch.registry&&claim.project===batch.project&&claim.vintage===batch.vintage?retirements.filter(r=>claim.start<=r.end&&claim.end>=r.start).map(r=>({event:r.id,start:Math.max(claim.start,r.start),end:Math.min(claim.end,r.end),beneficiary:r.beneficiary})):[];
 if (overlaps.length) fail('ALREADY_RETIRED','At least one requested serial has already been retired. The entire claim is blocked.');
 const sourceSnapshot=structuredClone({batch,history,retirements});
 return {schemaVersion:1,status:findings.length?'BLOCKED':'READY_FOR_LOCAL_RECORD',findings,overlaps,claim:structuredClone(claim),claimDigest:digest(claim),sourceSnapshot,evidenceDigest:digest(sourceSnapshot),scope:'Synthetic loaded dataset only; no certification or emissions claim.'};
}
export function serialIdentities(claim) { return Array.from({length:claim.end-claim.start+1},(_,i)=>`${claim.registry}|${claim.project}|${claim.vintage}|${claim.start+i}`); }
