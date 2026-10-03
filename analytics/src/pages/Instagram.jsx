import {ColumnChart,DataList} from '../components/DataViews.jsx';
import { useState } from 'react';
import { Instagram as InstagramIcon, Users, Eye, MousePointer2, ExternalLink, Layers, Clapperboard, Clock3 } from 'lucide-react';
import { business } from '../data.js';
import { MetricStrip, Panel } from '../components/Metrics.jsx';
import ContentCards from '../components/ContentCards.jsx';
import { channels,classifyChannel,getDemoMedia,sortContent } from '../content.js';
import { formatNumber } from '../report.js';

const tabIcons={feed:Layers,reels:Clapperboard,stories:Clock3};
export default function InstagramPage({snapshot}){
 const [channel,setChannel]=useState('feed'),[criterion,setCriterion]=useState('reach');
 const {current,previous}=snapshot;
 const metricool=current.instagramSource?.provider==='metricool';
 const meta=current.instagramSource?.provider==='meta';
 const day=value=>value?value.split('T')[0].split('-').reverse().join('/'):'Não disponível';
 const media=snapshot.demo?getDemoMedia(snapshot):(current.media||[]).map(item=>({...item,title:item.title||item.caption,format:item.format||(classifyChannel(item)==='reels'?'Reel':classifyChannel(item)==='stories'?'Story':item.media_type==='CAROUSEL_ALBUM'?'Carrossel':item.media_type==='VIDEO'?'Vídeo':'Estático'),channel:classifyChannel(item)}));
 const items=sortContent(media.filter(item=>item.channel===channel),criterion);
 const averages=channels.map(({id,label})=>{const eligible=media.filter(item=>item.channel===id&&Number.isFinite(item.reach));return [label,eligible.length?Math.round(eligible.reduce((sum,item)=>sum+item.reach,0)/eligible.length):null];}).filter(([,value])=>value!=null).sort((a,b)=>b[1]-a[1]);
 const criteria=channel==='stories'?[['reach','Alcance'],['replies','Respostas'],['linkTaps','Cliques no link']]:[['reach','Alcance'],['shares','Compartilhamentos'],['saves','Salvos'],['engagement','Interações / alcance']];
 return <>
 <a className="source-link" href={business.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={16}/>{business.handle}<span className="muted">· {business.accountType}</span><ExternalLink size={15}/></a>
 {metricool&&<div className="connection-notice"><strong>Dados reais via Metricool · histórico parcial</strong><p>Consulta em {new Date(current.instagramSource.collectedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}. Atualização por importação nesta conversa; a coleta automática ainda está pendente.</p><p>Os posts abaixo foram publicados no período selecionado. Suas métricas são acumuladas até a consulta. Períodos sem histórico suficiente ficam sem comparação.</p></div>}
 {meta&&<div className="connection-notice"><strong>Dados da API oficial do Instagram{current.instagramSource.coverage!=='complete'?' · período parcial':''}</strong><p>Consulta em {new Date(current.instagramSource.collectedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}. A semana em andamento usa apenas os dados disponíveis até essa consulta. A Meta pode disponibilizar métricas com atraso.</p><p>As métricas dos conteúdos são acumuladas até a data de coleta de cada post. Valores indisponíveis ficam sem número e sem comparação.</p></div>}
 <div className="channel-tabs" role="tablist" aria-label="Formato do conteúdo">{channels.map(({id,label})=>{const Icon=tabIcons[id];return <button key={id} role="tab" id={'tab-'+id} aria-selected={channel===id} aria-controls="content-channel" onClick={()=>{setChannel(id);setCriterion('reach');}}><Icon size={16}/>{label}</button>;})}</div>
 <MetricStrip items={[
 {label:metricool?'Último alcance diário':'Alcance da conta',value:metricool?current.instagramLastDailyReach:current.instagramReach,previous:metricool?null:previous.instagramReach,icon:Eye},
 {label:'Saldo de seguidores',value:current.netFollowers,previous:previous.netFollowers,icon:Users,prefix:current.netFollowers>0?'+':''},
 {label:metricool?'Seguidores informados':'Visitas ao perfil',value:metricool?current.followersTotal:current.profileVisits,previous:metricool?null:previous.profileVisits,icon:InstagramIcon,color:'pink'},
 {label:metricool?'Visualizações informadas':meta?'Toques nos contatos':'Cliques na bio',value:metricool?current.instagramViewsObserved:meta?current.profileContactTaps:current.bioClicks,previous:metricool?null:meta?previous.profileContactTaps:previous.bioClicks,icon:MousePointer2,color:'mint'},
 ]}/>
 {metricool&&<p className="panel-note">Alcance diário: {day(current.instagramReachAsOf)} · Seguidores: {day(current.followersAsOf)} · Dias com visualizações: {current.instagramViewsDays?.length?current.instagramViewsDays.map(day).join(', '):'nenhum'}. Alcance diário não é o total de pessoas únicas da semana. Visualizações da conta podem incluir mídia paga.</p>}
 <Panel title={channel==='stories'?'Seus Stories em detalhe':'Conteúdos em destaque'} className="posts-panel">
 <div className="content-toolbar"><p>{snapshot.demo?'Miniaturas ilustrativas do portfólio. Os posts reais entram após conectar a conta.':'Conteúdos publicados no período · métricas acumuladas até a última consulta de cada conteúdo.'}</p><label className="content-sort">Ordenar por<select aria-label="Ordenar conteúdos por" value={criterion} onChange={event=>setCriterion(event.target.value)}>{criteria.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label></div>
 <div id="content-channel" role="tabpanel" aria-labelledby={'tab-'+channel}><ContentCards items={items} channel={channel}/></div>
 {channel==='stories'&&<p className="panel-note">Stories têm disponibilidade limitada. Depois de expirar, a prévia e o link podem deixar de funcionar. Dados anteriores à conexão podem não estar disponíveis.{metricool&&' O Metricool não retornou Stories nesta consulta; isso não comprova ausência de publicações.'}</p>}
 </Panel>
 <div className="three-columns instagram-bottom"><Panel title="Crescimento de seguidores"><dl className="detail-list"><div><dt>Ganhos na semana</dt><dd>{formatNumber(current.followersGained)}</dd></div><div><dt>Perdidos na semana</dt><dd>{formatNumber(current.followersLost)}</dd></div><div><dt>Saldo</dt><dd>{formatNumber(current.netFollowers)}</dd></div><div><dt>Último total informado</dt><dd>{formatNumber(current.followersTotal)}</dd></div>{current.followersAsOf&&<div><dt>Data do total informado</dt><dd>{day(current.followersAsOf)}</dd></div>}</dl></Panel><Panel title="Alcance médio por formato">{averages.length?<ColumnChart items={averages}/>:<p className="empty-explanation">Aguardando dados de conteúdo.</p>}<p className="panel-note">Média dos conteúdos com alcance disponível. O alcance de diferentes posts não representa pessoas únicas da conta.</p></Panel><Panel title="Audiência da conta"><dl className="detail-list"><div><dt>{metricool?'Visualizações dos dias informados':'Visualizações no período'}</dt><dd>{formatNumber(metricool?current.instagramViewsObserved:current.instagramViews)}</dd></div></dl>{[['city','Cidades'],['age','Faixas etárias'],['gender','Gênero']].map(([key,label])=><details key={key}><summary>{label}</summary>{current.audience?.[key]?.length?<DataList items={current.audience[key]}/>:<p className="empty-explanation">Não disponível para esta conta.</p>}</details>)}<p className="panel-note">Dados demográficos dos seguidores na janela informada pela fonte, sem equivalência com o público da semana escolhida.{current.audienceAsOf&&' Consulta em '+new Date(current.audienceAsOf).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})+'.'} A API não informa algumas métricas de seguidores em contas com menos de 100 seguidores. Ainda não há base para recomendar um horário de postagem.</p></Panel></div>
 </>;
}
