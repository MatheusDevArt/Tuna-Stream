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
 const media=snapshot.demo?getDemoMedia(snapshot):(current.media||[]).map(item=>({...item,title:item.title||item.caption,format:item.format||(classifyChannel(item)==='reels'?'Reel':classifyChannel(item)==='stories'?'Story':item.media_type==='CAROUSEL_ALBUM'?'Carrossel':item.media_type==='VIDEO'?'Vídeo':'Estático'),channel:classifyChannel(item)}));
 const items=sortContent(media.filter(item=>item.channel===channel),criterion);
 const averages=channels.map(({id,label})=>{const eligible=media.filter(item=>item.channel===id&&Number.isFinite(item.reach));return [label,eligible.length?Math.round(eligible.reduce((sum,item)=>sum+item.reach,0)/eligible.length):null];}).filter(([,value])=>value!=null).sort((a,b)=>b[1]-a[1]);
 const criteria=channel==='stories'?[['reach','Alcance'],['replies','Respostas'],['linkTaps','Cliques no link']]:[['reach','Alcance'],['shares','Compartilhamentos'],['saves','Salvos'],['engagement','Interações / alcance']];
 return <>
 <a className="source-link" href={business.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={16}/>{business.handle}<span className="muted">· {business.accountType}</span><ExternalLink size={15}/></a>
 <div className="channel-tabs" role="tablist" aria-label="Formato do conteúdo">{channels.map(({id,label})=>{const Icon=tabIcons[id];return <button key={id} role="tab" id={'tab-'+id} aria-selected={channel===id} aria-controls="content-channel" onClick={()=>{setChannel(id);setCriterion('reach');}}><Icon size={16}/>{label}</button>;})}</div>
 <MetricStrip items={[
 {label:'Alcance da conta',value:current.instagramReach,previous:previous.instagramReach,icon:Eye},
 {label:'Saldo de seguidores',value:current.netFollowers,previous:previous.netFollowers,icon:Users,prefix:current.netFollowers>0?'+':''},
 {label:'Visitas ao perfil',value:current.profileVisits,previous:previous.profileVisits,icon:InstagramIcon,color:'pink'},
 {label:'Cliques na bio',value:current.bioClicks,previous:previous.bioClicks,icon:MousePointer2,color:'mint'},
 ]}/>
 <Panel title={channel==='stories'?'Seus Stories em detalhe':'Conteúdos em destaque'} className="posts-panel">
 <div className="content-toolbar"><p>{snapshot.demo?'Miniaturas ilustrativas do portfólio. Os posts reais entram após conectar a conta.':'Publicações e métricas disponíveis na sua conta para este período.'}</p><label className="content-sort">Ordenar por<select aria-label="Ordenar conteúdos por" value={criterion} onChange={event=>setCriterion(event.target.value)}>{criteria.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label></div>
 <div id="content-channel" role="tabpanel" aria-labelledby={'tab-'+channel}><ContentCards items={items} channel={channel}/></div>
 {channel==='stories'&&<p className="panel-note">Stories têm disponibilidade limitada. A coleta a cada quatro horas preserva as métricas disponíveis; depois de expirar, a prévia e o link podem deixar de funcionar. Dados anteriores à conexão podem não estar disponíveis.</p>}
 </Panel>
 <div className="three-columns instagram-bottom"><Panel title="Crescimento de seguidores"><dl className="detail-list"><div><dt>Ganhos na semana</dt><dd>{formatNumber(current.followersGained)}</dd></div><div><dt>Perdidos na semana</dt><dd>{formatNumber(current.followersLost)}</dd></div><div><dt>Saldo</dt><dd>{formatNumber(current.netFollowers)}</dd></div><div><dt>Total ao fim da semana</dt><dd>{formatNumber(current.followersTotal)}</dd></div></dl></Panel><Panel title="Alcance médio por formato">{averages.length?<ColumnChart items={averages}/>:<p className="empty-explanation">Aguardando dados de conteúdo.</p>}<p className="panel-note">Média por conteúdo. O alcance de diferentes posts não representa pessoas únicas da conta.</p></Panel><Panel title="Audiência da conta"><dl className="detail-list"><div><dt>Visualizações no período</dt><dd>{formatNumber(current.instagramViews)}</dd></div></dl>{[['city','Cidades'],['age','Faixas etárias'],['gender','Gênero']].map(([key,label])=><details key={key}><summary>{label}</summary>{current.audience?.[key]?.length?<DataList items={current.audience[key]}/>:<p className="empty-explanation">Não disponível para esta conta.</p>}</details>)}<p className="panel-note">Audiência atual, sem equivalência com o público da semana escolhida.{current.audienceAsOf&&' Consulta em '+new Date(current.audienceAsOf).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})+'.'} A API pode limitar dados com amostra pequena. Ainda não há base para recomendar um horário de postagem.</p></Panel></div>
 </>;
}
