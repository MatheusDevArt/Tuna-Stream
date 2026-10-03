import {admin,body,check,cors,endpoint,json,rate,team,uuid,env,configureRuntime} from '../_shared/server.ts';
import {loadInstagramRuntime} from '../_shared/instagram-runtime.ts';
import {publishSnapshots} from '../_shared/snapshots.ts';
const sources=new Set(['Instagram','Direto','Google','WhatsApp','Outros']);
const packages=new Set(['START','LIVE','STREAMER','COMBOS','CUSTOM','GENERAL']);
const labels:Record<string,Set<string>>={section:new Set(['Início','Configuração','Design','Trabalhos','Pacotes','FAQ','Personalizado']),scroll:new Set(['25%','50%','75%','100%']),package:packages,whatsapp:packages,heartbeat:new Set(['active']),performance:new Set(['LCP','INP','CLS']),error:new Set(['javascript']),click:new Set(['whatsapp','instagram','navigation','service_tab','package_tab','portfolio','faq','other_button','other_link'])};
export default endpoint(async req=>{
 if(!env('TUNA_TEAM_ID',false)){await loadInstagramRuntime();configureRuntime({TUNA_ALLOWED_ORIGINS:'https://tunastream-ofc.lovable.app,https://tuna-stream-esquenta.matheusdevart.chatgpt.site,'+env('TUNA_PANEL_URL')});}
 const headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 await rate(req,'collect',120,60);const input=await body(req),db=admin(),tenant=team();
 if(input.action==='intent'){
  if(!packages.has(input.package))throw new Error('invalid_input');
  let session=null;
  if(uuid(input.session_id))session=check(await db.from('site_sessions').select('id,source').eq('team_id',tenant).eq('id',input.session_id).maybeSingle());
  const service=['configuration','personalization','both'].includes(input.service)?input.service:'unknown',alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let attempt=0;attempt<8;attempt++){
   const reference=Array.from(crypto.getRandomValues(new Uint8Array(5)),v=>alphabet[v%32]).join('');
   const result=await db.from('whatsapp_intents').insert({reference,team_id:tenant,package:input.package,service_category:service,source:session?.source||'Não identificada',session_id:session?.id||null});
   if(!result.error)return json({reference},200,headers);
   if(result.error.code!=='23505')throw new Error('database_error');
  }
  throw new Error('database_error');
 }
 if(!uuid(input.session_id)||!uuid(input.visitor_id)||!Array.isArray(input.events)||input.events.length>20)throw new Error('invalid_input');
 const events:Array<{kind:string;value:number|null;id:string;team_id:string;session_id:string;label:string;context:string|null}>=input.events.map((event:Record<string,unknown>)=>{
  const kind=String(event.kind),label=String(event.label);if(!uuid(event.id)||!labels[kind]?.has(label))throw new Error('invalid_input');
  const value=typeof event.value==='number'&&Number.isFinite(event.value)?Math.max(0,Math.min(86400,event.value)):null;
  return {id:String(event.id),team_id:tenant,session_id:input.session_id,kind,label,value,context:labels.section.has(String(event.context))?String(event.context):null};
 });
 const existing=check(await db.from('site_sessions').select('visitor_id,created_at,active_seconds').eq('id',input.session_id).eq('team_id',tenant).maybeSingle());
 if(existing&&existing.visitor_id!==input.visitor_id)throw new Error('invalid_input');
 if(!existing){
  check(await db.from('site_visitors').upsert({team_id:tenant,visitor_id:input.visitor_id},{onConflict:'team_id,visitor_id',ignoreDuplicates:true}));
  const visitor=check(await db.from('site_visitors').select('first_seen_at').eq('team_id',tenant).eq('visitor_id',input.visitor_id).single()),ua=req.headers.get('user-agent')||'';
  if(!visitor)throw new Error('database_error');
  const browser=/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Outros';
  const operating_system=/Android/.test(ua)?'Android':/iPhone|iPad/.test(ua)?'iOS':/Windows/.test(ua)?'Windows':/Macintosh/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'Outros';
  const page=['/','/index.html','/tuna-stream/index.html'].includes(input.page)?input.page:'/';
  const trusted=env('TUNA_TRUST_PLATFORM_GEO',false)==='true',region=trusted?req.headers.get('x-tuna-region')||'':'',state_code=/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(region)?region:null;
  const rawCountry=trusted?req.headers.get('x-tuna-country')||'':'',country_code=/^[A-Z]{2}$/.test(rawCountry)&&!['XX','T1'].includes(rawCountry)?rawCountry:null;
  const city=trusted?(req.headers.get('x-tuna-city')||'').normalize('NFKC').replace(/[<>\u0000-\u001f]/g,'').slice(0,80)||null:null;
  check(await db.from('site_sessions').insert({id:input.session_id,team_id:tenant,visitor_id:input.visitor_id,first_seen_at:visitor.first_seen_at,source:sources.has(input.source)?input.source:'Outros',device:['Celular','Computador','Tablet'].includes(input.device)?input.device:'Computador',browser,operating_system,page,state_code,country_code,city,tracking_mode:input.tracking_mode==='anonymous'?'anonymous':'consented'}));
 }
 check(await db.from('site_events').upsert(events,{onConflict:'id',ignoreDuplicates:true}));
 const elapsed=existing?Math.ceil((Date.now()-new Date(existing.created_at).getTime())/1000):0;
 const seconds=Math.max(existing?.active_seconds||0,...events.filter(e=>e.kind==='heartbeat').map(e=>Math.min(e.value||0,elapsed)));
 check(await db.from('site_sessions').update({last_seen_at:new Date().toISOString(),active_seconds:seconds}).eq('id',input.session_id).eq('team_id',tenant));
 check(await db.from('analytics_integrations').upsert({team_id:tenant,source:'website',status:'ready',last_success_at:new Date().toISOString(),error_code:null}));
 if(check(await db.rpc('analytics_take_rate',{bucket_key:'website-snapshot:'+tenant,max_hits:1,lifetime:60})))await publishSnapshots();
 return json({accepted:true},200,headers);
});
