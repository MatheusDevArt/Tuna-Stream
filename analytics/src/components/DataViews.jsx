import {useId} from 'react';
import {formatNumber,formatPercent,variation} from '../report.js';
const colors=['#bb6cff','#6bf2b2','#ee8cdb','#837ead','#555263'];
const clean=items=>(items||[]).filter(row=>Number.isFinite(row[1])&&row[1]>=0);
export function DataList({items,percentage=false,ranked=false}){
 const rows=clean(items);
 if(!rows.length)return <p className="empty-explanation">Ainda não há dados disponíveis.</p>;
 return <ol className={'data-list'+(ranked?' numbered':'')}>{rows.map(([label,value],i)=><li key={label}>{ranked&&<span className="data-rank">{String(i+1).padStart(2,'0')}</span>}<span>{label}</span><strong>{percentage?formatPercent(value):formatNumber(value)}</strong></li>)}</ol>;
}
export function Distribution({items,percentage=true}){
 const id=useId(),rows=clean(items),total=rows.reduce((sum,row)=>sum+row[1],0);let offset=0;
 if(!total)return <p className="empty-explanation">Ainda não há distribuição disponível.</p>;
 return <div className="distribution"><svg viewBox="0 0 200 200" role="img" aria-labelledby={id}><title id={id}>{rows.map(([label,value])=>label+': '+(percentage?formatPercent(value):formatNumber(value))).join('; ')}</title><circle cx="100" cy="100" r="72" fill="none" stroke="#292132" strokeWidth="23"/>{rows.map(([label,value],i)=>{const length=value/total*100,start=offset;offset+=length;return <circle key={label} cx="100" cy="100" r="72" pathLength="100" fill="none" stroke={colors[i%colors.length]} strokeWidth="23" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start} transform="rotate(-90 100 100)"/>;})}<text x="100" y="99" textAnchor="middle" className="donut-value">{percentage?formatPercent(rows[0][1]):formatNumber(total)}</text><text x="100" y="122" textAnchor="middle" className="donut-label">{percentage?rows[0][0]:'total'}</text></svg><ul className="distribution-key">{rows.map(([label,value],i)=><li key={label}><i style={{background:colors[i%colors.length]}}/><span>{label}</span><strong>{percentage?formatPercent(value):formatNumber(value)}</strong></li>)}</ul></div>;
}
export function ColumnChart({items,percentage=false}){
 const rows=clean(items),max=percentage?100:Math.max(1,...rows.map(row=>row[1]));
 if(!rows.length)return <p className="empty-explanation">Ainda não há dados disponíveis.</p>;
 return <div className="column-chart" role="list">{rows.map(([label,value])=><div className="column" role="listitem" key={label}><strong>{percentage?formatPercent(value):formatNumber(value)}</strong><div className="column-space"><div className="column-fill" style={{height:Math.min(100,value/max*100)+'%'}}/></div><span>{label}</span></div>)}</div>;
}
export function Comparison({current,previous,items}){
 return <div className="comparison-list">{items.map(([key,label,inverse=false])=>{const change=variation(current[key],previous[key]),good=change!==null&&(inverse?change<0:change>0);return <div key={key}><span>{label}</span><strong>{formatNumber(current[key])}</strong><span className={'comparison-delta '+(change===null||change===0?'neutral':good?'positive':'negative')}>{change===null?'Sem comparação':change===0?'Estável':`${change>0?'↑':'↓'} ${formatPercent(Math.abs(change))}`}</span></div>;})}<p className="panel-note">Comparação com a semana anterior. Períodos sem base suficiente ficam sem comparação.</p></div>;
}
