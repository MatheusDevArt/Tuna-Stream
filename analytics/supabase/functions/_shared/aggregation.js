import {localDay,addDays,windows,periodDays,analysisWindows,previousWindow} from '../../../src/periods.js';
export {localDay,addDays,windows,analysisWindows,previousWindow};
const num=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
export const bounds=period=>({start:period.start+'T00:00:00-03:00',end:addDays(period.end,1)+'T00:00:00-03:00'});
const unique=items=>new Set(items).size;
const group=(rows,key)=>{const result={};for(const row of rows){const value=key(row);if(value)result[value]=(result[value]||0)+1;}return Object.entries(result).sort((a,b)=>b[1]-a[1]);};
const percentages=(rows,total)=>rows.map(([label,n])=>[label,total?Math.round(n/total*1000)/10:0]);
/** @param {{sessions?:any[],events?:any[],opportunities?:any[],receipts?:any[],integrations?:any[],instagram?:Record<string,any>|null,media?:any[],period:{start:string,end:string}}} input */
export function aggregate({sessions=[],events=[],opportunities=[],receipts=[],integrations=[],instagram=null,media=[],period}){
 opportunities=opportunities.filter(o=>!o.archived_at);
 const integration=source=>integrations.find(i=>i.source===source);
 const ready=source=>{const info=integration(source);return Boolean(info?.last_success_at&&localDay(info.first_success_at||info.last_success_at)<=period.end);};
 const visits=sessions.length,count=(kind,label)=>events.filter(e=>e.kind===kind&&(!label||e.label===label));
 const eligible=opportunities.filter(o=>o.attributed&&o.origin!=='manual'),contactSet=new Set(eligible.map(o=>o.contact_hash));
 const attributable=receipts.filter(r=>r.opportunity_id).map(r=>eligible.find(o=>o.id===r.opportunity_id)?.contact_hash).filter(Boolean);
 const contacts=ready('whatsapp')||attributable.length?unique(attributable):null;
 const anonymous=sessions.some(s=>s.tracking_mode==='anonymous');
 const states={};for(const [state,n]of group(sessions.filter(s=>s.state_code),s=>s.state_code))states[state]=n;
 // A visitor may appear in different states. Assign their first known state within the period.
 const stateVisitors={},assigned=new Set();for(const s of sessions){if(s.state_code&&!assigned.has(s.visitor_id)){assigned.add(s.visitor_id);stateVisitors[s.state_code]=(stateVisitors[s.state_code]||0)+1;}}
 const firstDay=integration('website')?.first_success_at?localDay(integration('website').first_success_at):null;
 const dayCount=periodDays(period),daily=Array.from({length:dayCount},(_,i)=>addDays(period.start,i)>localDay(new Date())||!firstDay||addDays(period.start,i)<firstDay?null:0);for(const s of sessions){const i=Math.round((new Date(localDay(s.created_at)+'T12:00:00Z')-new Date(period.start+'T12:00:00Z'))/86400000);if(i>=0&&i<dayCount)daily[i]=(daily[i]||0)+1;}
 const sourceCounts=group(sessions,s=>s.source),durationGroups=group(sessions,s=>s.active_seconds<10?'Menos de 10s':s.active_seconds<30?'10–30s':s.active_seconds<60?'30–60s':s.active_seconds<180?'1–3min':'3min ou mais');
 const sectionNames=['Início','Configuração','Design','Trabalhos','Pacotes','FAQ','Personalizado'];
 const sectionRows=sectionNames.map(label=>[label,unique(count('section',label).map(e=>e.session_id))]);
 const engaged=sessions.filter(s=>s.active_seconds>=10||events.filter(e=>e.session_id===s.id&&e.kind==='section').length>=2).length;
 const packs=['START','LIVE','STREAMER','COMBOS','CUSTOM','GENERAL'].map(name=>({name:({CUSTOM:'Personalizado',GENERAL:'Contato'})[name]||name,clicks:count('package',name).length,whatsapp:count('whatsapp',name).length}));
 const website=ready('website')?{
  visits,uniqueVisitors:anonymous?null:unique(sessions.map(s=>s.visitor_id)),newVisitors:anonymous?null:unique(sessions.filter(s=>s.first_seen_at&&localDay(s.first_seen_at)>=period.start).map(s=>s.visitor_id)),returningVisitors:anonymous?null:unique(sessions.filter(s=>s.first_seen_at&&localDay(s.first_seen_at)<period.start).map(s=>s.visitor_id)),
  averageDuration:visits?sessions.reduce((a,s)=>a+s.active_seconds,0)/visits:0,engagementRate:visits?engaged/visits*100:0,bounceRate:visits?(visits-engaged)/visits*100:0,
  packagesReached:sectionRows.find(r=>r[0]==='Pacotes')[1],packageClicks:count('package').length,whatsappClicks:count('whatsapp').length,
  packageSessions:unique(count('package').map(e=>e.session_id)),whatsappSessions:unique(count('whatsapp').map(e=>e.session_id)),
  dailyVisits:daily,sources:percentages(sourceCounts,visits),sourceCounts,instagramVisits:sessions.filter(s=>s.source==='Instagram').length,devices:percentages(group(sessions,s=>s.device),visits),durations:percentages(durationGroups,visits),browsers:percentages(group(sessions,s=>s.browser),visits),operatingSystems:percentages(group(sessions,s=>s.operating_system),visits),pages:group(sessions,s=>s.page),buttonClicks:group(count('click'),e=>e.label),
  sections:sectionRows,scroll:['25%','50%','75%','100%'].map(label=>[label,unique(count('scroll',label).map(e=>e.session_id))]),packages:packs,
  stateVisitors:states,regions:percentages(Object.entries(states).sort((a,b)=>b[1]-a[1]),visits),geoLocatedVisitors:sessions.filter(s=>s.state_code).length,geoUniqueVisitors:visits,geographyUnit:'visitas',geographySource:'Localização aproximada da conexão',countries:group(sessions,s=>s.country_code==='BR'?'Brasil':s.country_code),cities:group(sessions.filter(s=>s.country_code==='BR'),s=>s.city),anonymousVisits:sessions.filter(s=>s.tracking_mode==='anonymous').length,
  topSource:sourceCounts[0]?.[0]||null,topRegion:Object.entries(stateVisitors).sort((a,b)=>b[1]-a[1])[0]?.[0]||null,
  topSection:[...sectionRows].filter(r=>r[0]!=='Início'&&r[1]>0).sort((a,b)=>b[1]-a[1])[0]?.[0]||null,topPackage:[...packs].filter(p=>p.clicks>0).sort((a,b)=>b.clicks-a.clicks)[0]?.name||null,
  peakDay:visits?new Date(addDays(period.start,daily.indexOf(Math.max(...daily)))+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long'}):null,
  peakTime:group(sessions,s=>new Date(s.created_at).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit'})+'h')[0]?.[0]||null,
  webVitals:['LCP','INP','CLS'].map(label=>{const values=count('performance',label).map(e=>e.value).filter(Number.isFinite).sort((a,b)=>a-b);return [label,values.length?num.format(values[Math.min(values.length-1,Math.floor(values.length*.75))])+(label==='CLS'?'':'ms'):'Não disponível'];}),jsErrors:count('error').length,
 }:{};
 const quotes=field=>ready('whatsapp')||eligible.length?unique(eligible.filter(o=>o[field]).map(o=>o.contact_hash)):null;
 return {...website,...(instagram||{}),websiteReceivedContacts:contacts,websiteQuoteRequests:quotes('requested_at'),quoteSent:quotes('sent_at'),closed:quotes('won_at'),
  media:media.map(r=>({...r.metrics,publishedAt:r.published_at,collectedAt:r.metrics.collectedAt||r.collected_at,expired:r.metrics.channel==='stories'&&new Date(r.published_at).getTime()+86400000<Date.now()})),posts:media.map(r=>r.metrics),
  sourceUpdatedAt:Object.fromEntries(integrations.map(i=>[i.source,i.last_success_at])),
  sourceHealth:Object.fromEntries(integrations.map(i=>[i.source,{status:i.status,mode:i.mode,lastAttemptAt:i.last_attempt_at,lastErrorAt:i.last_error_at,errorCode:i.error_code}])),
  sourceCoverage:Object.fromEntries(integrations.map(i=>[i.source,i.source==='whatsapp'&&i.mode==='manual'?'manual':i.source==='instagram'&&instagram?instagram.instagramSource?.coverage||'api':!i.first_success_at?'unavailable':localDay(i.first_success_at)>period.end?'unavailable':new Date(i.first_success_at)>new Date(bounds(period).start)||period.end>=localDay(new Date())?'partial':'complete'])),
  measurementNotes:{contacts:'Recebimentos confirmados. Com telefone, deduplicação por identificador protegido; sem telefone, deduplicação por referência. A mesma pessoa pode ter várias referências.',quotes:'Contatos atribuídos recebidos no período, com solicitação confirmada no histórico.',geography:'Localização aproximada; visitantes sem estado identificado não são distribuídos no mapa.'}
 };
}
