// Local/standalone Node host. Original endpoints keep their Request/Response contract.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnvFile} from 'node:process';
import {setupRoute} from './setup.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['.env.server.local','.env.accounts.local'])try{loadEnvFile(resolve(root,file));}catch(error){if(error.code!=='ENOENT')throw error;}
const handlers=new Map();let current;
globalThis.Deno={env:{get:name=>process.env[name],set:(name,value)=>{process.env[name]=value;}},serve:handler=>handlers.set(current,handler)};
for(const name of ['tuna-login','tuna-collect','tuna-team','tuna-report','tuna-sync','tuna-webhook','tuna-account','tuna-instagram','tuna-instagram-sync']){current=name;await import(new URL('./.generated/'+name+'.js',import.meta.url));}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.woff':'font/woff'};
const port=Number(process.env.TUNA_LOCAL_PORT||4182),base='http://127.0.0.1:'+port;
async function bridge(req,name){
 const origin=req.headers.get('origin');
 if(![base,'http://localhost:'+port].includes(origin))return new Response(JSON.stringify({error:'origin_denied'}),{status:403,headers:{'Content-Type':'application/json'}});
 const raw=await req.text();let input;try{input=JSON.parse(raw);}catch{return new Response('{}',{status:400});}
 const allowed=name==='tuna-login'||name==='tuna-report'&&input.action==='status';
 if(!allowed)return new Response(JSON.stringify({error:'read_only_mode'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const remote=new URL('https://tunastream-ofc.lovable.app');
 const response=await fetch(new URL('/api/public/'+name,remote),{method:'POST',headers:{'Content-Type':'application/json',Origin:remote.origin,...(req.headers.get('authorization')?{Authorization:req.headers.get('authorization')}:{})},body:raw,signal:AbortSignal.timeout(90000),redirect:'error'});
 return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
createServer(async (req,res)=>{
 try{
  const url=new URL(req.url,base),name=url.pathname.match(/^\/api\/(?:public|old)\/(tuna-[a-z]+)$/)?.[1];
  if(url.pathname.startsWith('/_integracao')){
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>20000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),response=await setupRoute(request,root,base);
   if(!response){res.writeHead(404);res.end();return;}const payload=Buffer.from(await response.arrayBuffer());res.writeHead(response.status,Object.fromEntries(response.headers));res.end(payload);return;
  }
  if(name&&handlers.has(name)){
   let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>4500000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
   // Do not trust forwarded client IP supplied directly to this local server.
   headers.delete('x-forwarded-for');headers.set('x-real-ip',req.socket.remoteAddress||'unknown');
   const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const response=process.env.TUNA_REMOTE_READ_ONLY_ORIGIN||url.pathname.startsWith('/api/old/')?await bridge(request,name):await handlers.get(name)(request);const payload=Buffer.from(await response.arrayBuffer());res.writeHead(response.status,Object.fromEntries(response.headers));res.end(payload);return;
  }
  if(url.pathname.startsWith('/api/')){res.writeHead(404);res.end();return;}
  const historical=url.pathname.startsWith('/historico/'),relative=decodeURIComponent(url.pathname).replace(historical?/^\/historico\//:/^\/painel(?:\/|$)/,'/').replace(/^\/+/,''),dist=resolve(root,historical?'.cloud-dist':'dist');
  let path=resolve(dist,relative||'index.html');
  if(path!==dist&&!path.startsWith(dist+sep)){res.writeHead(403);res.end();return;}
  if(relative.startsWith('.')||relative.includes('/.')){res.writeHead(404);res.end();return;}
  try{if(!(await stat(path)).isFile())path=resolve(dist,'index.html');}catch{path=resolve(dist,'index.html');}
  const ext=path.slice(path.lastIndexOf('.')),payload=await readFile(path);res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':ext==='.html'?'no-store':'public, max-age=300'});res.end(payload);
 }catch{if(res.headersSent){res.destroy();return;}res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'service_unavailable'}));}
}).listen(port,'127.0.0.1',()=>console.log('Local TunaStream host: '+base));
let publishing=false;
async function refreshLocal(){
 if(publishing||process.env.TUNA_REMOTE_READ_ONLY_ORIGIN||!process.env.SUPABASE_SERVICE_ROLE_KEY)return;
 publishing=true;try{const {publishSnapshots}=await import('./.generated/initialize.js');await publishSnapshots();}catch{console.error('A leitura do banco local precisa de atenção.');}finally{publishing=false;}
}
refreshLocal();setInterval(refreshLocal,60000);
