import {admin,check,digest,endpoint,env,json,team} from '../_shared/server.ts';
import {publishSnapshots} from '../_shared/snapshots.ts';
import {syncInstagram} from '../_shared/instagram-sync.ts';
import {sendScheduledReports} from '../_shared/delivery.ts';
import {cleanup} from '../_shared/retention.ts';
endpoint(async req=>{
 if(req.method!=='POST')throw new Error('method_denied');
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!token||await digest(token,env('TUNA_CRON_SECRET'))!==await digest(env('TUNA_CRON_SECRET'),env('TUNA_CRON_SECRET')))throw new Error('access_denied');
 const db=admin(),instagram=await syncInstagram();
 await publishSnapshots();
 await cleanup();
 await sendScheduledReports();
 check(await db.from('analytics_rate_limits').delete().lt('expires_at',new Date(Date.now()-86400000).toISOString()));
 return json({synchronized:instagram.status!=='failed',instagram},instagram.status==='failed'?503:200);
});
