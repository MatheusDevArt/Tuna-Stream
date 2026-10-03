import {useEffect,useRef,useState} from 'react';
import {Monitor,Instagram,Database,ExternalLink,ShieldCheck} from 'lucide-react';
import {Panel} from '../components/Metrics.jsx';
import {business} from '../data.js';
import {invokeEndpoint} from '../lib/endpoints.js';
import {launch,openAuthorization} from '../lib/launch.js';
const labels={ready:'Conectado',pending:'Pendente',error:'Precisa de atenção'};
export default function Integrations({operations,demo,instagramSource}){
 const [status,setStatus]=useState(null),[feedback,setFeedback]=useState(''),[busy,setBusy]=useState(false),handled=useRef(false);
 useEffect(()=>{if(demo)return;let active=true;invokeEndpoint('tuna-instagram',{body:{action:'status'}}).then(result=>{if(active)setStatus(result.data);});return()=>{active=false;};},[demo]);
 useEffect(()=>{if(demo||handled.current||!launch.code&&!launch.oauthError)return;handled.current=true;if(launch.oauthError){setFeedback('A autorização foi cancelada. Você pode tentar novamente.');return;}setBusy(true);invokeEndpoint('tuna-instagram',{body:{action:'complete',code:launch.code,state:launch.state}}).then(result=>{
  const data=result.data,valid=['complete','partial'].includes(data?.collection?.status);
  setFeedback(result.error?'Não foi possível concluir a conexão. Autorize o perfil profissional tuna.stream e tente novamente.':valid?(data.schedulerConfigured?'Instagram autorizado. Dados recebidos e coleta automática ativada.':'Dados recebidos. O agendamento ainda precisa de atenção.'):'Instagram autorizado. A primeira coleta ainda não foi concluída; confira o estado abaixo.');
  if(!result.error){setStatus(s=>({...s,connected:true,schedulerConfigured:data.schedulerConfigured}));operations.refresh();invokeEndpoint('tuna-instagram',{body:{action:'status'}}).then(next=>{if(next.data)setStatus(next.data);});}
 }).finally(()=>setBusy(false));},[demo,operations]);
 async function connect(){
  if(demo){setFeedback('Prévia local: a autorização real será habilitada após configurar o aplicativo Instagram no servidor.');return;}
  setBusy(true);try{const result=await invokeEndpoint('tuna-instagram',{body:{action:'start'}});if(result.error||!result.data?.url)throw new Error('A conexão oficial ainda precisa ser configurada no servidor.');const url=new URL(result.data.url);if(url.origin!=='https://www.instagram.com'||url.pathname!=='/oauth/authorize')throw new Error('Resposta de autorização inválida.');openAuthorization(url.href);}catch(error){setFeedback(error.message);}finally{setBusy(false);}
 }
 const state=id=>operations?.integrations.find(item=>item.source===id);
 const localHistory=!demo&&import.meta.env.VITE_LOCAL_HISTORY_LINK==='true'&&['localhost','127.0.0.1'].includes(location.hostname);
 const metricool=instagramSource?.provider==='metricool';
 return <>
 <div className="setup-intro"><h2>Conexões da TunaStream</h2><p>Dados autorizados, compartilhados entre as duas contas.</p></div>
 {localHistory&&<p className="connection-notice">Este é o novo banco da TunaStream. Enquanto o coletor do site público não for conectado a ele, <a href="/historico/">consulte os dados reais do painel publicado</a>. O histórico fica separado dos novos cadastros.</p>}
 <Panel title="Instagram" action={<span className="connection-status">{demo?'Demonstração':status?.connected?'Autorizado':metricool?'Metricool · importado':labels[state('instagram')?.status]||'Pendente'}</span>}>
 <div className="instagram-connect"><Instagram size={40}/><div><h3>{business.handle}</h3>
 {metricool?<><p>Dados reais importados do Metricool, com histórico parcial.</p><p className="panel-note">Última consulta: {new Date(instagramSource.collectedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}. Atualizar o painel lê o banco; não faz uma nova consulta ao Metricool.</p></>:<p>Autorize a leitura dos dados usando o próprio Instagram.</p>}
 <p className="panel-note">A conta precisa ser profissional: Criador ou Empresa. Essa conexão dispensa uma página do Facebook.</p>
 <button className="button primary view-section" disabled={busy||!demo&&!status?.configured} onClick={connect}>{busy?'Aguarde…':!demo&&!status?.configured?'Conexão em preparação':status?.connected?'Reconectar com Instagram':'Conectar com Instagram'}</button>
 {!demo&&!status?.configured&&<p className="panel-note">O aplicativo da integração ainda está sendo configurado. Nenhuma senha do Instagram é solicitada pelo painel.</p>}
 {!demo&&status?.connected&&<p className="panel-note">{status.schedulerConfigured?'Agendamento configurado no servidor · consulta aproximadamente a cada hora.':'Perfil autorizado · agendamento no servidor ainda pendente.'} A coleta só aparece como realizada depois de retornar dados válidos.</p>}
 {status?.lastCollection&&<p className="panel-note">Última tentativa: {new Date(status.lastCollection.started_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · {{running:'Em andamento',success:'Concluída',partial:'Concluída com dados parciais',failed:'Não concluída'}[status.lastCollection.status]}.</p>}
 <p className="panel-note">Métricas indisponíveis permanecem sem número. Períodos incompletos ou fontes diferentes ficam sem comparação.</p>
 </div></div><p className="feedback" role="status">{feedback}</p></Panel>
 <div className="two-columns view-section"><Panel title="Site"><div className="inline-description"><Monitor/><p>{demo?'Exemplo de coleta':'Estado: '+(labels[state('website')?.status]||'Pendente')}. Visitas, cliques e navegação são medidos após consentimento.</p></div><a href={business.website} target="_blank" rel="noopener noreferrer" className="button secondary view-section">Abrir site<ExternalLink size={16}/></a><p className="panel-note">Mapa e cidades dependem da conexão do Google Analytics.</p></Panel><Panel title="WhatsApp comum"><p>O código e o link privado acompanham a mensagem do site. Vocês confirmam o recebimento e acompanham a oportunidade no quadro de vendas.</p><p className="panel-note">Cliques e aberturas de links não comprovam o envio. O recebimento é uma confirmação feita pela equipe.</p></Panel></div>
 <div className="two-columns"><Panel title="Equipe e privacidade"><div className="inline-description"><Database/><p>Os dois perfis compartilham o mesmo banco; mudanças de acesso são individuais.</p></div><p className="panel-note"><ShieldCheck size={16}/> A coleta não guarda o texto das conversas. Fotos enviadas para o perfil ficam no armazenamento privado da equipe.</p></Panel><Panel title="Relatórios em imagem"><p>Baixe duas imagens: site e Instagram, com desempenho e mudanças do período.</p><p className="panel-note">Envio automático ainda depende de remetente oficial, configuração e modelos aprovados. A prévia local não envia mensagens.</p></Panel></div>
 </>;
}
