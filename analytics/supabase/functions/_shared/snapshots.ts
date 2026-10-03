import {admin,check,team} from './server.ts';
import {aggregate,bounds,windows,addDays} from './aggregation.js';
import {geoMetrics} from './ga4.ts';
async function all(query:any){let rows:any[]=[];for(let offset=0;offset<100000;offset+=750){const page=check<any[]>(await query.range(offset,offset+749));rows.push(...page);if(page.length<750)return rows;}throw new Error('data_window_exceeded');}
export async function publishSnapshots(){
 const db=admin(),tenant=team(),integrations=check(await db.from('analytics_integrations').select('source,status,mode,last_success_at,first_success_at').eq('team_id',tenant))||[];
 async function metrics(period:any){
  const window=bounds(period);
  const range=(table:string,field:string)=>db.from(table).select('*').eq('team_id',tenant).gte(field,window.start).lt(field,window.end).order(field).order(table==='whatsapp_receipts'?'message_hash':'id');
  const [sessions,events,opportunities,receipts,ig,media]=await Promise.all([
   all(range('site_sessions','created_at')),all(range('site_events','created_at')),all(db.from('site_opportunities').select('*').eq('team_id',tenant).gte('received_at',bounds({start:addDays(period.start,-7),end:period.end}).start).lt('received_at',window.end).order('received_at').order('id')),
   all(range('whatsapp_receipts','received_at')),db.from('instagram_periods').select('metrics').eq('team_id',tenant).eq('period_start',period.start).eq('period_end',period.end).maybeSingle(),all(range('instagram_media','published_at'))
  ]);
  // Quote stages are a cohort measure for opportunities first received in the selected period.
  const cohort=opportunities.filter((o:any)=>new Date(o.received_at)>=new Date(window.start));
  const result:any=aggregate({sessions,events,opportunities,receipts,integrations,instagram:check(ig)?.metrics,media,period});
  try{const geo=await geoMetrics(period);if(geo)Object.assign(result,geo);}catch{result.geographyError='A coleta de localização está indisponível.';}
  for(const [metric,field]of [['websiteQuoteRequests','requested_at'],['quoteSent','sent_at'],['closed','won_at']])result[metric]=result.websiteReceivedContacts!==null||cohort.length?new Set(cohort.filter(o=>o.attributed&&o[field]).map(o=>o.contact_hash)).size:null;
  result.referenceOnlyContacts=cohort.filter(o=>o.attributed&&o.identity_method==='reference').length;
  result.salesByPackage=['START','LIVE','STREAMER','COMBOS','CUSTOM','GENERAL'].map(pack=>{
   const rows=cohort.filter(o=>o.attributed&&(o.selected_package||o.package)===pack);
   return {package:pack,won:rows.filter(o=>o.stage==='won').length,lost:rows.filter(o=>o.stage==='lost').length,open:rows.filter(o=>!['won','lost'].includes(o.stage)).length};
  });
  return result;
 }
 for(const period of windows()){
  const previous={start:addDays(period.start,-7),end:addDays(period.end,-7)},[current,prior]=await Promise.all([metrics(period),metrics(previous)]);
  if(period.end>=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}))for(const key of Object.keys(prior))if(typeof prior[key]==='number')prior[key]=null;
  check(await db.from('analytics_snapshots').upsert({team_id:tenant,period_start:period.start,period_end:period.end,current_metrics:current,previous_metrics:prior,updated_at:new Date().toISOString()}));
 }
}
