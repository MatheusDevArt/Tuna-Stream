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
 const [page,setPage]=useState('overview'),[periodId,setPeriodId]=useState(demo?'last-week':'current-week'),[reportOpen,setReportOpen]=useState(false),[operationError,setOperationError]=useState('');
 const [leadPeriods,setLeadPeriods]=useState({});
 const options=useMemo(()=>demo?periods:livePeriods(),[demo]);
 const period=options.find(option=>option.id===periodId);
 const remote=useTeamSnapshot(session,period);
 const operations=useTeamOperations(session,period);
 const initialLeads=useMemo(()=>demoLeads().map(lead=>({...lead,hasRequestedQuote:isQuoteStage(lead.stage),hasSentQuote:['quote_sent','won'].includes(lead.stage),wasWon:lead.stage==='won'})),[]);
 const leads=leadPeriods[periodId]||initialLeads;
 const count=(items,filter)=>items.filter(filter).length;
 const base=getDemoSnapshot(periodId);
 const deltaQuote=count(leads,lead=>lead.hasRequestedQuote)-count(initialLeads,lead=>lead.hasRequestedQuote);
 const deltaSent=count(leads,lead=>lead.hasSentQuote)-count(initialLeads,lead=>lead.hasSentQuote);
 const deltaClosed=count(leads,lead=>lead.wasWon)-count(initialLeads,lead=>lead.wasWon);
 const snapshot=demo?{...base,current:{...base.current,quoteRequests:base.current.quoteRequests+deltaQuote,websiteQuoteRequests:base.current.websiteQuoteRequests+deltaQuote,quoteSent:base.current.quoteSent+deltaSent,closed:base.current.closed+deltaClosed}}:remote.snapshot?{...remote.snapshot,current:normalizeMetrics(remote.snapshot.current),previous:normalizeMetrics(remote.snapshot.previous)}:null;
 function navigate(next){setPage(next);window.scrollTo({top:0,behavior:'instant'});}
 async function changeStage(id,stage){
  if(!demo){setOperationError('');try{await operations.changeStage(id,stage);await remote.refresh();}catch(error){setOperationError(error.message);}return;}
  setLeadPeriods(current=>({...current,[periodId]:(current[periodId]||initialLeads).map(lead=>lead.id===id?{...lead,stage,hasRequestedQuote:lead.hasRequestedQuote||isQuoteStage(stage),hasSentQuote:lead.hasSentQuote||['quote_sent','won'].includes(stage),wasWon:lead.wasWon||stage==='won'}:lead)}));
 }
 const pages={
 overview:snapshot&&<Dashboard snapshot={snapshot} onInsights={()=>navigate('reports')}/>,
 website:snapshot&&<Website snapshot={snapshot}/>,
 instagram:snapshot&&<InstagramPage snapshot={snapshot}/>,
 whatsapp:snapshot&&<WhatsAppPage snapshot={snapshot} leads={demo?leads:operations.leads} onStageChange={changeStage} onConfirm={async input=>{await operations.confirmContact(input);await remote.refresh();}} busy={operations.busy}/>,
 reports:snapshot&&<Reports snapshot={snapshot} operations={operations} onReportOpen={()=>setReportOpen(true)}/>,
 integrations:<Integrations operations={operations} demo={demo}/>,
 access:<TeamAccess session={session} demo={demo}/>,
 };
 return <>
 <Shell page={page} onPageChange={navigate} periodId={periodId} periods={options} onPeriodChange={setPeriodId} onReportOpen={()=>setReportOpen(true)} reportAvailable={Boolean(snapshot)} demo={demo} updatedAt={remote.updatedAt} sourceUpdatedAt={snapshot&&!demo?(snapshot.current.sourceUpdatedAt||{}):null} onRefresh={remote.refresh}>
 {pages[page]||<Panel title={remote.loading?'Carregando métricas':'Dados da equipe'}><p className="empty-explanation" role={remote.error?'alert':'status'}>{remote.error||(remote.loading?'Buscando as informações autorizadas para sua conta…':'O acesso foi verificado. Ainda não há coleta publicada para este período.')}</p><div className="button-row overview-packages"><button className="button secondary" onClick={remote.refresh}>Tentar atualizar</button><button className="button secondary" onClick={()=>navigate('access')}>Ver meu acesso</button></div></Panel>}
 {!demo&&snapshot?.current.sourceCoverage?.website==='partial'&&<p className="panel-note">Coleta parcial do site: este período está em andamento ou começou antes da instalação. Os números representam somente as visitas medidas.</p>}
 {operationError&&<p className="auth-error" role="alert">{operationError}</p>}
 {!demo&&operations.deliveries.some(r=>['failed','uncertain'].includes(r.status))&&<div className="demo-banner" role="alert"><p>Há um envio de relatório que precisa de atenção. <button onClick={()=>navigate('reports')}>Ver histórico de entrega</button></p></div>}
 </Shell>
 {snapshot&&reportOpen&&<ReportDialog open={reportOpen} onClose={()=>setReportOpen(false)} snapshot={snapshot}/>}
 </>;
}
export default function App(){return <AuthGate>{access=><Workspace key={access.session?.user.id||'demo'} {...access}/>}</AuthGate>;}
