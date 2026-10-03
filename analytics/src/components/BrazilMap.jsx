import { useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import states from '../geo/brazil-map.json';
import { Panel } from './Metrics.jsx';
import { distributeRegions } from '../regions.js';
import { formatNumber,formatPercent,rate } from '../report.js';

export default function BrazilMap({ snapshot,title='De onde vem seu público',unit='visitantes',context='Visitantes únicos por estado' }) {
 const [selected,setSelected] = useState('RJ');
 const counts = snapshot.demo ? distributeRegions(snapshot.current.uniqueVisitors) : snapshot.current.stateVisitors || {};
 const total=snapshot.current.geoUniqueVisitors??snapshot.current.uniqueVisitors;
 const ranked = states.map(state=>({...state,count:counts[state.abbr] ?? null})).filter(state=>state.count!=null).sort((a,b)=>b.count-a.count);
 const maximum = Math.max(...ranked.map(state=>state.count),1);
 const current = states.find(state=>state.abbr===selected);
 const count = counts[selected] ?? null;
 return <Panel title={title} className="brazil-panel" action={<span className="panel-context">{context}</span>}>
   <div className="brazil-layout">
    <div className="brazil-canvas"><svg viewBox="0 0 400 390" role="group" aria-label="Mapa interativo do Brasil por estado">
      <defs><pattern id="map-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#7227dc" strokeOpacity=".14" strokeWidth=".5"/></pattern><filter id="map-glow"><feGaussianBlur stdDeviation="2" /></filter></defs>
      <rect width="400" height="390" fill="url(#map-grid)" />
      {states.map(state=><path key={state.abbr} d={state.path} fillRule="evenodd" fill={counts[state.abbr] > 0 ? 'rgba(114,39,220,' + (.14 + .66 * (counts[state.abbr] / maximum)) + ')' : '#130c20'} stroke={state.abbr===selected ? '#ebc8ff' : '#a270d8'} strokeWidth={state.abbr===selected ? 1.6 : .75} role="button" tabIndex={0} aria-label={state.name + ': ' + (counts[state.abbr]==null ? 'dados indisponíveis' : formatNumber(counts[state.abbr])+' '+unit)} aria-pressed={state.abbr===selected} onClick={()=>setSelected(state.abbr)} onKeyDown={event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();setSelected(state.abbr);}}}><title>{state.name}</title></path>)}
      {ranked.filter(state=>state.count>0).slice(0,3).map(state=><g key={state.abbr} className="map-marker" pointerEvents="none"><circle cx={state.point[0]} cy={state.point[1]} r="10" fill="#c15bff" opacity=".28" className="marker-pulse"/><circle cx={state.point[0]} cy={state.point[1]} r="3.5" fill="white" stroke="#bd5dff" strokeWidth="2"/><text x={state.point[0]+9} y={state.point[1]-8}>{state.abbr}</text></g>)}
    </svg><p className="map-attribution">Malha: <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noopener noreferrer">IBGE</a> · localização aproximada{snapshot.current.geographySource&&<span> · {snapshot.current.geographySource}</span>}</p></div>
    <div className="brazil-details"><div className="state-ranking">{ranked.slice(0,3).map((state,index)=><button key={state.abbr} aria-pressed={state.abbr===selected} onClick={()=>setSelected(state.abbr)}><span className="rank-index">{index+1}</span><span className="state-name">{state.name}<span className="bar-track"><span className="bar-fill" style={{width:rate(state.count,maximum)+'%'}}/></span></span><strong>{formatNumber(state.count)}</strong></button>)}</div>
      <label className="state-picker">Explorar estado<select aria-label="Explorar estado" value={selected} onChange={event=>setSelected(event.target.value)}>{[...states].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(state=><option key={state.abbr} value={state.abbr}>{state.name}</option>)}</select></label>
      <div className="selected-state" aria-live="polite"><div><MapPin size={19}/><span>Estado selecionado</span></div><h3>{current.name}<ChevronRight size={15}/></h3><strong>{count==null?'Não disponível':formatPercent(rate(count,total))}</strong><p>{count==null?'Aguardando coleta':formatNumber(count)+' de '+formatNumber(total)+' '+unit}</p></div>
    </div>
   </div>
 </Panel>;
}
