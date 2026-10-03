import {admin,body,check,cors,digest,endpoint,env,json,rate,username} from '../_shared/server.ts';
import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
endpoint(async req=>{
 const headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 await rate(req,'login',8,900);const input=await body(req,1000),nick=username(input.username);
 if(nick.length>80||typeof input.password!=='string'||input.password.length>200)throw new Error('invalid_input');
 const limit=check(await admin().rpc('analytics_take_rate',{bucket_key:'username:'+await digest(nick,env('TUNA_RATE_SECRET')),max_hits:30,lifetime:3600}));
 if(!limit)throw new Error('rate_limited');
 const db=admin(),row=check(await db.from('analytics_users').select('user_id').eq('username',nick).maybeSingle());
 // Unknown users still perform a password grant; the response never reveals account existence.
 const account=row?await db.auth.admin.getUserById(row.user_id):null;
 const publicClient=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
 const result=await publicClient.auth.signInWithPassword({email:account?.data.user?.email||'unknown@access.tunastream.invalid',password:input.password});
 if(result.error||!row||!result.data.session)return json({error:'invalid_credentials'},401,headers);
 return json({access_token:result.data.session.access_token,refresh_token:result.data.session.refresh_token},200,headers);
});
