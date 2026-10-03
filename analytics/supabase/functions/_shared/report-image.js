// The same controlled SVG is used by browser download and the server PNG renderer.
import {fontBase64} from './font-data.js';
const fmt=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
const val=n=>Number.isFinite(n)?fmt.format(n):'—';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const t=(s,x,y,size=26,color='#f7f0ff',weight=400,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${escape(s)}</text>`;
const rect=(x,y,w,h,fill='#16111f',rx=12)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const rule=y=>`<path d="M64 ${y}H1016" stroke="#392c46" fill="none"/>`;
const short=(s,n=42)=>String(s||'Não disponível').length>n?String(s).slice(0,n-1)+'…':String(s||'Não disponível');
function delta(a,b,inverse=false){
 if(!Number.isFinite(a)||!Number.isFinite(b))return {label:'Sem comparação',color:'#a99eb9'};
 if(b===0&&a!==0)return {label:'Antes: 0 · sem %',color:'#a99eb9'};
 const d=b===0?0:(a-b)/Math.abs(b)*100;
 return {label:d===0?'Estável':(d>0?'+':'')+val(d)+'%',color:d===0?'#a99eb9':(inverse?d<0:d>0)?'#6bf2b2':'#f3a0bf'};
}
function metric(label,a,b,x,y,unit='',inverse=false){
 const d=delta(a,b,inverse),number=val(a)+(Number.isFinite(a)?unit:'');
 return rect(x,y,456,184)+t(label,x+24,y+38,25,'#c3b7d3')+t(number,x+24,y+99,52,'#fff',600)+t(d.label,x+24,y+147,25,d.color,600)+t('antes: '+val(b)+(Number.isFinite(b)?unit:''),x+432,y+147,20,'#a99eb9',400,'end');
}
const heading=(label,y,detail='')=>t(label,64,y,32,'#fff',600)+(detail?t(detail,64,y+39,22,'#a99eb9'):'');
function daily(values,y){
 const days=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],rows=values||[],max=Math.max(1,...rows.filter(Number.isFinite));
 let out='';
 for(let i=0;i<7;i++){const x=88+i*136,v=rows[i],h=Number.isFinite(v)?v/max*170:0;out+=rect(x,y+35,88,170,'#ffffff',6).replace('fill="#ffffff"','fill="#20182c"');if(h>0)out+=rect(x,y+205-h,88,h,'#bb6cff',6);out+=t(val(v),x+44,y+23,23,'#f7f0ff',400,'end')+t(days[i],x+44,y+245,22,'#b7a9c9',400,'end');}
 return out;
}
function tableRows(rows,labels,y){
 let out=t(labels[0],80,y,22,'#a99eb9')+t(labels[1],720,y,22,'#a99eb9',400,'end')+t(labels[2],992,y,22,'#a99eb9',400,'end')+rule(y+20);
 if(!rows.length)return out+t('Aguardando dados desta fonte.',80,y+75,27,'#a99eb9');
 rows.slice(0,4).forEach((row,i)=>{const ry=y+77+i*77;out+=t(short(row[0],35),80,ry,26)+t(val(row[1]),720,ry,31,'#fff',600,'end')+t(val(row[2]),992,ry,31,'#bb6cff',600,'end')+rule(ry+25);});return out;
}
export function renderReportSvg(snapshot,type='website'){
 if(!['website','instagram'].includes(type))throw new Error('Invalid report type');
 const c=snapshot.current||{},p=snapshot.previous||{},period=snapshot.period||{};
 const partial=type==='website'&&c.sourceCoverage?.website==='partial';
 const before=partial?{}:p;
 let body=t('TUNA',64,90,46,'#fff',600)+t('STREAM',215,90,46,'#bb6cff',600)+t('DESEMPENHO DA SEMANA',64,142,22,'#b7a9c9')+t(type==='website'?'SITE & VENDAS':'INSTAGRAM',64,215,54,'#fff',600)+t(period.label||`${period.start} a ${period.end}`,64,263,26,'#c3b7d3');
 if(type==='website'){
  body+=metric('Visitas',c.visits,before.visits,64,310)+metric('Visitantes únicos',c.uniqueVisitors,before.uniqueVisitors,560,310)+metric('Recebimentos do site',c.websiteReceivedContacts,before.websiteReceivedContacts,64,518)+metric('Pediram orçamento',c.websiteQuoteRequests,before.websiteQuoteRequests,560,518)+metric('Orçamentos enviados',c.quoteSent,before.quoteSent,64,726)+metric('Vendas fechadas',c.closed,before.closed,560,726);
  body+=heading('MOVIMENTO POR DIA',990)+daily(c.dailyVisits,1025);
  body+=heading('INTERESSE POR PACOTE',1380,'Pacote de origem dos cliques no site');
  body+=tableRows((c.packages||[]).map(row=>[row.name,row.clicks,row.whatsapp]),['Pacote','Cliques','WhatsApp'],1470);
  body+=heading('QUALIDADE DAS VISITAS',1900);
  const d=delta(c.averageDuration,before.averageDuration),e=delta(c.engagementRate,before.engagementRate);
  body+=t('Tempo médio ativo',80,1963,25,'#b7a9c9')+t(val(c.averageDuration)+' s',440,1963,32,'#fff',600,'end')+t(d.label,440,2006,22,d.color,400,'end')+t('Engajamento',585,1963,25,'#b7a9c9')+t(val(c.engagementRate)+'%',990,1963,32,'#fff',600,'end')+t(e.label,990,2006,22,e.color,400,'end');
 }else{
  body+=metric('Alcance',c.instagramReach,before.instagramReach,64,310)+metric('Visitas ao perfil',c.profileVisits,before.profileVisits,560,310)+metric('Seguidores atuais',c.followersTotal,before.followersTotal,64,518)+metric('Saldo de seguidores',c.netFollowers,before.netFollowers,560,518)+metric('Cliques na bio',c.bioClicks,before.bioClicks,64,726)+metric('Visualizações',c.instagramViews,before.instagramViews,560,726);
  body+=heading('SEGUIDORES NO PERÍODO',994);
  body+=rect(64,1030,952,140)+t('Ganhos',90,1077,25,'#b7a9c9')+t(val(c.followersGained),90,1138,45,'#6bf2b2',600)+t('Perdidos',420,1077,25,'#b7a9c9')+t(val(c.followersLost),420,1138,45,'#f3a0bf',600)+t('Saldo',740,1077,25,'#b7a9c9')+t(val(c.netFollowers),740,1138,45,'#fff',600);
  body+=heading('CONTEÚDOS DE MAIOR ALCANCE',1270);
  const posts=[...(c.media||c.posts||[])].filter(post=>Number.isFinite(post.reach)).sort((a,b)=>b.reach-a.reach).slice(0,3);
  if(!posts.length)body+=t('Aguardando autorização e métricas do Instagram.',80,1350,26,'#a99eb9');
  posts.forEach((post,i)=>{const y=1310+i*180;body+=rect(64,y,952,158)+t(String(i+1).padStart(2,'0'),88,y+58,32,'#bb6cff',600)+t(short(post.title||post.caption,39),153,y+56,26,'#fff',600)+t(post.format||post.channel||'Feed',153,y+102,23,'#b7a9c9')+t(val(post.reach),988,y+104,40,'#fff',600,'end')+t('de alcance',988,y+139,20,'#a99eb9',400,'end');});
  body+=heading('RESULTADO POR FORMATO',1900);
  const all=c.media||c.posts||[];
  ['feed','reels','stories'].forEach((channel,i)=>{const items=all.filter(post=>(post.channel||(post.format==='Reel'?'reels':post.format==='Story'?'stories':'feed'))===channel&&Number.isFinite(post.reach)),mean=items.length?Math.round(items.reduce((sum,post)=>sum+post.reach,0)/items.length):null,x=80+i*325;body+=t(['Feed','Reels','Stories'][i],x,1954,26,'#b7a9c9')+t(val(mean),x,2003,37,'#fff',600);});
 }
 const footer=snapshot.demo?'DEMONSTRAÇÃO · Dados ilustrativos':partial?'Período parcial · Sem comparação dos totais':'Dados disponíveis no período · Horário de Brasília';
 body+=rule(2061)+t(footer,64,2110,22,'#a99eb9');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2160" viewBox="0 0 1080 2160"><defs><style>@font-face{font-family:Poppins;src:url(data:font/ttf;base64,${fontBase64})}</style></defs><rect width="1080" height="2160" fill="#080809"/><rect width="1080" height="8" fill="#bb6cff"/><g font-family="Poppins, sans-serif">${body}</g></svg>`;
}
