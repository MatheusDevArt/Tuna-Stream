import {useState} from 'react';
import {MessageCircle,FileText,Send,CheckCheck} from 'lucide-react';
import {MetricStrip,Panel} from '../components/Metrics.jsx';
import {leadStages} from '../whatsapp.js';
import ConfirmContact from '../components/ConfirmContact.jsx';
import ConfirmArrival from '../components/ConfirmArrival.jsx';
const packageLabels={START:'Start',LIVE:'Live',STREAMER:'Streamer',COMBOS:'Combos',CUSTOM:'Personalizado',GENERAL:'A definir'};
export default function WhatsAppPage({snapshot,leads,onStageChange,onConfirm,onConfirmLink,onPackageChange,busy=false,reference=''}){
 const [view,setView]=useState('board'),{current,previous}=snapshot;
 const card=(lead,i)=><article className="deal-card" key={lead.id}><h3>{snapshot.demo?'Exemplo':'Oportunidade'} {lead.reference.slice(-6)}</h3><code>{lead.reference}</code><label>Pacote negociado<select disabled={busy} value={lead.selected_package||String(lead.package).toUpperCase()} aria-label={'Pacote da oportunidade '+(i+1)} onChange={e=>onPackageChange(lead.id,e.target.value)}>{Object.entries(packageLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><p>{lead.received}</p><label>Etapa<select disabled={busy} aria-label={'Etapa da oportunidade '+(i+1)} value={lead.stage} onChange={e=>onStageChange(lead.id,e.target.value)}>{leadStages.map(stage=><option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label></article>;
 return <>
 {reference&&<ConfirmArrival reference={reference} demo={snapshot.demo} onConfirm={onConfirmLink}/>}
 <MetricStrip items={[{label:'Recebimentos do site',value:current.websiteReceivedContacts,previous:previous.websiteReceivedContacts,icon:MessageCircle,color:'mint'},{label:'Pediram orçamento',value:current.websiteQuoteRequests,previous:previous.websiteQuoteRequests,icon:FileText},{label:'Orçamentos enviados',value:current.quoteSent,previous:previous.quoteSent,icon:Send},{label:'Vendas fechadas',value:current.closed,previous:previous.closed,icon:CheckCheck,color:'mint'}]}/>
 <Panel title="Oportunidades do site" action={<div className="button-row"><button className="button secondary" aria-pressed={view==='board'} onClick={()=>setView('board')}>Quadro</button><button className="button secondary" aria-pressed={view==='list'} onClick={()=>setView('list')}>Lista</button></div>}>
 {snapshot.demo&&<p className="panel-note top-note">Oportunidades fictícias para experimentar as etapas.</p>}
 {view==='board'?<div className="sales-board">{leadStages.map(stage=><section className={'sales-column stage-'+stage.id} key={stage.id}><header><h3>{stage.label}</h3><span>{leads.filter(lead=>lead.stage===stage.id).length}</span></header>{leads.filter(lead=>lead.stage===stage.id).map(card)}{!leads.some(lead=>lead.stage===stage.id)&&<p className="empty-stage">Nenhuma oportunidade</p>}</section>)}</div>:<div className="deal-list">{leads.map(card)}</div>}
 {!leads.length&&<p className="panel-note">Confirme uma mensagem usando o link recebido no WhatsApp. Ela aparecerá aqui com a referência e o pacote de origem.</p>}
 </Panel>
 <Panel title="Resultados por pacote" className="view-section"><div className="table-scroll"><table><thead><tr><th>Pacote negociado</th><th>Em aberto</th><th>Fechados</th><th>Perdidos</th></tr></thead><tbody>{(snapshot.demo?Object.keys(packageLabels).map(pack=>{const rows=leads.filter(lead=>(lead.selected_package||String(lead.package).toUpperCase())===pack);return {package:pack,open:rows.filter(lead=>!['won','lost'].includes(lead.stage)).length,won:rows.filter(lead=>lead.stage==='won').length,lost:rows.filter(lead=>lead.stage==='lost').length};}):current.salesByPackage||[]).map(row=><tr key={row.package}><th>{packageLabels[row.package]}</th><td>{row.open}</td><td className="positive">{row.won}</td><td className="negative">{row.lost}</td></tr>)}</tbody></table></div><p className="panel-note">Oportunidades recebidas no período, por etapa atual e pacote negociado. O pacote de origem do clique é preservado.</p></Panel>
 <details className="advanced-data view-section"><summary>Confirmar pelo código e telefone</summary><ConfirmContact demo={snapshot.demo} onConfirm={onConfirm} busy={busy}/></details>
 <p className="page-footnote">Cada confirmação guarda quem confirmou, pacote, referência e etapa. A mesma referência não duplica a oportunidade. Sem telefone não é possível reconhecer a mesma pessoa em códigos diferentes. Abrir um link ou mudar de etapa não comprova pagamento.</p>
 </>;
}
