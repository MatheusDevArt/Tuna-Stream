// A loopback-only configuration form. No secret is returned by this endpoint.
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createClient} from '@supabase/supabase-js';
const execute=promisify(execFile),nonce=randomBytes(32).toString('hex');let saving=false;
const expected='https://fundfokaxkmgvdrpwyot.supabase.co';
export async function schemaBundle(root){
 const directory=resolve(root,'supabase/migrations'),files=(await readdir(directory)).filter(name=>name.endsWith('.sql')&&!name.includes('secure_schedule')).sort();
 const scripts=await Promise.all(files.map(async name=>'-- '+name+'\n'+(await readFile(resolve(directory,name),'utf8')).replace(/^begin;\s*/i,'').replace(/commit;\s*$/i,'')));
 return 'begin;\n'+scripts.join('\n')+'\ngrant usage on schema public to service_role;\ngrant all on all tables in schema public to service_role;\ngrant all on all sequences in schema public to service_role;\ncommit;\nselect \'TunaStream: schema instalado\' as result;';
}
function response(data,status=200,type='application/json'){return new Response(typeof data==='string'?data:JSON.stringify(data),{status,headers:{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
export async function setupRoute(req,root,base){
 const url=new URL(req.url);
 if(req.method==='GET'&&url.pathname==='/_integracao/esquema')return response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Esquema TunaStream</title><pre>'+(await schemaBundle(root)).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</pre></html>',200,'text/html');
 if(req.method==='GET'&&url.pathname==='/_integracao/schema.sql')return response(await schemaBundle(root),200,'text/plain');
 if(req.method==='GET'&&url.pathname==='/_integracao')return response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conectar Supabase · TunaStream</title><style>body{background:#0c0911;color:#eee;font:16px system-ui;max-width:640px;margin:40px auto;padding:20px}h1{font-size:26px}label{display:block;margin:20px 0}input{display:block;box-sizing:border-box;width:100%;background:#21182d;color:#fff;border:1px solid #614080;border-radius:8px;padding:12px;margin-top:8px}button{background:#9b54e7;color:#fff;border:0;border-radius:8px;padding:14px;cursor:pointer}p{line-height:1.65}small{color:#b9aacb}a{color:#d4a7ff}#status{white-space:pre-wrap}</style><h1>Conectar seu novo Supabase</h1><p>Configuração privada, somente neste computador. Primeiro instale o <a href="/_integracao/schema.sql" target="_blank">esquema do banco</a> no projeto TunaStream Analytics. Depois preencha as chaves e confirme as senhas dos dois acessos.</p><form id="setup"><label>URL do projeto<input name="url" value="${expected}" readonly></label><label>Chave pública · publishable<input name="publicKey" required autocomplete="off"></label><label>Chave privada do servidor · secret ou service_role<input name="serverKey" type="password" required autocomplete="off"></label><small>A chave privada fica em um arquivo local ignorado pelo Git. Ela permite ao servidor gravar dados neste projeto. Não é enviada ao navegador nem ao Lovable.</small><label>Senha do acesso Matheus P<input name="matheusPassword" type="password" required minlength="6" autocomplete="new-password"></label><label>Senha do acesso Adriana S<input name="adrianaPassword" type="password" required minlength="6" autocomplete="new-password"></label><small>As senhas são usadas para criar os acessos no novo banco. Não são salvas em arquivos. Os e-mails informados anteriormente continuam privados e pendentes de verificação.</small><p>Este passo ativa o painel local no novo banco. O site público continua no banco anterior até a integração do coletor ser publicada.</p><button>Conectar banco e ativar acessos locais</button><p id="status" role="status"></p></form><script>document.querySelector('form').onsubmit=async event=>{event.preventDefault();const form=event.target,button=form.querySelector('button'),status=document.querySelector('#status');button.disabled=true;status.textContent='Verificando o banco e criando os acessos…';try{const data=Object.fromEntries(new FormData(form));const result=await fetch('/_integracao',{method:'POST',headers:{'Content-Type':'application/json','X-Tuna-Setup':'${nonce}'},body:JSON.stringify(data)});const body=await result.json();status.textContent=body.message;for(const field of form.querySelectorAll('input:not([readonly])'))field.value='';if(result.ok){status.append(document.createElement('br'));const link=document.createElement('a');link.href='/';link.textContent='Abrir painel conectado';status.append(link);}}catch{status.textContent='Não foi possível concluir a configuração. Confira se o servidor continua aberto.';}finally{button.disabled=false;}};</script></html>`,200,'text/html');
 if(req.method!=='POST'||url.pathname!=='/_integracao')return null;
 if(req.headers.get('origin')!==base||req.headers.get('x-tuna-setup')!==nonce)return response({message:'Solicitação recusada.'},403);
 if(process.env.SUPABASE_URL===expected&&process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.TUNA_TEAM_ID)return response({message:'Este banco já foi conectado. Abra o painel para entrar; os acessos existentes foram preservados.'},409);
 if(saving)return response({message:'A configuração já está em andamento.'},409);saving=true;
 try{
  const input=await req.json();
  if(typeof input.publicKey==='string')input.publicKey=input.publicKey.trim();if(typeof input.serverKey==='string')input.serverKey=input.serverKey.trim();
  if(input.serverKey?.startsWith('sb_publishable_'))return response({message:'A chave pública foi colocada no campo privado. Copie a chave da seção Secret keys no Supabase e tente novamente.'},400);
  if(typeof input.serverKey==='string'&&!(/^sb_secret_[A-Za-z0-9_-]+$/.test(input.serverKey)||/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(input.serverKey)))return response({message:'A chave privada está incompleta. Use o botão Copy API key da seção Secret keys; não copie o texto que contém pontos ou asteriscos.'},400);
  if(input.url!==expected||typeof input.publicKey!=='string'||!input.publicKey||typeof input.serverKey!=='string'||!input.serverKey||!['matheusPassword','adrianaPassword'].every(key=>typeof input[key]==='string'&&input[key].length>=6&&input[key].length<=200))return response({message:'Confira as chaves e as duas senhas.'},400);
  const db=createClient(expected,input.serverKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const schema=await db.from('site_clients').select('id').limit(1);if(schema.error){console.error('Local setup database check:',schema.status,schema.error.code||'no_code');return response({message:schema.error.code==='42501'?'A chave informada não tem acesso de servidor. Copie a chave da seção Secret keys no Supabase. Nenhuma conta foi criada.':'O Supabase recusou a conexão. Confira se a chave privada completa pertence ao projeto TunaStream Analytics. Nenhuma conta foi criada.'},400);}
  // Reuse accounts from a previous partial setup instead of resetting passwords.
  const users=await db.auth.admin.listUsers({page:1,perPage:100});if(users.error)throw new Error('setup');
  const verify=result=>{if(result.error)throw new Error('setup');return result.data;};
  const knownTeams=verify(await db.from('teams').select('id').eq('name','TunaStream').limit(2));
  if(knownTeams.length>1)throw new Error('setup');
  const tenant=process.env.SUPABASE_URL===expected&&process.env.TUNA_TEAM_ID?process.env.TUNA_TEAM_ID:knownTeams[0]?.id||randomUUID();
  verify(await db.from('teams').upsert({id:tenant,name:'TunaStream'}));
  for(const [nick,key,avatar]of [['Matheus P','matheusPassword','matheus'],['Adriana S','adrianaPassword','adriana']]){
   const alias=avatar+'@access.tunastream.invalid';let user=users.data.users.find(item=>item.email===alias);
   if(!user)user=verify(await db.auth.admin.createUser({email:alias,password:input[key],email_confirm:true})).user;
   verify(await db.from('team_members').upsert({team_id:tenant,user_id:user.id}));
   verify(await db.from('analytics_users').upsert({username:nick.toLowerCase(),team_id:tenant,user_id:user.id}));
   verify(await db.from('member_profiles').upsert({user_id:user.id,team_id:tenant,display_name:nick,default_avatar:avatar}));
  }
  const preferences=await db.from('report_preferences').select('team_id').eq('team_id',tenant).maybeSingle();verify(preferences);if(!preferences.data)verify(await db.from('report_preferences').insert({team_id:tenant,enabled:false}));
  const integration=await db.from('analytics_integrations').select('source').eq('team_id',tenant);verify(integration);const missing=['website','instagram','whatsapp'].filter(source=>!integration.data.some(row=>row.source===source));if(missing.length)verify(await db.from('analytics_integrations').insert(missing.map(source=>({team_id:tenant,source,status:'pending',mode:source==='whatsapp'?'manual':'api'}))));
  const existing=process.env.SUPABASE_URL===expected;
  const settings={SUPABASE_URL:expected,SUPABASE_ANON_KEY:input.publicKey,SUPABASE_SERVICE_ROLE_KEY:input.serverKey,TUNA_TEAM_ID:tenant,TUNA_ALLOWED_ORIGINS:base+',https://tunastream-ofc.lovable.app',TUNA_LOCAL_PORT:String(new URL(base).port),TUNA_PANEL_URL:base+'/',TUNA_RATE_SECRET:existing&&process.env.TUNA_RATE_SECRET||randomBytes(32).toString('hex'),WHATSAPP_CONTACT_HASH_SECRET:existing&&process.env.WHATSAPP_CONTACT_HASH_SECRET||randomBytes(32).toString('hex'),TUNA_CRON_SECRET:existing&&process.env.TUNA_CRON_SECRET||randomBytes(32).toString('hex')};
  const serialize=values=>Object.entries(values).map(([key,value])=>key+'='+JSON.stringify(value)).join('\n')+'\n';
  await writeFile(resolve(root,'.env.server.local'),serialize(settings),{mode:0o600});
  const publicSettings={VITE_SUPABASE_URL:expected,VITE_SUPABASE_PUBLISHABLE_KEY:input.publicKey,VITE_REQUIRE_AUTH:'true',VITE_LIVE_READ_ONLY:'false',VITE_ALLOW_LOCAL_DEMO:'true',VITE_LOCAL_HISTORY_LINK:'true'};
  await writeFile(resolve(root,'.env.local'),serialize(publicSettings),{mode:0o600});
  Object.assign(process.env,settings);process.env.TUNA_REMOTE_READ_ONLY_ORIGIN='';
  const {publishSnapshots}=await import('./.generated/initialize.js');await publishSnapshots();
  // Passwords are not written to disk or emitted by the build process.
  await execute(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,maxBuffer:1024*1024,windowsHide:true});
  return response({message:'Banco conectado e dois acessos criados. O painel local está pronto. A coleta do site público e a autorização do Instagram ainda precisam ser ativadas.'});
 }catch{return response({message:'Não foi possível concluir. Confira se as chaves pertencem ao projeto TunaStream Analytics e tente novamente. Se alguma conta já foi criada, ela será preservada.'},503);}finally{saving=false;}
}
