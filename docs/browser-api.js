import {BrowserProvider,ContractFactory,id} from './vendor/ethers.js';
import {review,batch,history,serialIdentities,digest} from './engine.js';

const ready=(async()=>{
 const rpc=Ganache.provider({logging:{quiet:true},chain:{chainId:1337,hardfork:'shanghai'},wallet:{totalAccounts:2}});
 const provider=new BrowserProvider(rpc);provider.pollingInterval=50;
 const artifact=await (await fetch('./ClaimGuard.json')).json();
 const contract=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,await provider.getSigner()).deploy();
 await contract.waitForDeployment();
 const record=async(claim,evidenceDigest)=>{
  const tx=await contract.record(serialIdentities(claim).map(id),digest(claim),evidenceDigest);
  const receipt=await tx.wait();
  return {transactionHash:receipt.hash,blockNumber:receipt.blockNumber,chainId:1337,contract:await contract.getAddress(),network:'Ephemeral browser-local EVM',claimDigest:digest(claim),evidenceDigest};
 };
 const seed=await record({...batch,start:1,end:40,beneficiary:'Demo Airline'},digest({source:'synthetic',batch}));
 return {record,retirements:structuredClone(history.filter(e=>e.type==='RETIRE')),receipts:[seed],busy:false};
})();

export async function api(path,claim){
 const ledger=await ready;
 if(path==='state')return structuredClone({batch,history,retirements:ledger.retirements,receipts:ledger.receipts});
 const result=review(claim,ledger.retirements);
 if(path==='review')return result;
 if(path!=='record')throw new Error('Unknown action');
 if(result.status==='BLOCKED')throw new Error(result.findings.map(f=>f.detail).join(' '));
 if(ledger.busy)throw new Error('A local record is in progress. Review again.');
 ledger.busy=true;
 try{
  const receipt=await ledger.record(claim,result.evidenceDigest);
  ledger.retirements.push({...claim,id:'LOCAL-'+receipt.blockNumber,type:'RETIRE'});
  ledger.receipts.push(receipt);
  return {...result,status:'LOCALLY_RECORDED',receipt};
 }finally{ledger.busy=false;}
}
