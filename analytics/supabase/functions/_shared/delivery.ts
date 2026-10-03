import {admin,check,env,team} from './server.ts';
import {renderPng} from './png.ts';
import {windows} from './aggregation.js';
export function reportConfigured(){return ['WHATSAPP_ACCESS_TOKEN','WHATSAPP_REPORT_SENDER_PHONE_NUMBER_ID','WHATSAPP_REPORT_RECIPIENT','WHATSAPP_SITE_TEMPLATE','WHATSAPP_INSTAGRAM_TEMPLATE','META_GRAPH_VERSION'].every(key=>env(key,false));}
async function post(path:string,payload:BodyInit,contentType?:string){
 const response=await fetch('https://graph.facebook.com/'+env('META_GRAPH_VERSION')+'/'+path,{method:'POST',headers:{Authorization:'Bearer '+env('WHATSAPP_ACCESS_TOKEN'),...(contentType?{'Content-Type':contentType}:{})},body:payload,signal:AbortSignal.timeout(20000)});
 const result=await response.json();if(!response.ok||result.error)throw new Error(response.status>=500?'provider_uncertain':'provider_rejected');return result;
}
export async function sendReports(){
 if(!reportConfigured())throw new Error('configuration_missing');
 const db=admin(),tenant=team(),period=windows()[1],row=check(await db.from('analytics_snapshots').select('current_metrics,previous_metrics').eq('team_id',tenant).eq('period_start',period.start).eq('period_end',period.end).maybeSingle());
 if(!row)throw new Error('snapshot_missing');
 const snapshot={demo:false,period:{...period,label:period.start.split('-').reverse().join('/')+' a '+period.end.split('-').reverse().join('/')},current:row.current_metrics,previous:row.previous_metrics};
 const results=[];
 for(const type of ['website','instagram']){
  check(await db.from('report_deliveries').upsert({team_id:tenant,period_start:period.start,report_type:type},{onConflict:'team_id,period_start,report_type',ignoreDuplicates:true}));
  const claimed=check(await db.from('report_deliveries').update({status:'rendering',error_code:null,provider_message_id:null,updated_at:new Date().toISOString()}).eq('team_id',tenant).eq('period_start',period.start).eq('report_type',type).in('status',['queued','failed']).lt('attempt',3).select('id,attempt').maybeSingle());
  if(!claimed){results.push({type,status:'already_processed'});continue;}
  let messageStarted=false;
  try{
   const png=await renderPng(snapshot,type);if(png.length>5*1024*1024)throw new Error('image_too_large');
   const form=new FormData();form.set('messaging_product','whatsapp');form.set('file',new Blob([new Uint8Array(png).buffer],{type:'image/png'}),'tunastream-'+type+'.png');form.set('type','image/png');
   const sender=env('WHATSAPP_REPORT_SENDER_PHONE_NUMBER_ID'),media=await post(sender+'/media',form);
   check(await db.from('report_deliveries').update({status:'sending',attempt:claimed.attempt+1,updated_at:new Date().toISOString()}).eq('id',claimed.id));
   messageStarted=true;
   const sent=await post(sender+'/messages',JSON.stringify({messaging_product:'whatsapp',to:env('WHATSAPP_REPORT_RECIPIENT'),biz_opaque_callback_data:claimed.id+':'+(claimed.attempt+1),type:'template',template:{name:env(type==='website'?'WHATSAPP_SITE_TEMPLATE':'WHATSAPP_INSTAGRAM_TEMPLATE'),language:{code:'pt_BR'},components:[{type:'header',parameters:[{type:'image',image:{id:media.id}}]},{type:'body',parameters:[{type:'text',text:snapshot.period.label}]}]}}),'application/json');
   const messageId=sent.messages?.[0]?.id;if(!messageId)throw new Error('ambiguous_response');
   check(await db.from('report_deliveries').update({status:'sent',provider_message_id:messageId,updated_at:new Date().toISOString()}).eq('id',claimed.id).eq('status','sending'));
   check(await db.from('report_deliveries').update({provider_message_id:messageId}).eq('id',claimed.id));
   results.push({type,status:'sent'});
  }catch(error){
   const rejected=error instanceof Error&&error.message==='provider_rejected';
   const status=messageStarted&&!rejected?'uncertain':'failed';
   check(await db.from('report_deliveries').update({status,attempt:claimed.attempt+1,error_code:status==='uncertain'?'confirm_before_retry':'send_failed',updated_at:new Date().toISOString()}).eq('id',claimed.id));
   results.push({type,status});
  }
 }
 return results;
}
export async function sendScheduledReports(){
 const db=admin(),preference=check(await db.from('report_preferences').select('*').eq('team_id',team()).maybeSingle());
 if(!preference?.enabled||!reportConfigured())return [];
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const get=(name:string)=>parts.find(p=>p.type===name)?.value||'',date=get('year')+'-'+get('month')+'-'+get('day');
 const weekday=new Date(date+'T12:00:00Z').getUTCDay(),time=get('hour')+':'+get('minute');
 // Catch up later that day; unique delivery rows keep cron retries idempotent.
 if(weekday!==preference.weekday||time<preference.send_time.slice(0,5))return [];
 return sendReports();
}
