import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import {admin,body,check,cors,digest,endpoint,env,json,member,rate,username} from '../_shared/server.ts';
import {createRequest} from '../_shared/account-mail.ts';
const emailValid=(value:unknown)=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
async function verifyPassword(user:any,password:unknown){
 if(typeof password!=='string'||password.length>200)throw new Error('invalid_input');
 const client=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
 const result=await client.auth.signInWithPassword({email:user.email,password});
 if(result.error||result.data.user?.id!==user.id)throw new Error('access_denied');
 await client.auth.signOut({scope:'local'});
}
export default endpoint(async req=>{
 const headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 await rate(req,'account',120,60);const input=await body(req,4400000),db=admin();
 if(input.action!=='profile')await rate(req,'account-change',10,900);
 if(input.action==='recover'){
  env('RESEND_API_KEY');env('TUNA_MAIL_FROM');
  // Always use the same response for unknown users and accounts without verified email.
  const nick=username(input.username);if(nick.length>60)throw new Error('invalid_input');
  const alias=check(await db.from('analytics_users').select('user_id,team_id').eq('username',nick).maybeSingle());
  const profile=alias?check(await db.from('member_profiles').select('recovery_email,recovery_verified_at').eq('user_id',alias.user_id).maybeSingle()):null;
  if(profile?.recovery_email&&profile.recovery_verified_at){try{await createRequest(alias.user_id,alias.team_id,'password',{},profile.recovery_email);}catch{/* Generic reply also covers provider delivery failures; do not reveal account existence. */}}
  return json({message:'Se este usuário tiver um e-mail confirmado, enviaremos um link para ele.'},200,headers);
 }
 if(input.action==='complete'){
  if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token))throw new Error('invalid_input');
  const hash=await digest(input.token,env('TUNA_RATE_SECRET'));
  const request=check(await db.from('account_requests').select('*').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle());
  if(!request||request.kind==='instagram')throw new Error('invalid_input');
  const membership=check(await db.from('team_members').select('user_id').eq('user_id',request.user_id).eq('team_id',request.team_id).maybeSingle());
  if(!membership)throw new Error('access_denied');
  if(request.kind==='password'){
   if(input.password===undefined)return json({needsPassword:true},200,headers);
   if(typeof input.password!=='string'||input.password.length<10||input.password.length>200)throw new Error('invalid_input');
  }else{
   if(!req.headers.get('authorization'))return json({needsLogin:true},200,headers);
   const actor=await member(req);if(actor.user.id!==request.user_id||actor.teamId!==request.team_id)throw new Error('access_denied');
  }
  const claimed=check(await db.rpc('analytics_consume_request',{digest_value:hash,expected_kind:request.kind,actor:request.kind==='password'?null:request.user_id}));
  if(!claimed?.length)throw new Error('invalid_input');
  if(request.kind==='email')check(await db.from('member_profiles').update({recovery_email:request.payload.email,recovery_verified_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('user_id',request.user_id));
  else if(request.kind==='username')check(await db.rpc('analytics_confirm_username',{owner_id:request.user_id,tenant:request.team_id,nick:request.payload.nick,display:request.payload.display}));
  else {const result=await db.auth.admin.updateUserById(request.user_id,{password:input.password});if(result.error)throw new Error('account_update_failed');}
  return json({saved:true},200,headers);
 }
 const {user,teamId}=await member(req);
 const self=check(await db.from('member_profiles').select('*').eq('user_id',user.id).eq('team_id',teamId).single());
 if(input.action==='profile'){
  const people=check(await db.from('member_profiles').select('user_id,display_name,default_avatar,avatar_path').eq('team_id',teamId));
  const profiles=await Promise.all(people.map(async (profile:any)=>{const {avatar_path,...safe}=profile;if(!avatar_path)return safe;const signed=await db.storage.from('team-avatars').createSignedUrl(avatar_path,3600);return {...safe,avatar_url:signed.data?.signedUrl};}));
  return json({profiles,self:{...profiles.find(p=>p.user_id===user.id),recovery_email:self.recovery_verified_at?self.recovery_email:null,pending_email:env(self.default_avatar==='adriana'?'TUNA_ADRIANA_RECOVERY_EMAIL':'TUNA_MATHEUS_RECOVERY_EMAIL',false)||null}},200,headers);
 }
 if(input.action==='avatar'){
  const ext:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
  if(!ext[input.mime]||typeof input.image!=='string'||input.image.length>4194304||!/^[A-Za-z0-9+/]+={0,2}$/.test(input.image))throw new Error('invalid_input');
  let bytes;try{bytes=Uint8Array.from(atob(input.image),c=>c.charCodeAt(0));}catch{throw new Error('invalid_input');}
  const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
  const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
  if(bytes.length<20||bytes.length>3145728||!(input.mime==='image/png'?png:input.mime==='image/jpeg'?jpg:webp))throw new Error('invalid_input');
  const path=teamId+'/'+user.id+'/'+crypto.randomUUID()+'.'+ext[input.mime];
  const upload=await db.storage.from('team-avatars').upload(path,bytes,{contentType:input.mime,upsert:false});if(upload.error)throw new Error('storage_unavailable');
  check(await db.from('member_profiles').update({avatar_path:path,updated_at:new Date().toISOString()}).eq('user_id',user.id));
  if(self.avatar_path)await db.storage.from('team-avatars').remove([self.avatar_path]);
  return json({saved:true},200,headers);
 }
 if(input.action==='password-request'){
  if(!self.recovery_verified_at||!self.recovery_email)throw new Error('invalid_input');
  await createRequest(user.id,teamId,'password',{},self.recovery_email);
 }else if(input.action==='email-request'){
  await verifyPassword(user,input.password);if(!emailValid(input.email))throw new Error('invalid_input');
  await createRequest(user.id,teamId,'email',{email:input.email.trim().toLowerCase()},input.email.trim().toLowerCase());
 }else if(input.action==='username-request'){
  await verifyPassword(user,input.password);const display=String(input.username||'').normalize('NFKC').trim().replace(/\s+/g,' '),nick=username(display);
  if(display.length<3||display.length>60||/[\u0000-\u001f<>]/.test(display)||!self.recovery_verified_at||!self.recovery_email)throw new Error('invalid_input');
  const existing=check(await db.from('analytics_users').select('user_id').eq('username',nick).maybeSingle());if(existing&&existing.user_id!==user.id)throw new Error('invalid_input');
  await createRequest(user.id,teamId,'username',{nick,display},self.recovery_email);
 }else throw new Error('invalid_input');
 return json({message:'Confira seu e-mail para confirmar a alteração.'},200,headers);
});
