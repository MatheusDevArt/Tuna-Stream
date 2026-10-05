import {admin,check,env,team} from './server.ts';
import {collectInstagram} from './instagram.ts';
import {safeCollectionError} from './instagram-quality.js';

export async function syncInstagram(){
 const now=Date.now();
 const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',hour:'numeric',hourCycle:'h23'}).format(now));
 if(hour>=1&&hour<5)return {status:'skipped',reason:'quiet_hours'};
 const db=admin(),tenant=team();
 const credential=check(await db.from('provider_credentials').select('account_id').eq('team_id',tenant).eq('provider','instagram').maybeSingle());
 if(!credential&&!env('INSTAGRAM_ACCESS_TOKEN',false))return {status:'pending',reason:'authorization_required'};
 const integration=check(await db.from('analytics_integrations').select('mode,last_success_at,last_error_at,error_code').eq('team_id',tenant).eq('source','instagram').maybeSingle());
 const lastSuccess=new Date(integration?.last_success_at||0).getTime(),lastError=new Date(integration?.last_error_at||0).getTime();
 const profile=check(await db.from('instagram_daily').select('metrics').eq('team_id',tenant).order('collected_at',{ascending:false}).limit(1).maybeSingle());
 const accountReady=profile?.metrics&&Object.hasOwn(profile.metrics,'publicationsTotal');
 // The 15-minute scheduler checks a 25-minute gate: successful runs settle around 30 minutes apart.
 if(accountReady&&integration?.mode==='api'&&integration.last_success_at&&now-lastSuccess<25*60000)return {status:'skipped',reason:'not_due'};
 // Avoid retrying every scheduler tick after Meta explicitly limits the account.
 if(integration?.error_code==='provider_rate_limited'&&lastError>lastSuccess&&now-lastError<60*60000)return {status:'skipped',reason:'provider_cooldown'};
 if(!check(await db.rpc('analytics_take_rate',{bucket_key:'instagram-sync:'+tenant,max_hits:1,lifetime:300})))return {status:'skipped',reason:'already_running_or_recent_attempt'};
 const started=new Date().toISOString();
 const run=check(await db.from('analytics_collection_runs').insert({team_id:tenant,source:'instagram',provider:'meta',status:'running',started_at:started}).select('id').single());
 check(await db.from('analytics_integrations').update({last_attempt_at:started}).eq('team_id',tenant).eq('source','instagram'));
 try{return await collectInstagram(run.id);}
 catch(error){
  const code=safeCollectionError(error),finished=new Date().toISOString();
  check(await db.from('analytics_collection_runs').update({status:'failed',finished_at:finished,error_code:code}).eq('id',run.id).eq('team_id',tenant));
  // Keep the actual last_success_at and provider mode of the saved measurements.
  check(await db.from('analytics_integrations').update({status:'error',last_error_at:finished,error_code:code}).eq('team_id',tenant).eq('source','instagram'));
  return {status:'failed',error:code};
 }
}
