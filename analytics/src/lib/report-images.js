import { renderReportSvg } from '../../supabase/functions/_shared/report-image.js';
export { renderReportSvg };
export function reportImageUrl(snapshot,type){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(renderReportSvg(snapshot,type));}
export async function downloadReportImage(snapshot,type){
 const svg=renderReportSvg(snapshot,type),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=2160;
  canvas.getContext('2d').drawImage(image,0,0);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('Image export failed');
  const png=URL.createObjectURL(blob),link=document.createElement('a');link.href=png;
  link.download='tunastream-'+(snapshot.demo?'demonstracao-':'')+(type==='website'?'site':'instagram')+'-'+snapshot.period.start+'.png';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(png),1000);
 }finally{URL.revokeObjectURL(url);}
}
