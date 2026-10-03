import {writeFile} from 'node:fs/promises';
import {renderReportPng} from '../supabase/functions/_shared/report-raster.js';
import {getDemoSnapshot} from '../src/data.js';
import {demoLeads} from '../src/whatsapp.js';
import {summarizeSales} from '../src/sales.js';
const started=Date.now();
for(const type of ['website','instagram']){
 const sample=getDemoSnapshot('last-week'),sales=summarizeSales(demoLeads());sample.current={...sample.current,websiteReceivedContacts:sales.opportunities,closed:sales.won,uniqueClients:sales.clients,buyingClients:sales.buyers,sales};
 const bytes=await renderReportPng(sample,type);
 await writeFile(new URL('../design/relatorio-'+type+'-javascript.png',import.meta.url),bytes);
 console.log(JSON.stringify({type,bytes:bytes.length}));
}
console.log(JSON.stringify({elapsedMs:Date.now()-started}));
