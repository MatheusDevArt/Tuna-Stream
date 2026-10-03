// Local/standalone Node host. Original endpoints keep their Request/Response contract.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnvFile} from 'node:process';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['.env.server.local','.env.accounts.local'])try{loadEnvFile(resolve(root,file));}catch(error){if(error.code!=='ENOENT')throw error;}
const handlers=new Map();let current;
globalThis.Deno={env:{get:name=>process.env[name]},serve:handler=>handlers.set(current,handler)};
for(const name of ['tuna-login','tuna-collect','tuna-team','tuna-report','tuna-sync','tuna-webhook','tuna-account','tuna-instagram']){current=name;await import(new URL('./.generated/'+name+'.js',import.meta.url));}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.woff':'font/woff'};
const port=Number(process.env.TUNA_LOCAL_PORT||4182),base='http://127.0.0.1:'+port;
createServer(async (req,res)=>{
 try{
  const url=new URL(req.url,base),name=url.pathname.match(/^\/api\/public\/(tuna-[a-z]+)$/)?.[1];
  if(name&&handlers.has(name)){
   let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>4500000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
   // Do not trust forwarded client IP supplied directly to this local server.
   headers.delete('x-forwarded-for');headers.set('x-real-ip',req.socket.remoteAddress||'unknown');
   const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const response=await handlers.get(name)(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(url.pathname.startsWith('/api/')){res.writeHead(404);res.end();return;}
  const relative=decodeURIComponent(url.pathname).replace(/^\/painel(?:\/|$)/,'/').replace(/^\/+/,''),dist=resolve(root,'dist');
  let path=resolve(dist,relative||'index.html');
  if(path!==dist&&!path.startsWith(dist+sep)){res.writeHead(403);res.end();return;}
  if(relative.startsWith('.')||relative.includes('/.')){res.writeHead(404);res.end();return;}
  try{if(!(await stat(path)).isFile())path=resolve(dist,'index.html');}catch{path=resolve(dist,'index.html');}
  const ext=path.slice(path.lastIndexOf('.'));res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':ext==='.html'?'no-store':'public, max-age=300'});res.end(await readFile(path));
 }catch{res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'service_unavailable'}));}
}).listen(port,'127.0.0.1',()=>console.log('Local TunaStream host: '+base));
