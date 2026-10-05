import {admin,check,team} from './server.ts';
import {aggregate,bounds,analysisWindows,previousWindow} from './aggregation.js';
import {geoMetrics} from './ga4.ts';
import {summarizeSalesPeriod} from '../../../src/sales.js';
import {protectInstagramComparison} from './instagram-quality.js';
async function all(query:any){let rows:any[]=[];for(let offset=0;offset<100000;offset+=750){const page=check<any[]>(await query.range(offset,offset+749));rows.push(...page);if(page.length<750)return rows;}throw new Error('data_window_exceeded');}
export async function publishSnapshots(){
 const db=admin(),tenant=team(),integrations=check(await db.from('analytics_integrations').select('source,status,mode,last_success_at,first_success_at,last_attempt_at,last_error_at,error_code').eq('team_id',tenant))||[];
 const latest=check(await db.from('instagram_daily').select('metrics,collected_at').eq('team_id',tenant).order('collected_at',{ascending:false}).limit(1).maybeSingle());
 const instagramAccount=latest?{...latest.metrics,collectedAt:latest.collected_at}:null;
 async function metrics(period:any){
  const window=bounds(period);
  const range=(table:string,field:string)=>db.from(table).select('*').eq('team_id',tenant).gte(field,window.start).lt(field,window.end).order(field).order(table==='whatsapp_receipts'?'message_hash':'id');
  const [sessions,events,opportunities,receipts,ig,media]=await Promise.all([
   all(range('site_sessions','created_at')),all(range('site_events','created_at')),all(db.from('site_opportunities').select('*').eq('team_id',tenant).is('archived_at',null).order('received_at').order('id')),
   all(range('whatsapp_receipts','received_at')),db.from('instagram_periods').select('metrics').eq('team_id',tenant).eq('period_start',period.start).eq('period_end',period.end).maybeSingle(),all(range('instagram_media','published_at'))
  ]);
  // Quote stages are a cohort measure for opportunities first received in the selected period.
  const cohort=opportunities.filter((o:any)=>o.origin!=='manual'&&new Date(o.received_at)>=new Date(window.start)&&new Date(o.received_at)<new Date(window.end));
  const result:any=aggregate({sessions,events,opportunities,receipts,integrations,instagram:check(ig)?.metrics,media,period});
  result.instagramAccount=instagramAccount;
  if(instagramAccount){result.followersTotal=instagramAccount.followersTotal;result.followersAsOf=instagramAccount.followersAsOf;}
  try{const geo=await geoMetrics(period);if(geo)Object.assign(result,geo);}catch{result.geographyError='A coleta de localização está indisponível.';}
  for(const [metric,field]of [['websiteQuoteRequests','requested_at'],['quoteSent','sent_at'],['closed','won_at']])result[metric]=result.websiteReceivedContacts!==null||cohort.length?new Set(cohort.filter(o=>o.attributed&&o[field]).map(o=>o.contact_hash)).size:null;
  result.referenceOnlyContacts=cohort.filter(o=>o.attributed&&o.identity_method==='reference').length;
  const sales=summarizeSalesPeriod(opportunities.filter(o=>o.attributed),period);
  result.sales=sales;
  result.uniqueClients=sales.clients;
  result.buyingClients=sales.buyers;
  result.salesClosed=sales.won;
  result.closed=sales.won;
  result.salesByPackage=sales.salesByPackage;
  return result;
 }
 for(const period of analysisWindows()){
  const previous=previousWindow(period),[current,prior]=await Promise.all([metrics(period),metrics(previous)]);
  if(period.end>=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}))for(const key of Object.keys(prior))if(typeof prior[key]==='number')prior[key]=null;
  protectInstagramComparison(current,prior);
  check(await db.from('analytics_snapshots').upsert({team_id:tenant,period_start:period.start,period_end:period.end,current_metrics:current,previous_metrics:prior,updated_at:new Date().toISOString()}));
 }
}
