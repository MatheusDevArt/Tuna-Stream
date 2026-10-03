import {body,check,cors,digest,endpoint,json,member,uuid} from '../_shared/server.ts';
import {extractReference} from '../_shared/whatsapp.js';
import {publishSnapshots} from '../_shared/snapshots.ts';
endpoint(async req=>{
 const headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const {db,user,teamId}=await member(req),input=await body(req,2000);
 if(input.action==='confirm-link'){
  const reference=extractReference(input.reference);if(!reference||typeof input.quote!=='boolean')throw new Error('invalid_input');
  const id=check(await db.rpc('analytics_confirm_link',{reference_code:reference,tenant:teamId,actor:user.id,reference_digest:await digest(teamId+':reference:'+reference),requested:input.quote}));
  check(await db.from('analytics_integrations').upsert({team_id:teamId,source:'whatsapp',mode:'manual',status:'ready',last_success_at:new Date().toISOString(),error_code:null}));
  await publishSnapshots();return json({saved:true,id},200,headers);
 }
 if(input.action==='package'){
  if(!uuid(input.id)||!['START','LIVE','STREAMER','COMBOS','CUSTOM','GENERAL'].includes(input.package))throw new Error('invalid_input');
  const opportunity=check(await db.from('site_opportunities').select('id').eq('id',input.id).eq('team_id',teamId).eq('attributed',true).maybeSingle());
  if(!opportunity)throw new Error('access_denied');
  check(await db.from('site_opportunities').update({selected_package:input.package}).eq('id',input.id).eq('team_id',teamId));
  return json({saved:true},200,headers);
 }
 if(input.action==='confirm'){
  const reference=extractReference(input.reference),digits=String(input.phone||'').replace(/\D/g,''),phone=!String(input.phone||'').trim().startsWith('+')&&(digits.length===10||digits.length===11)?'55'+digits:digits;
  if(!reference||!/^[1-9]\d{7,14}$/.test(phone)||typeof input.quote!=='boolean'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.receivedAt))throw new Error('invalid_input');
  const received=new Date(input.receivedAt+'-03:00');
  if(!Number.isFinite(received.getTime())||received.getTime()>Date.now()+300000||received.getTime()<Date.now()-30*86400000)throw new Error('invalid_input');
  const intent=check(await db.from('whatsapp_intents').select('created_at,expires_at,ambiguous').eq('team_id',teamId).eq('reference',reference).maybeSingle());
  if(!intent||intent.ambiguous||new Date(intent.expires_at)<received||new Date(intent.created_at).getTime()>received.getTime()+300000)throw new Error('invalid_input');
  const contact=await digest(teamId+':contact:'+phone);
  check(await db.rpc('analytics_attach_contact',{reference_code:reference,tenant:teamId,actor:user.id,contact_digest:contact,message_time:received.toISOString()}));
  check(await db.rpc('analytics_receive',{reference_code:reference,contact_digest:contact,message_digest:await digest(teamId+':manual:'+reference+':'+contact),message_time:received.toISOString(),tenant:teamId}));
  const opportunity=check(await db.from('site_opportunities').select('id,attributed,requested_at').eq('team_id',teamId).eq('reference',reference).eq('contact_hash',contact).maybeSingle());
  if(!opportunity?.attributed){await publishSnapshots();throw new Error('invalid_input');}
  check(await db.from('site_opportunities').update({confirmation_method:'manual',confirmed_by:user.id}).eq('id',opportunity.id));
  if(input.quote&&!opportunity.requested_at)check(await db.rpc('analytics_change_stage',{opportunity:opportunity.id,tenant:teamId,actor:user.id,next_stage:'quote_requested'}));
  check(await db.from('analytics_integrations').upsert({team_id:teamId,source:'whatsapp',mode:'manual',status:'ready',last_success_at:new Date().toISOString(),error_code:null}));
  await publishSnapshots();return json({saved:true},200,headers);
 }
 if(input.action==='stage'){
  if(!uuid(input.id)||!['new','quote_requested','quote_sent','won','lost'].includes(input.stage))throw new Error('invalid_input');
  check(await db.rpc('analytics_change_stage',{opportunity:input.id,tenant:teamId,actor:user.id,next_stage:input.stage}));
  await publishSnapshots();return json({saved:true},200,headers);
 }
 if(input.action==='schedule'){
  if(!Number.isInteger(input.weekday)||input.weekday<0||input.weekday>6||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))throw new Error('invalid_input');
  // Saving a schedule does not opt anyone into messages or activate an unconfigured sender.
  check(await db.from('report_preferences').update({weekday:input.weekday,send_time:input.time,updated_at:new Date().toISOString()}).eq('team_id',teamId));
  return json({saved:true},200,headers);
 }
 throw new Error('invalid_input');
});
