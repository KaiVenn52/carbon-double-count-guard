import test from 'node:test';
import assert from 'node:assert/strict';
import {id} from 'ethers';
import {createChain} from '../src/chain.mjs';
import {batch,digest,serialIdentities} from '../src/engine.mjs';
test('local Solidity contract enforces replay, authorization and atomic overlap rejection',async()=>{
 const c=await createChain();try{
 const fresh={...batch,start:61,end:80,beneficiary:'Demo Logistics'};
 const receipt=await c.record(fresh);assert.equal(receipt.chainId,1337);assert.match(receipt.transactionHash,/^0x[0-9a-f]{64}$/);
 await assert.rejects(c.record(fresh));
 const mined=await c.provider.getTransactionReceipt(receipt.transactionHash);
 const event=c.contract.interface.parseLog(mined.logs[0]);
 assert.equal(event.args.claimDigest,digest(fresh));
 assert.equal(event.args.evidenceDigest,receipt.evidenceDigest);
 const partiallyUsed={...fresh,start:55,end:65};
 // Supply gas explicitly so this overlap is broadcast and mined as a revert,
 // rather than rejected only by the preflight gas estimate.
 await assert.rejects(async()=>{const tx=await c.contract.record(serialIdentities(partiallyUsed).map(id),digest(partiallyUsed),digest('overlap-evidence'),{gasLimit:1000000});await tx.wait();});
 assert.equal(await c.contract.usedBy(id(serialIdentities({...fresh,start:55,end:55})[0])),'0x'+'0'.repeat(64));
 const outsider=await c.provider.getSigner(1);await assert.rejects(c.contract.connect(outsider).record([id('new')],digest('x'),digest('e')));
 await assert.rejects(c.contract.record([],digest('x'),digest('e')));
 await assert.rejects(c.contract.record([id('same'),id('same')],digest('x'),digest('e')));
 assert.equal(await c.contract.usedBy(id('same')),'0x'+'0'.repeat(64));
 }finally{await c.close();}
});
