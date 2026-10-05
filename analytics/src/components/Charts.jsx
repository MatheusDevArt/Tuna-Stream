import { formatNumber, formatPercent, rate } from '../report.js';
import { Panel } from './Metrics.jsx';
import {addDays} from '../periods.js';

const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export function WeeklyChart({ current, previous,period }) {
  if(!current?.some(Number.isFinite))return <Panel title="Visitas ao longo do período"><p className="empty-explanation">Aguardando a série diária. Dias sem coleta não aparecem como zero.</p></Panel>;
  const length=current.length,labels=period?current.map((_,i)=>new Date(addDays(period.start,i)+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',...(length>7?{day:'2-digit',month:'2-digit'}:{weekday:'short'})})):dayLabels;
  const width=650,height=238,left=38,right=15,top=18,bottom=30;
  const maximum=Math.max(Math.ceil(Math.max(...[...current,...(previous||[])].filter(Number.isFinite))/50)*50,50);
  const x=i=>left+i*(width-left-right)/Math.max(1,length-1),y=v=>top+(height-top-bottom)*(1-v/maximum);
  const segments=values=>{const groups=[];let group=[];for(let i=0;i<length;i++){if(Number.isFinite(values?.[i]))group.push([i,values[i]]);else if(group.length){groups.push(group);group=[];}}if(group.length)groups.push(group);return groups;};
  const points=group=>group.map(([i,v])=>x(i)+','+y(v)).join(' ');
  return <Panel title="Visitas ao longo do período" className="chart-panel" action={<div className="chart-legend"><span><i />Período escolhido</span>{previous?.some(Number.isFinite)&&<span><i className="previous" />Período anterior</span>}</div>}>
    <div className="chart-wrap"><svg viewBox={'0 0 '+width+' '+height} role="img" aria-label="Visitas diárias do período escolhido">
      <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9876ff" stopOpacity=".19"/><stop offset="100%" stopColor="#9876ff" stopOpacity=".01"/></linearGradient></defs>
      {Array.from({length:6},(_,i)=>maximum*i/5).map(v=><g key={v}><line x1={left} x2={width-right} y1={y(v)} y2={y(v)} stroke="#282838" strokeWidth=".8"/><text x={left-10} y={y(v)+4} textAnchor="end">{Math.round(v)}</text></g>)}
      {labels.map((label,i)=>(length<=7||i%5===0||i===length-1)&&<g key={i}><text x={x(i)} y={height-8} textAnchor="middle">{label}</text></g>)}
      {segments(previous).map((group,i)=><polyline key={'previous'+i} points={points(group)} fill="none" stroke="#a5a2c9" strokeWidth="2" strokeDasharray="6 6"/>)}
      {segments(current).map((group,i)=><g key={i}><polygon points={x(group[0][0])+','+(height-bottom)+' '+points(group)+' '+x(group.at(-1)[0])+','+(height-bottom)} fill="url(#chart-fill)"/><polyline points={points(group)} fill="none" stroke="#9876ff" strokeWidth="2.5"/></g>)}
      {current.map((v,i)=>Number.isFinite(v)&&<circle key={i} cx={x(i)} cy={y(v)} r="4.3" fill="#9876ff"><title>{labels[i]+': '+v+' visitas'}</title></circle>)}
    </svg></div>
    <div className="chart-accessible"><details><summary>Ver valores do gráfico</summary><table><thead><tr><th>Dia</th><th>Período</th><th>Anterior</th></tr></thead><tbody>{labels.map((day,i)=><tr key={i}><th>{day}</th><td>{formatNumber(current[i])}</td><td>{formatNumber(previous?.[i])}</td></tr>)}</tbody></table></details></div>
    <p className="panel-note">Dias futuros ou anteriores à instalação ficam sem pontos. O gráfico representa apenas visitas medidas.</p>
  </Panel>;
}

export function Funnel({ data }) {
  const rows = [['Visitas', data.visits], ['Viram os pacotes', data.packagesReached], ['Escolheram um pacote', data.packageSessions??data.packageClicks], ['Clicaram no WhatsApp', data.whatsappSessions??data.whatsappClicks], ['Contatos do site', data.websiteReceivedContacts], ['Orçamentos do site', data.websiteQuoteRequests]];
  return <Panel title="Da visita ao orçamento" className="funnel-panel"><ol className="journey-steps">{rows.map(([label,value],index)=><li key={label} className={index>=4?'confirmed-step':''}><span className="journey-number">{String(index+1).padStart(2,'0')}</span><div><span>{label}</span><strong>{value==null?'—':formatNumber(value)}</strong></div></li>)}</ol><div className="conversion-total"><span>Orçamentos do site / visitas</span><strong>{data.websiteQuoteRequests==null||!(data.visits>0)?'—':formatPercent(rate(data.websiteQuoteRequests, data.visits))}</strong></div><p className="panel-note">Etapas com unidades diferentes. Recebimentos são confirmados pela equipe; podem acontecer em outra semana.</p></Panel>;
}
