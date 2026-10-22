import fs from 'node:fs/promises';
import {compile} from './chain.mjs';
await fs.mkdir('dist',{recursive:true});
await fs.cp('public','dist/public',{recursive:true});
await fs.writeFile('dist/ClaimGuard.json',JSON.stringify(compile(),null,2));
console.log('Built static assets and compiled Solidity artifact. Run npm start for the API and local EVM.');
