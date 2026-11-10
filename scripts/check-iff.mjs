import { spawnSync } from 'node:child_process';
for (const args of [['node_modules/@react-router/dev/bin.cjs','typegen'],['node_modules/typescript-7/bin/tsc','--noEmit']]) {
 const result=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,NODE_ENV:'development'}});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
