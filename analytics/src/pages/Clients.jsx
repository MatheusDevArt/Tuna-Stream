import {useMemo,useState} from 'react';
import {Users,UserCheck,CheckCheck,Plus,Trash2,Undo2} from 'lucide-react';
import {MetricStrip,Panel} from '../components/Metrics.jsx';
import OpportunityEditor from '../components/OpportunityEditor.jsx';
import {packageLabels,serviceLabels,stateLabels,summarizeSalesPeriod,formatSaleAmount} from '../sales.js';

export default function Clients({snapshot,leads,onCreate,onClientSave,onArchive,busy=false,readOnly=false}){
 const [editing,setEditing]=useState(null),[filter,setFilter]=useState('all'),[removing,setRemoving]=useState(null),[feedback,setFeedback]=useState('');
 const active=leads.filter(lead=>!lead.archived_at);
 const sales=useMemo(()=>summarizeSalesPeriod(leads,snapshot.period),[leads,snapshot.period]);
 const identified=new Set(active.filter(l=>l.client_id).map(l=>l.client_id)).size;
 const shown=leads.filter(l=>l.client_id&&(filter==='archived'?Boolean(l.archived_at):!l.archived_at&&(filter==='all'||l.stage===filter)));
 function create(){setEditing({id:crypto.randomUUID(),reference:'Cadastro direto · contratação',package:'GENERAL',isNew:true});}
 async function archive(lead,restore=false){setFeedback('');try{await onArchive(lead.id,restore);setRemoving(null);setFeedback(restore?'Cliente restaurado.':'Cliente excluído da lista e dos totais. Você pode restaurá-lo em “Clientes excluídos”.');}catch(error){setFeedback(error.message||'Não foi possível atualizar o cliente.');}}
 const linked=removing?active.filter(l=>l.client_id===removing.client_id).length:0;
 return <>
 <MetricStrip items={[{label:'Clientes cadastrados',value:identified,icon:Users},{label:'Clientes que compraram no período',value:sales.buyers,icon:UserCheck,color:'mint'},{label:'Vendas no período',value:sales.won,icon:CheckCheck,color:'mint'}]}/>
 <Panel title="Clientes e contratações" action={<button className="button primary" disabled={busy||readOnly} onClick={create}><Plus size={17}/>Adicionar cliente</button>}>
 <p className="panel-note">Cadastre quem já contratou, mesmo sem um código do site. Cada contratação conta como uma venda; o telefone agrupa compras da mesma pessoa. Cadastros diretos não contam como mensagens recebidas pelo site.</p>
 <label className="service-filter">Mostrar<select aria-label="Filtrar clientes" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas as contratações e pedidos</option><option value="won">Contratações fechadas</option><option value="lost">Pedidos perdidos</option><option value="archived">Clientes excluídos</option></select></label>
 <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Pacote / serviço</th><th>Valor combinado</th><th>Região</th><th>Fechamento</th><th>Origem</th><th>Ações</th></tr></thead><tbody>{shown.map(l=><tr key={l.id}><th>{l.client_label||'Cliente identificado'}</th><td>{l.custom_package_name||packageLabels[l.selected_package||l.package]}<small className="client-service">{serviceLabels[l.service_category]||'A definir'}</small></td><td>{formatSaleAmount(l.sale_amount)}</td><td>{l.customer_city&&l.customer_city+' · '}{stateLabels[l.customer_state]||'Não informado'}</td><td>{l.stage==='won'&&l.won_at?new Date(l.won_at).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):l.stage==='lost'?'Perdido':'Em negociação'}</td><td>{l.origin==='manual'?'Cadastro direto':'Site'}</td><td><div className="client-actions">{l.archived_at?<button className="button secondary" disabled={readOnly||busy} onClick={()=>archive(l,true)}><Undo2 size={15}/>Restaurar cliente</button>:<><button className="button secondary" disabled={readOnly||busy} onClick={()=>setEditing(l)}>Editar</button><button className="button secondary danger-button" disabled={readOnly||busy} onClick={()=>setRemoving(l)}><Trash2 size={15}/>Excluir cliente</button></>}</div></td></tr>)}</tbody></table></div>
 {!shown.length&&<div className="client-empty"><Users size={32}/><h3>{filter==='archived'?'Nenhum cliente excluído':'Nenhum cliente nesta seleção'}</h3>{filter==='all'&&<p>Use “Adicionar cliente” para registrar uma contratação real.</p>}</div>}
 <p className="panel-note">A lista reúne o histórico. Os cartões respeitam o período e a data de fechamento. Valor combinado não comprova pagamento. Clientes excluídos ficam fora dos totais e podem ser restaurados.</p>
 {feedback&&<p className="feedback" role="status">{feedback}</p>}
 </Panel>
 {editing&&<OpportunityEditor key={editing.id} lead={editing} creating={Boolean(editing.isNew)} onSave={editing.isNew?onCreate:onClientSave} onClose={()=>setEditing(null)} busy={busy} demo={snapshot.demo}/>}
 {removing&&<div className="dialog-backdrop"><section className="opportunity-editor" role="dialog" aria-modal="true" aria-labelledby="remove-client-title"><header><h2 id="remove-client-title">Excluir cliente?</h2><button className="icon-button" onClick={()=>setRemoving(null)} aria-label="Cancelar exclusão">×</button></header><p><strong>{removing.client_label||'Cliente identificado'}</strong> e {linked} {linked===1?'pedido vinculado sairão':'pedidos vinculados sairão'} da lista ativa e dos relatórios. Você poderá restaurar o cadastro em “Clientes excluídos”.</p><div className="button-row"><button className="button secondary" autoFocus onClick={()=>setRemoving(null)} disabled={busy}>Cancelar</button><button className="button primary danger-button" disabled={busy||readOnly} onClick={()=>archive(removing)}>{busy?'Excluindo…':'Confirmar exclusão do cliente'}</button></div>{feedback&&<p role="alert">{feedback}</p>}</section></div>}
 </>;
}
