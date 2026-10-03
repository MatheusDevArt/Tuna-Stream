import {admin,check,digest,endpoint,env,json,team} from '../_shared/server.ts';
import {publishSnapshots} from '../_shared/snapshots.ts';
import {collectInstagram} from '../_shared/instagram.ts';
import {sendScheduledReports} from '../_shared/delivery.ts';
import {cleanup} from '../_shared/retention.ts';
endpoint(async req=>{
 if(req.method!=='POST')throw new Error('method_denied');
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!token||await digest(token,env('TUNA_CRON_SECRET'))!==await digest(env('TUNA_CRON_SECRET'),env('TUNA_CRON_SECRET')))throw new Error('access_denied');
 const db=admin(),row=check(await db.from('analytics_integrations').select('last_success_at').eq('team_id',team()).eq('source','instagram').maybeSingle());
 const instagramDue=!row?.last_success_at||Date.now()-new Date(row.last_success_at).getTime()>4*3600000;
 if(instagramDue&&check(await db.rpc('analytics_take_rate',{bucket_key:'instagram-sync:'+team(),max_hits:1,lifetime:300}))){
  try{await collectInstagram();}catch(error){check(await db.from('analytics_integrations').update({status:'error',error_code:error instanceof Error&&error.message==='token_expired'?'token_expired':'collection_failed'}).eq('team_id',team()).eq('source','instagram'));}
 }
 await publishSnapshots();
 await cleanup();
 await sendScheduledReports();
 check(await db.from('analytics_rate_limits').delete().lt('expires_at',new Date(Date.now()-86400000).toISOString()));
 return json({synchronized:true});
});
