import { useRef,useEffect,useState } from 'react';
import { Eye, Heart, Bookmark, Send, ExternalLink, X, Layers, Clapperboard, MessageCircle, ImageOff,Image as ImageIcon } from 'lucide-react';
import { formatNumber,formatPercent } from '../report.js';
import { business } from '../data.js';
import { isInstagramContentUrl,engagement } from '../content.js';

export default function ContentCards({ items, channel }) {
 const [preview,setPreview] = useState(null);
 const [broken,setBroken] = useState({});
 const dialog = useRef(null);
 useEffect(()=>{if(preview&&!dialog.current.open)dialog.current.showModal();if(!preview&&dialog.current.open)dialog.current.close();},[preview]);
 return <>
 <div className={'content-grid '+(channel==='stories'?'story-grid':'')}>{items.map(item=>{
  const availableLink=!item.demo&&!item.expired&&isInstagramContentUrl(item.permalink);
  const thumbnail=item.thumbnail || item.thumbnail_url || (item.media_type!=='VIDEO'?item.media_url:null);
  const Icon=item.channel==='reels'?Clapperboard:item.channel==='stories'?MessageCircle:item.format==='Carrossel'?Layers:ImageIcon;
  const statistics=item.channel==='stories'?[['Alcance',item.reach,Eye],['Respostas',item.replies,MessageCircle],['Cliques no link',item.linkTaps,ExternalLink]]:[['Alcance',item.reach,Eye],['Visualizações',item.views,Eye],['Curtidas',item.likes,Heart],['Comentários',item.comments,MessageCircle],['Salvos',item.saves,Bookmark],['Compartilhados',item.shares,Send],['Interações / alcance',engagement(item),Eye]];
  return <article className="content-card" key={item.id}>
    <div className="content-image">{thumbnail&&!broken[item.id]&&!item.expired?<img src={thumbnail} alt={'Miniatura: '+item.title} loading="lazy" onError={()=>setBroken({...broken,[item.id]:true})}/>:<div className="unavailable-media"><ImageOff size={30}/><span>{item.expired?'Story expirado':'Prévia indisponível'}</span></div>}
    {item.demo&&<span className="sample-label">Exemplo visual</span>}{item.expired&&<span className="expiry-label">Expirado</span>}</div>
    <div className="content-card-body"><div className="content-title"><h3>{item.title||'Publicação sem legenda'}</h3><span><Icon size={13}/>{item.format}</span></div><dl className="content-statistics">{statistics.map(([label,value,StatIcon])=><div key={label}><dt><StatIcon size={14}/>{label}</dt><dd>{value==null?'Não disponível':label==='Interações / alcance'?formatPercent(value):formatNumber(value)}</dd></div>)}</dl>
    <div className="content-actions"><button className="button primary" disabled={!thumbnail||item.expired||broken[item.id]} onClick={()=>setPreview({...item,thumbnail})}><Eye size={16}/>Ver prévia</button>{availableLink?<a className="button secondary" href={item.permalink} target="_blank" rel="noopener noreferrer">Abrir publicação<ExternalLink size={14}/></a>:item.demo&&!item.expired?<a className="button secondary" href={business.instagram} target="_blank" rel="noopener noreferrer">Abrir perfil<ExternalLink size={14}/></a>:<button className="button secondary" disabled>Link indisponível</button>}</div>
    {item.demo&&<p className="content-disclosure">Imagem de demonstração. Link da publicação após conectar a conta.</p>}</div>
  </article>;
 })}</div>
 {items.length===0&&<p className="empty-explanation">Nenhum conteúdo disponível neste formato e período.</p>}
 <dialog ref={dialog} className="media-dialog" aria-labelledby="media-preview-title" onCancel={()=>setPreview(null)} onClose={()=>setPreview(null)} onClick={event=>{if(event.target===dialog.current)setPreview(null);}}>{preview&&<><div className="dialog-header"><div><h2 id="media-preview-title">{preview.title}</h2><p>{preview.demo?'Imagem ilustrativa do portfólio, sem publicação importada.':preview.format}</p></div><button className="icon-button" aria-label="Fechar prévia" onClick={()=>setPreview(null)}><X/></button></div><img src={preview.thumbnail} alt={preview.title}/></>}</dialog>
 </>;
}
