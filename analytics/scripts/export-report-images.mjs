import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderReportPng} from '../supabase/functions/_shared/report-raster.js';
import {normalizeMetrics} from '../src/metrics.js';
const [input,output='.qa/email-reports']=process.argv.slice(2);
if(!input)throw new Error('Provide an authorized snapshot JSON file.');
const raw=JSON.parse(await readFile(input,'utf8'));
const snapshot={...raw,demo:false,current:normalizeMetrics(raw.current),previous:normalizeMetrics(raw.previous)};
await mkdir(output,{recursive:true});
for(const type of ['website','instagram']){
 const path=resolve(output,`tunastream-${type}-${snapshot.period.start}.png`);
 await writeFile(path,await renderReportPng(snapshot,type));console.log(path);
}
