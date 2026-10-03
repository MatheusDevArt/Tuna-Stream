import {admin,check,digest,endpoint,env,json} from '../_shared/server.ts';
import {syncInstagram} from '../_shared/instagram-sync.ts';
import {publishSnapshots} from '../_shared/snapshots.ts';
import {loadInstagramRuntime} from '../_shared/instagram-runtime.ts';
// Cron uses a separate server secret. This function never accepts the publishable key.
endpoint(async req=>{
 if(req.method!=='POST')throw new Error('method_denied');
 await loadInstagramRuntime();
 const secret=env('INSTAGRAM_CRON_SECRET');
 if(secret.length<32)throw new Error('configuration_missing');
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!token||await digest(token,secret)!==await digest(secret,secret))throw new Error('access_denied');
 const instagram=await syncInstagram();
 await publishSnapshots();
 let schedulerConfigured=false;
 // A scheduling failure must not relabel already committed measurements as failed.
 if(['complete','partial'].includes(instagram.status)){
  try{schedulerConfigured=check(await admin().rpc('analytics_activate_instagram_schedule'));}catch{/* Status exposes the pending schedule separately. */}
 }else schedulerConfigured=check(await admin().rpc('analytics_instagram_schedule_status'));
 return json({instagram,schedulerConfigured},instagram.status==='failed'?503:200);
});
