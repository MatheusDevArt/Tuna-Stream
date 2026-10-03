import {admin,check,digest,env,json,team} from '../_shared/server.ts';
import {loadInstagramRuntime} from '../_shared/instagram-runtime.ts';
Deno.serve(async req=>{
 try{
  if(req.method!=='GET')return json({error:'method_denied'},405);
  await loadInstagramRuntime();
  const input=new URL(req.url),state=input.searchParams.get('state')||'',code=input.searchParams.get('code')||'';
  if(!/^[a-f0-9]{64}$/.test(state)||code.length>2000)return json({error:'access_denied'},403);
  const request=check(await admin().from('account_requests').select('expires_at').eq('team_id',team()).eq('kind','instagram').eq('token_hash',await digest(state,env('TUNA_RATE_SECRET'))).maybeSingle());
  if(!request||new Date(request.expires_at)<=new Date())return json({error:'access_denied'},403);
  const target=new URL(env('TUNA_PANEL_URL'));
  if(!code){target.searchParams.set('error','authorization_cancelled');}else{target.searchParams.set('code',code);target.searchParams.set('state',state);}
  return new Response(null,{status:302,headers:{Location:target.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 }catch{return json({error:'configuration_missing'},503);}
});
