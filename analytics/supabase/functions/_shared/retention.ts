import {admin,check,team} from './server.ts';
export async function cleanup(){
 const db=admin(),tenant=team(),stamp=(days:number)=>new Date(Date.now()-days*86400000).toISOString();
 check(await db.from('account_requests').delete().eq('team_id',tenant).lt('expires_at',new Date().toISOString()));
 check(await db.from('whatsapp_receipts').delete().eq('team_id',tenant).lt('received_at',stamp(365)));
 check(await db.from('site_opportunities').delete().eq('team_id',tenant).lt('received_at',stamp(365)));
 check(await db.from('whatsapp_intents').delete().eq('team_id',tenant).lt('created_at',stamp(372)));
 check(await db.from('site_sessions').delete().eq('team_id',tenant).lt('last_seen_at',stamp(90)));
 check(await db.from('site_visitors').delete().eq('team_id',tenant).lt('first_seen_at',stamp(120)));
 // Jobs abandoned before a send are safe to retry; an interrupted send needs reconciliation.
 check(await db.from('report_deliveries').update({status:'failed',error_code:'render_interrupted',updated_at:new Date().toISOString()}).eq('team_id',tenant).eq('status','rendering').lt('updated_at',stamp(1/144)));
 check(await db.from('report_deliveries').update({status:'uncertain',error_code:'confirm_before_retry',updated_at:new Date().toISOString()}).eq('team_id',tenant).eq('status','sending').lt('updated_at',stamp(1/144)));
}
