import { formatNumber, formatPercent, rate } from '../report.js';
import { Panel } from './Metrics.jsx';

const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export function WeeklyChart({ current, previous }) {
  if(!current?.some(Number.isFinite))return <Panel title="Visitas ao longo da semana"><p className="empty-explanation">Aguardando a série diária. Dias sem coleta não aparecem como zero.</p></Panel>;
  const width=650,height=238,left=38,right=15,top=18,bottom=30;
  const maximum=Math.max(Math.ceil(Math.max(...[...current,...(previous||[])].filter(Number.isFinite))/50)*50,50);
  const x=i=>left+i*(width-left-right)/6,y=v=>top+(height-top-bottom)*(1-v/maximum);
  const segments=values=>{const groups=[];let group=[];for(let i=0;i<7;i++){if(Number.isFinite(values?.[i]))group.push([i,values[i]]);else if(group.length){groups.push(group);group=[];}}if(group.length)groups.push(group);return groups;};
  const points=group=>group.map(([i,v])=>x(i)+','+y(v)).join(' ');
  return <Panel title="Visitas ao longo da semana" className="chart-panel" action={<div className="chart-legend"><span><i />Período escolhido</span>{previous?.some(Number.isFinite)&&<span><i className="previous" />Semana anterior</span>}</div>}>
    <div className="chart-wrap"><svg viewBox={'0 0 '+width+' '+height} role="img" aria-label="Visitas diárias do período escolhido">
      <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9876ff" stopOpacity=".19"/><stop offset="100%" stopColor="#9876ff" stopOpacity=".01"/></linearGradient></defs>
      {Array.from({length:6},(_,i)=>maximum*i/5).map(v=><g key={v}><line x1={left} x2={width-right} y1={y(v)} y2={y(v)} stroke="#282838" strokeWidth=".8"/><text x={left-10} y={y(v)+4} textAnchor="end">{Math.round(v)}</text></g>)}
      {dayLabels.map((label,i)=><g key={label}><text x={x(i)} y={height-8} textAnchor="middle">{label}</text></g>)}
      {segments(previous).map((group,i)=><polyline key={'previous'+i} points={points(group)} fill="none" stroke="#a5a2c9" strokeWidth="2" strokeDasharray="6 6"/>)}
      {segments(current).map((group,i)=><g key={i}><polygon points={x(group[0][0])+','+(height-bottom)+' '+points(group)+' '+x(group.at(-1)[0])+','+(height-bottom)} fill="url(#chart-fill)"/><polyline points={points(group)} fill="none" stroke="#9876ff" strokeWidth="2.5"/></g>)}
      {current.map((v,i)=>Number.isFinite(v)&&<circle key={i} cx={x(i)} cy={y(v)} r="4.3" fill="#9876ff"><title>{dayLabels[i]+': '+v+' visitas'}</title></circle>)}
    </svg></div>
    <div className="chart-accessible"><details><summary>Ver valores do gráfico</summary><table><thead><tr><th>Dia</th><th>Período</th><th>Anterior</th></tr></thead><tbody>{dayLabels.map((day,i)=><tr key={day}><th>{day}</th><td>{formatNumber(current[i])}</td><td>{formatNumber(previous?.[i])}</td></tr>)}</tbody></table></details></div>
    <p className="panel-note">Dias futuros ou sem coleta ficam sem pontos. Uma semana em andamento ainda não permite comparar os totais com uma semana completa.</p>
  </Panel>;
}

export function Funnel({ data }) {
  const rows = [['Visitas', data.visits], ['Viram os pacotes', data.packagesReached], ['Escolheram um pacote', data.packageSessions??data.packageClicks], ['Clicaram no WhatsApp', data.whatsappSessions??data.whatsappClicks], ['Contatos do site', data.websiteReceivedContacts], ['Orçamentos do site', data.websiteQuoteRequests]];
  return <Panel title="Da visita ao orçamento" className="funnel-panel"><div className="funnel-rows">{rows.map(([label, value],index) => <div className={'funnel-row '+(index>=4?'verified-stage':'')} key={label}><span><i>{String(index+1).padStart(2,'0')}</i>{label}</span><div className="bar-track"><div className="bar-fill" style={{ width: value==null?'0%':Math.min(rate(value, data.visits),100) + '%' }} /></div><strong>{formatNumber(value)}</strong></div>)}</div><div className="conversion-total"><span>Orçamentos do site / visitas</span><strong>{data.websiteQuoteRequests==null||!(data.visits>0)?'—':formatPercent(rate(data.websiteQuoteRequests, data.visits))}</strong></div><p className="panel-note">Somente contatos com origem no site identificada. Indicador do período, sem equivalência entre sessões e pessoas; o contato pode chegar em outra semana.</p></Panel>;
}
