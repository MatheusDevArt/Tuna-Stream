import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const names=['tuna-login','tuna-collect','tuna-team','tuna-report','tuna-sync','tuna-webhook','tuna-account','tuna-instagram'];
await build({absWorkingDir:root,entryPoints:{...Object.fromEntries(names.map(name=>[name,'supabase/functions/'+name+'/index.ts'])),'initialize':'server/initialize.ts'},outdir:root+'/server/.generated',bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',plugins:[{name:'deno-npm-imports',setup(api){api.onResolve({filter:/^npm:/},args=>({path:args.path.slice(4).replace(/@\d.*$/,''),external:true}));}}]});
console.log('Eight server endpoints built locally.');
