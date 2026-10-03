import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import {providerFailure} from './instagram-quality.js';
const privateRuntime:Record<string,string>={};
export const configureRuntime=(values:Record<string,string>)=>Object.assign(privateRuntime,values);
export const env=(name:string,required=true)=>{const value=privateRuntime[name]||Deno.env.get(name)||'';if(required&&!value)throw new Error('configuration_missing');return value;};
export const admin=()=>createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
export const team=()=>env('TUNA_TEAM_ID');
export const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const username=(value:unknown)=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export function cors(req:Request){
 const origin=req.headers.get('origin')||'',allowed=env('TUNA_ALLOWED_ORIGINS').split(',').map(v=>v.trim());
 if(!allowed.includes(origin))throw new Error('origin_denied');
 return {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, traceparent, tracestate, baggage, x-supabase-api-version','Vary':'Origin'};
}
export const json=(data:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function body(req:Request,max=24000){
 if(req.method!=='POST')throw new Error('method_denied');
 const raw=await req.text();if(new TextEncoder().encode(raw).length>max)throw new Error('body_too_large');
 try{return JSON.parse(raw);}catch{throw new Error('invalid_body');}
}
export async function digest(value:string,secret=env('WHATSAPP_CONTACT_HASH_SECRET')){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
}
export function check<T=any>(result:{data:T,error:unknown}):T{if(result.error)throw new Error('database_error');return result.data;}
export async function rate(req:Request,scope:string,max:number,seconds:number){
 const ip=req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
 const bucket=scope+':'+await digest(ip,env('TUNA_RATE_SECRET'));
 const permitted=check(await admin().rpc('analytics_take_rate',{bucket_key:bucket,max_hits:max,lifetime:seconds}));
 if(!permitted)throw new Error('rate_limited');
}
export async function member(req:Request){
 const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!token)throw new Error('access_denied');
 const db=admin(),{data,error}=await db.auth.getUser(token);if(error||!data.user)throw new Error('access_denied');
 const row=check(await db.from('team_members').select('team_id').eq('user_id',data.user.id).eq('team_id',team()).maybeSingle());
 if(!row)throw new Error('access_denied');return {db,user:data.user,teamId:row.team_id};
}
export function endpoint(handler:(req:Request)=>Promise<Response>){Deno.serve(async req=>{
 try{return await handler(req);}catch(error){
  const code=error instanceof Error?error.message:'internal_error';
  const known=['configuration_missing','origin_denied','method_denied','body_too_large','invalid_body','rate_limited','access_denied','invalid_signature','invalid_input'];
  const safe=known.includes(code)?code:'internal_error';
  const status=safe==='rate_limited'?429:['origin_denied','access_denied','invalid_signature'].includes(safe)?403:safe==='configuration_missing'?503:safe==='internal_error'?500:400;
  let headers={};try{headers=cors(req);}catch{/* Never echo a denied origin. */}
  return json({error:safe},status,headers);
 }
});}
export async function graph(path:string,params:Record<string,string>,token:string,instagram=false,loginMode=env('INSTAGRAM_LOGIN_MODE',false)){
 const version=env('META_GRAPH_VERSION');if(!/^v\d+\.\d+$/.test(version))throw new Error('configuration_missing');
 const host=instagram&&loginMode!=='facebook'?'graph.instagram.com':'graph.facebook.com';
 const url=new URL(`https://${host}/${version}/${path}`);for(const [key,value]of Object.entries(params))url.searchParams.set(key,value);
 let response:Response;
 try{response=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(18000)});}catch(error){throw new Error(error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'provider_timeout':'provider_unavailable');}
 let data:any;try{data=await response.json();}catch{throw new Error(response.status>=500?'provider_unavailable':'provider_invalid_response');}
 if(!response.ok||data.error)throw new Error(providerFailure(response.status,data.error));return data;
}
