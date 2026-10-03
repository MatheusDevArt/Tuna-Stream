import {admin,check,env,team} from './server.ts';
async function key(){const value=env('INSTAGRAM_TOKEN_ENCRYPTION_KEY');if(!/^[a-f0-9]{64}$/i.test(value))throw new Error('configuration_missing');return crypto.subtle.importKey('raw',Uint8Array.from(value.match(/../g)!,v=>parseInt(v,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function seal(token:string,account:string,tenant:string){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const bytes=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(tenant+':'+account)},await key(),new TextEncoder().encode(token)));
 return btoa(String.fromCharCode(...iv))+'.'+btoa(String.fromCharCode(...bytes));
}
async function unseal(value:string,account:string,tenant:string){const [a,b]=value.split('.'),decode=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(a),additionalData:new TextEncoder().encode(tenant+':'+account)},await key(),decode(b)));}
export async function loadInstagram(){
 const db=admin(),tenant=team(),row=check(await db.from('provider_credentials').select('*').eq('team_id',tenant).eq('provider','instagram').maybeSingle());
 if(!row)return {token:env('INSTAGRAM_ACCESS_TOKEN',false),account:env('INSTAGRAM_ACCOUNT_ID',false),mode:env('INSTAGRAM_LOGIN_MODE',false)||'instagram'};
 if(new Date(row.expires_at).getTime()<=Date.now())throw new Error('token_expired');
 let token=await unseal(row.encrypted_token,row.account_id,tenant);
 if(Date.now()-new Date(row.refreshed_at).getTime()>50*86400000){
  const url=new URL('https://graph.instagram.com/refresh_access_token');url.searchParams.set('grant_type','ig_refresh_token');url.searchParams.set('access_token',token);
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)}),result=await response.json();if(!response.ok||!result.access_token)throw new Error('token_expired');
  if(!Number.isFinite(result.expires_in)||result.expires_in<=0)throw new Error('provider_invalid_response');
  token=result.access_token;check(await db.from('provider_credentials').update({encrypted_token:await seal(token,row.account_id,tenant),refreshed_at:new Date().toISOString(),expires_at:new Date(Date.now()+result.expires_in*1000).toISOString()}).eq('team_id',tenant).eq('provider','instagram'));
 }
 return {token,account:row.account_id,mode:'instagram'};
}
