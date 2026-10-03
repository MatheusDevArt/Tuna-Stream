import {useEffect,useRef,useState} from 'react';
import {Download,X} from 'lucide-react';
import {downloadReportImage,reportImageUrl} from '../lib/report-images.js';
export default function ReportDialog({open,onClose,snapshot}){
 const dialogRef=useRef(null),[type,setType]=useState('website'),[feedback,setFeedback]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const dialog=dialogRef.current;if(open&&!dialog.open){setFeedback('');dialog.showModal();}if(!open&&dialog.open)dialog.close();},[open]);
 async function download(){setBusy(true);setFeedback('');try{await downloadReportImage(snapshot,type);setFeedback('Imagem PNG pronta para compartilhar.');}catch{setFeedback('Não foi possível gerar a imagem agora. Tente novamente.');}finally{setBusy(false);}}
 return <dialog ref={dialogRef} className="report-dialog" aria-labelledby="report-title" onCancel={onClose} onClose={onClose} onClick={event=>{if(event.target===dialogRef.current)onClose();}}><div className="dialog-inner"><div className="dialog-header"><div><h2 id="report-title">Duas imagens, uma visão da semana</h2><p>Site e Instagram em relatórios separados.</p></div><button className="icon-button" onClick={onClose} aria-label="Fechar relatório"><X/></button></div>
 {snapshot.demo&&<p className="notice">Demonstração com exemplos. Nenhuma mensagem será enviada.</p>}
 <div className="button-row report-image-tabs">{[['website','Site + contatos'],['instagram','Instagram']].map(([id,label])=><button key={id} className={'button '+(type===id?'primary':'secondary')} aria-pressed={type===id} onClick={()=>{setType(id);setFeedback('');}}>{label}</button>)}</div>
 <img className="report-image-preview" src={reportImageUrl(snapshot,type)} alt={'Relatório de '+(type==='website'?'site e contatos':'Instagram')+' · '+snapshot.period.label}/>
 <div className="dialog-footer"><button className="button primary" onClick={download} disabled={busy}><Download size={17}/>{busy?'Gerando imagem…':'Baixar imagem PNG'}</button><p className="feedback" role="status">{feedback}</p></div></div></dialog>;
}
