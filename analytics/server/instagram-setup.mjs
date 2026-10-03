// Credential entry stays on the loopback server; it is never included in frontend builds.
import {randomBytes} from 'node:crypto';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createClient} from '@supabase/supabase-js';
const nonce=randomBytes(32).toString('hex'),expected='https://fundfokaxkmgvdrpwyot.supabase.co';
const callback=expected+'/functions/v1/tuna-instagram-callback';
let saving=false;
const response=(body,status=200,type='application/json')=>new Response(typeof body==='string'?body:JSON.stringify(body),{status,headers:{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
export async function instagramSetup(req,root,base){
 if(new URL(req.url).pathname!=='/_integracao/instagram')return null;
 if(req.method==='GET')return response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conectar Instagram · TunaStream</title><style>body{background:#0c0911;color:#eee;font:16px system-ui;max-width:640px;margin:40px auto;padding:20px}p{line-height:1.65}label{display:block;margin:24px 0}input{width:100%;box-sizing:border-box;background:#21182d;color:white;padding:12px;border:1px solid #614080;border-radius:8px}button{background:#9b54e7;color:white;padding:14px;border:0;border-radius:8px}a{color:#d4a7ff}code{overflow-wrap:anywhere}</style><h1>Preparar a conexão do Instagram</h1><p>Aplicativo: <strong>TunaStream Analytics-IG</strong> · ID <code>1098888089403799</code>.</p><p>Na Meta, copie a <strong>Chave secreta do app do Instagram</strong>. Ela fica salva apenas no servidor local, em arquivo ignorado pelo Git. As chaves do coletor são protegidas no Vault do seu Supabase para que a coleta possa funcionar sem este computador ligado.</p><form><label>Chave secreta do app do Instagram<input name="secret" type="password" required autocomplete="off" minlength="32" maxlength="32"></label><p>Versão verificada na documentação: v26.0. Retorno HTTPS: <code>${callback}</code>.</p><p>Este passo prepara a integração. Depois você autoriza o perfil profissional <strong>tuna.stream</strong> pelo botão do painel. Nenhuma senha do Instagram é solicitada aqui.</p><button>Salvar configuração privada</button><p id="status" role="status"></p></form><script>document.querySelector('form').onsubmit=async event=>{event.preventDefault();const button=event.target.querySelector('button'),status=document.querySelector('#status');button.disabled=true;try{const input=event.target.elements.secret,result=await fetch('/_integracao/instagram',{method:'POST',headers:{'Content-Type':'application/json','X-Tuna-Setup':'${nonce}'},body:JSON.stringify({secret:input.value})});input.value='';const data=await result.json();status.textContent=data.message;if(result.ok){const link=document.createElement('a');link.href='/';link.textContent='Abrir painel para autorizar Instagram';status.append(document.createElement('br'),link);}}catch{status.textContent='Não foi possível salvar. Confira se o servidor continua aberto.';}finally{button.disabled=false;}};</script></html>`,200,'text/html');
 if(req.method!=='POST')return response({message:'Método recusado.'},405);
 if(req.headers.get('origin')!==base||req.headers.get('x-tuna-setup')!==nonce)return response({message:'Solicitação recusada.'},403);
 if(saving)return response({message:'Configuração em andamento.'},409);
 saving=true;
 try{
  if(process.env.SUPABASE_URL!==expected||!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.TUNA_TEAM_ID)throw new Error('database_not_connected');
  const input=await req.json();if(typeof input.secret!=='string'||! /^[a-f0-9]{32}$/i.test(input.secret.trim()))return response({message:'Copie a chave secreta completa do aplicativo Instagram.'},400);
  const db=createClient(expected,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const prior=await db.rpc('analytics_instagram_runtime');if(prior.error)throw new Error('runtime_not_installed');
  const settings={TUNA_TEAM_ID:process.env.TUNA_TEAM_ID,META_GRAPH_VERSION:'v26.0',INSTAGRAM_TOKEN_ENCRYPTION_KEY:prior.data?.INSTAGRAM_TOKEN_ENCRYPTION_KEY||process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY||randomBytes(32).toString('hex'),INSTAGRAM_CRON_SECRET:prior.data?.INSTAGRAM_CRON_SECRET||process.env.INSTAGRAM_CRON_SECRET||randomBytes(32).toString('hex'),TUNA_RATE_SECRET:process.env.TUNA_RATE_SECRET,TUNA_PANEL_URL:base+'/'};
  const saved=await db.rpc('analytics_set_instagram_runtime',{settings});if(saved.error)throw new Error('runtime_save_failed');
  const values={...settings,INSTAGRAM_APP_ID:'1098888089403799',INSTAGRAM_APP_SECRET:input.secret.trim(),INSTAGRAM_REDIRECT_URI:callback};
  // Preserve every existing setting and write the private file atomically.
  const path=resolve(root,'.env.server.local'),old=await readFile(path,'utf8');
  const preserved=old.split(/\r?\n/).filter(line=>!Object.keys(values).some(key=>line.startsWith(key+'='))).filter(Boolean);
  const text=[...preserved,...Object.entries(values).map(([key,value])=>key+'='+JSON.stringify(value))].join('\n')+'\n';
  const pending=path+'.pending';await writeFile(pending,text,{mode:0o600});await rename(pending,path);Object.assign(process.env,values);
  return response({message:'Configuração privada salva. Abra Integrações no painel e autorize tuna.stream. A coleta automática só ficará ativa após essa autorização e a primeira coleta válida.'});
 }catch{return response({message:'Não foi possível salvar a configuração privada. O servidor e o banco precisam estar conectados.'},503);}finally{saving=false;}
}
