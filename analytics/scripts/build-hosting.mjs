import {build} from 'esbuild';
import {rename,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await rename(root+'dist',root+'dist-client-staged');
await mkdir(root+'dist',{recursive:true});await rename(root+'dist-client-staged',root+'dist/client');
await build({absWorkingDir:root,entryPoints:['hosting/worker.ts'],outfile:root+'dist/server/index.js',bundle:true,platform:'browser',format:'esm',target:'es2022',plugins:[{name:'deno-npm-imports',setup(api){api.onResolve({filter:/^npm:/},args=>api.resolve(args.path.slice(4).replace(/@\d.*$/,''),{resolveDir:root,kind:args.kind}));}}]});
console.log('Protected dashboard Worker and frontend compiled.');
