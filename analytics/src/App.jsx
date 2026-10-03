import {launch} from './lib/launch.js';
import {useProfiles} from './hooks/useProfiles.js';
import { useMemo,useState } from 'react';
import Shell from './components/Shell.jsx';
import ReportDialog from './components/ReportDialog.jsx';
import AuthGate from './components/AuthGate.jsx';
import { Panel } from './components/Metrics.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Website from './pages/Website.jsx';
import InstagramPage from './pages/Instagram.jsx';
import WhatsAppPage from './pages/WhatsApp.jsx';
import TeamAccess from './pages/TeamAccess.jsx';
import Reports from './pages/Reports.jsx';
import Integrations from './pages/Integrations.jsx';
import { getDemoSnapshot,periods } from './data.js';
import { demoLeads,isQuoteStage } from './whatsapp.js';
import { useTeamSnapshot } from './hooks/useTeamSnapshot.js';
import { normalizeMetrics } from './metrics.js';
import { getPreviousCompleteWeek } from './report.js';
import {useTeamOperations} from './hooks/useTeamOperations.js';
import {summarizeSales} from './sales.js';

function livePeriods(){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const date=type=>parts.find(part=>part.type===type).value;
 const latest=getPreviousCompleteWeek(date('year')+'-'+date('month')+'-'+date('day'));
 const previous=getPreviousCompleteWeek(latest.start);
 const start=new Date(latest.start+'T12:00:00Z');start.setUTCDate(start.getUTCDate()+7);const end=new Date(start);end.setUTCDate(end.getUTCDate()+6);
 const current={start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10),id:'current-week',label:'Esta semana · em andamento'};
 return [current,...[latest,previous].map((period,index)=>({...period,id:index?'previous-week':'last-week',label:period.start.split('-').reverse().join('/')+' a '+period.end.split('-').reverse().join('/')}))];
}
function Workspace({session,demo}){
 const readOnly=!demo&&import.meta.env.VITE_LIVE_READ_ONLY==='true';
 const [page,setPage]=useState(launch.reference?'whatsapp':launch.code||launch.oauthError?'integrations':'overview'),[periodId,setPeriodId]=useState(demo?'last-week':'current-week'),[reportOpen,setReportOpen]=useState(false),[operationError,setOperationError]=useState('');
 const [leadPeriods,setLeadPeriods]=useState({});
 const options=useMemo(()=>demo?periods:livePeriods(),[demo]);
 const period=options.find(option=>option.id===periodId);
 const remote=useTeamSnapshot(session,period);
 const operations=useTeamOperations(session,period);
 const account=useProfiles(session,demo);
 const initialLeads=useMemo(()=>demoLeads().map(lead=>({...lead,hasRequestedQuote:isQuoteStage(lead.stage),hasSentQuote:['quote_sent','won'].includes(lead.stage),wasWon:lead.stage==='won'})),[]);
 const leads=leadPeriods[periodId]||initialLeads;
 const count=(items,filter)=>items.filter(filter).length;
 const base=getDemoSnapshot(periodId);
 const demoSales=summarizeSales(leads);
 const snapshot=demo?{...base,current:{...base.current,websiteReceivedContacts:leads.length,quoteRequests:count(leads,lead=>lead.hasRequestedQuote),websiteQuoteRequests:count(leads,lead=>lead.hasRequestedQuote),quoteSent:count(leads,lead=>lead.hasSentQuote),closed:demoSales.won,uniqueClients:demoSales.clients,buyingClients:demoSales.buyers,sales:demoSales}}:remote.snapshot?{...remote.snapshot,current:normalizeMetrics(remote.snapshot.current),previous:normalizeMetrics(remote.snapshot.previous)}:null;
 function navigate(next){setPage(next);window.scrollTo({top:0,behavior:'instant'});}
 async function changeStage(id,stage){
  if(!demo){setOperationError('');try{await operations.changeStage(id,stage);await remote.refresh();}catch(error){setOperationError(error.message);}return;}
  setLeadPeriods(current=>({...current,[periodId]:(current[periodId]||initialLeads).map(lead=>lead.id===id?{...lead,stage,hasRequestedQuote:lead.hasRequestedQuote||isQuoteStage(stage),hasSentQuote:lead.hasSentQuote||['quote_sent','won'].includes(stage),wasWon:lead.wasWon||stage==='won'}:lead)}));
 }
 async function confirmLink(input){
  if(!demo){await operations.confirmLink(input);await remote.refresh();return;}
  setLeadPeriods(current=>({...current,[periodId]:[...(current[periodId]||initialLeads),{id:input.reference,reference:input.reference,package:input.reference.split('-')[1],stage:input.quote?'quote_requested':'new',source:'Site',received:'Agora · exemplo',hasRequestedQuote:input.quote,hasSentQuote:false,wasWon:false}].filter((lead,index,all)=>all.findIndex(other=>other.reference===lead.reference)===index)}));
 }
 async function changePackage(id,pack){if(!demo){await operations.changePackage(id,pack);return;}setLeadPeriods(current=>({...current,[periodId]:(current[periodId]||initialLeads).map(lead=>lead.id===id?{...lead,selected_package:pack}:lead)}));}
 async function saveClient(id,details){
  if(!demo){await operations.saveClient(id,details);await remote.refresh();return;}
  // Demonstration has no phone hash, persistence or real client identity.
  setLeadPeriods(current=>({...current,[periodId]:(current[periodId]||initialLeads).map(lead=>lead.id===id?{...lead,client_id:lead.client_id||(details.phone?'demo-'+id:null),client_label:details.clientLabel,service_category:details.service,selected_package:details.package,custom_package_name:details.package==='CUSTOM'?details.customPackageName:null,customer_state:details.state,customer_city:details.city}:lead)}));
 }
 const pages={
 overview:snapshot&&<Dashboard snapshot={snapshot} onInsights={()=>navigate('reports')}/>,
 website:snapshot&&<Website snapshot={snapshot}/>,
 instagram:snapshot&&<InstagramPage snapshot={snapshot}/>,
 whatsapp:snapshot&&<WhatsAppPage snapshot={snapshot} leads={demo?leads:operations.leads} onStageChange={changeStage} onConfirm={async input=>{await operations.confirmContact(input);await remote.refresh();}} busy={operations.busy} reference={launch.reference} onConfirmLink={confirmLink} onPackageChange={changePackage} onClientSave={saveClient} readOnly={readOnly} crmAvailable={demo||operations.crmAvailable}/>,
 reports:snapshot&&<Reports snapshot={snapshot} operations={operations} onReportOpen={()=>setReportOpen(true)}/>,
 integrations:<Integrations operations={operations} demo={demo}/>,
 access:<TeamAccess session={session} demo={demo} account={account}/>,
 };
 return <>
 <Shell profiles={account.profiles} userId={session?.user.id} page={page} onPageChange={navigate} periodId={periodId} periods={options} onPeriodChange={setPeriodId} onReportOpen={()=>setReportOpen(true)} reportAvailable={Boolean(snapshot)} demo={demo} readOnly={readOnly} updatedAt={remote.updatedAt} sourceUpdatedAt={snapshot&&!demo?(snapshot.current.sourceUpdatedAt||{}):null} onRefresh={remote.refresh}>
 {pages[page]||<Panel title={remote.loading?'Carregando métricas':'Dados da equipe'}><p className="empty-explanation" role={remote.error?'alert':'status'}>{remote.error||(remote.loading?'Buscando as informações autorizadas para sua conta…':'O acesso foi verificado. Ainda não há coleta publicada para este período.')}</p><div className="button-row overview-packages"><button className="button secondary" onClick={remote.refresh}>Tentar atualizar</button><button className="button secondary" onClick={()=>navigate('access')}>Ver meu acesso</button></div></Panel>}
 {!demo&&snapshot?.current.sourceCoverage?.website==='partial'&&<p className="panel-note">Coleta parcial do site: este período está em andamento ou começou antes da instalação. Os números representam somente as visitas medidas.</p>}
 {operationError&&<p className="auth-error" role="alert">{operationError}</p>}
 {!demo&&operations.deliveries.some(r=>['failed','uncertain'].includes(r.status))&&<div className="demo-banner" role="alert"><p>Há um envio de relatório que precisa de atenção. <button onClick={()=>navigate('reports')}>Ver histórico de entrega</button></p></div>}
 </Shell>
 {snapshot&&reportOpen&&<ReportDialog open={reportOpen} onClose={()=>setReportOpen(false)} snapshot={snapshot}/>}
 </>;
}
export default function App(){return <AuthGate>{access=><Workspace key={access.session?.user.id||'demo'} {...access}/>}</AuthGate>;}
