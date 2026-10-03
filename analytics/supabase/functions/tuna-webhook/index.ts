import {admin,check,digest,endpoint,env,json,team,uuid} from '../_shared/server.ts';
import {extractReference,inboundMessages,verifySignature} from '../_shared/whatsapp.js';
endpoint(async req=>{
 const url=new URL(req.url);
 if(req.method==='GET'){
  if(url.searchParams.get('hub.mode')==='subscribe'&&url.searchParams.get('hub.verify_token')===env('WHATSAPP_WEBHOOK_VERIFY_TOKEN'))return new Response(url.searchParams.get('hub.challenge'),{headers:{'Content-Type':'text/plain'}});
  throw new Error('access_denied');
 }
 if(req.method!=='POST')throw new Error('method_denied');
 const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length>1000000)throw new Error('body_too_large');
 if(!await verifySignature(bytes,req.headers.get('x-hub-signature-256'),env('META_APP_SECRET')))throw new Error('invalid_signature');
 const payload=JSON.parse(new TextDecoder().decode(bytes)),db=admin(),tenant=team();
 for(const message of inboundMessages(payload,env('WHATSAPP_RECEIVING_PHONE_NUMBER_ID',false))){
  const reference=extractReference(message.text?.body||message[message.type]?.caption||''),timestamp=Number(message.timestamp)*1000;
  if(!Number.isFinite(timestamp)||timestamp>Date.now()+300000)continue;
  // No message body, phone number or profile name is persisted or logged.
  check(await db.rpc('analytics_receive',{reference_code:reference,contact_digest:await digest(tenant+':contact:'+message.from),message_digest:await digest(tenant+':message:'+message.id),message_time:new Date(timestamp).toISOString(),tenant}));
 }
 const sender=env('WHATSAPP_REPORT_SENDER_PHONE_NUMBER_ID',false);
 for(const entry of payload.entry||[])for(const change of entry.changes||[]){
  const value=change.value;if(value?.metadata?.phone_number_id!==sender)continue;
  for(const status of value.statuses||[]){
   if(!['sent','delivered','read','failed'].includes(status.status))continue;
   const [callbackId,callbackAttempt]=String(status.biz_opaque_callback_data||'').split(':');
   const query=db.from('report_deliveries').select('id,status,attempt,provider_message_id').eq('team_id',tenant);
   const row=check(await (uuid(callbackId)?query.eq('id',callbackId):query.eq('provider_message_id',status.id)).maybeSingle());
   if(callbackAttempt&&row?.attempt!==Number(callbackAttempt))continue;
   const order:Record<string,number>={sending:0,uncertain:0,sent:1,delivered:2,read:3,failed:0};
   if(row&&(status.status==='failed'? !['delivered','read'].includes(row.status): !(order[status.status]<order[row.status])))check(await db.from('report_deliveries').update({status:status.status,provider_message_id:status.id,error_code:status.status==='failed'?'delivery_failed':null,updated_at:new Date().toISOString()}).eq('id',row.id));
  }
 }
 const receiver=env('WHATSAPP_RECEIVING_PHONE_NUMBER_ID',false);
 if(receiver&&payload.entry?.some((entry:any)=>entry.changes?.some((change:any)=>change.value?.metadata?.phone_number_id===receiver)))check(await db.from('analytics_integrations').upsert({team_id:tenant,source:'whatsapp',mode:'api',status:'ready',last_success_at:new Date().toISOString(),error_code:null}));
 return json({received:true});
});
