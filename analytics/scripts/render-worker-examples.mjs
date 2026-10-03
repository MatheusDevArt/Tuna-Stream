import {writeFile} from 'node:fs/promises';
import {renderReportPng} from '../supabase/functions/_shared/report-raster.js';
import {getDemoSnapshot} from '../src/data.js';
const started=Date.now();
for(const type of ['website','instagram']){
 const bytes=await renderReportPng(getDemoSnapshot('last-week'),type);
 await writeFile(new URL('../design/relatorio-'+type+'-javascript.png',import.meta.url),bytes);
 console.log(JSON.stringify({type,bytes:bytes.length}));
}
console.log(JSON.stringify({elapsedMs:Date.now()-started}));
