import {body,check,cors,digest,endpoint,env,graph,json,member,rate} from '../_shared/server.ts';
import {seal} from '../_shared/instagram-auth.ts';
import {panelUrl} from '../_shared/account-mail.ts';
endpoint(async req=>{
 const headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const {db,user,teamId}=await member(req),input=await body(req,4000);
 if(input.action==='status'){
  const credential=check(await db.from('provider_credentials').select('expires_at').eq('team_id',teamId).eq('provider','instagram').maybeSingle());
  return json({configured:Boolean(env('INSTAGRAM_APP_ID',false)&&env('INSTAGRAM_APP_SECRET',false)&&env('INSTAGRAM_TOKEN_ENCRYPTION_KEY',false)),connected:Boolean(credential&&new Date(credential.expires_at)>new Date())},200,headers);
 }
 await rate(req,'instagram-authorization',10,900);
 const app=env('INSTAGRAM_APP_ID'),secret=env('INSTAGRAM_APP_SECRET'),redirect=env('INSTAGRAM_REDIRECT_URI');
 // Only redirect to the fixed approved panel, never a URL provided by the client.
 if(new URL(redirect).origin!==panelUrl().origin)throw new Error('configuration_missing');
 if(input.action==='start'){
  const state=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join('');
  check(await db.from('account_requests').insert({token_hash:await digest(state,env('TUNA_RATE_SECRET')),user_id:user.id,team_id:teamId,kind:'instagram',expires_at:new Date(Date.now()+600000).toISOString()}));
  const url=new URL('https://www.instagram.com/oauth/authorize');
  for(const [name,value]of Object.entries({client_id:app,redirect_uri:redirect,response_type:'code',scope:'instagram_business_basic,instagram_business_manage_insights',state,enable_fb_login:'0',force_authentication:'1'}))url.searchParams.set(name,value);
  return json({url:url.href},200,headers);
 }
 if(input.action!=='complete'||typeof input.code!=='string'||input.code.length>2000||!input.code||typeof input.state!=='string'||!/^[a-f0-9]{64}$/.test(input.state))throw new Error('invalid_input');
 const claimed=check(await db.rpc('analytics_consume_request',{digest_value:await digest(input.state,env('TUNA_RATE_SECRET')),expected_kind:'instagram',actor:user.id}));
 if(!claimed?.length||claimed[0].team_id!==teamId)throw new Error('access_denied');
 const shortResponse=await fetch('https://api.instagram.com/oauth/access_token',{method:'POST',body:new URLSearchParams({client_id:app,client_secret:secret,grant_type:'authorization_code',redirect_uri:redirect,code:input.code}),signal:AbortSignal.timeout(15000)});
 const short=await shortResponse.json();if(!shortResponse.ok||!short.access_token)throw new Error('provider_error');
 const longUrl=new URL('https://graph.instagram.com/access_token');for(const [name,value]of Object.entries({grant_type:'ig_exchange_token',client_secret:secret,access_token:short.access_token}))longUrl.searchParams.set(name,value);
 const longResponse=await fetch(longUrl,{signal:AbortSignal.timeout(15000)}),long=await longResponse.json();if(!longResponse.ok||!long.access_token)throw new Error('provider_error');
 const profile=await graph('me',{fields:'user_id,username'},long.access_token,true,'instagram');
 const account=String(profile.user_id||profile.id||'');if(profile.username!=='tuna.stream'||!/^\d+$/.test(account))throw new Error('account_mismatch');
 check(await db.from('provider_credentials').upsert({team_id:teamId,provider:'instagram',account_id:account,encrypted_token:await seal(long.access_token,account,teamId),expires_at:new Date(Date.now()+Number(long.expires_in||5184000)*1000).toISOString(),refreshed_at:new Date().toISOString()}));
 check(await db.from('analytics_integrations').upsert({team_id:teamId,source:'instagram',status:'pending',error_code:null}));
 return json({connected:true},200,headers);
});
