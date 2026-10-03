import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(new URL('../.qa/instagram-cloud/',import.meta.url),{recursive:true});
for(const name of ['tuna-instagram-sync','tuna-instagram-callback','tuna-collect'])await build({absWorkingDir:root,entryPoints:['supabase/functions/'+name+'/index.ts'],outfile:root+'/.qa/instagram-cloud/'+name+'.js',bundle:true,platform:'neutral',format:'esm',target:'es2022',external:['npm:*']});
console.log('Instagram server functions bundled. No frontend publication.');
