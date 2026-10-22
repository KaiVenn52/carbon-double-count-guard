import fs from 'node:fs';
import solc from 'solc';
import ganache from 'ganache';
import {BrowserProvider,ContractFactory,id} from 'ethers';
import {serialIdentities,digest,batch} from './engine.mjs';
export function compile() {
 const source=fs.readFileSync(new URL('../contracts/ClaimGuard.sol',import.meta.url),'utf8');
 const output=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'ClaimGuard.sol':{content:source}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
 const errors=output.errors?.filter(e=>e.severity==='error');
 if(errors?.length) throw new Error(errors.map(e=>e.formattedMessage).join('\n'));
 return output.contracts['ClaimGuard.sol'].ClaimGuard;
}
export async function createChain(){
 const rpc=ganache.provider({logging:{quiet:true},chain:{chainId:1337,hardfork:'shanghai'},wallet:{totalAccounts:2}});
 const provider=new BrowserProvider(rpc); provider.pollingInterval=50;
 const signer=await provider.getSigner(); const artifact=compile();
 const contract=await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,signer).deploy(); await contract.waitForDeployment();
 const record=async (claim,evidenceDigest=digest({source:'synthetic',batch}))=>{const tx=await contract.record(serialIdentities(claim).map(id),digest(claim),evidenceDigest);const receipt=await tx.wait();return {transactionHash:receipt.hash,blockNumber:receipt.blockNumber,chainId:1337,contract:await contract.getAddress(),network:'Ephemeral in-process local EVM',claimDigest:digest(claim),evidenceDigest};};
 const seed=await record({...batch,start:1,end:40,beneficiary:'Demo Airline'});
 return {contract,provider,record,seed,close:()=>rpc.disconnect()};
}
