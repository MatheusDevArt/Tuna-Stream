import {build} from '../analytics/node_modules/esbuild/lib/main.js';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({absWorkingDir:root,entryPoints:['.preview/collect-worker.ts'],outfile:root+'dist/server/index.js',bundle:true,platform:'browser',format:'esm',target:'es2022',plugins:[{name:'deno-npm',setup(api){api.onResolve({filter:/^npm:/},args=>api.resolve(args.path.slice(4).replace(/@\d.*$/,''),{resolveDir:root+'analytics',kind:args.kind}));}}]});
console.log('Public website with write-only collector compiled.');
