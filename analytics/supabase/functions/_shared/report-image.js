// The same controlled SVG is used by browser download and the server PNG renderer.
import {fontBase64} from './font-data.js';
import {packageLabels} from '../../../src/sales.js';
import {comparableInstagram} from './instagram-quality.js';
import {addDays} from '../../../src/periods.js';
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
 const tone=/Vendas|compraram|Recebimentos/.test(label)?['#102820','#72f5b7']:/Visualizações|Não seguidores/.test(label)?['#29142b','#ff9ddd']:/Visitas|Visitantes|Interações/.test(label)?['#102332','#78d9ff']:['#201330','#c79aff'];
 return rect(x,y,456,184,tone[0])+rect(x,y,6,184,tone[1],3)+t(label,x+24,y+38,label.length>25?21:25,tone[1],500)+t(number,x+24,y+99,52,'#fff',600)+t(d.label,x+24,y+147,25,d.color,600)+t('antes: '+val(b)+(Number.isFinite(b)?unit:''),x+432,y+147,20,'#bfb6cc',400,'end');
}
const heading=(label,y,detail='')=>rect(64,y-29,5,34,'#78d9ff',2)+t(label,80,y,32,'#d7c6ff',600)+(detail?t(detail,80,y+39,22,'#bbb2c6'):'');
function daily(values,y,period){
 let days=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],rows=values||[];
 if(rows.length>7){const source=rows;rows=[];days=[];const date=offset=>addDays(period.start,offset).slice(5).split('-').reverse().join('/');for(let offset=0;offset<source.length;offset+=6){const group=source.slice(offset,offset+6).filter(Number.isFinite);rows.push(group.length?group.reduce((sum,n)=>sum+n,0):null);days.push(date(offset)+'–'+date(Math.min(offset+5,source.length-1)));}}
 const length=rows.length||7,max=Math.max(1,...rows.filter(Number.isFinite)),step=952/length,barWidth=Math.min(100,step*.65);
 let out='';
 for(let i=0;i<length;i++){const center=64+(i+.5)*step,x=center-barWidth/2,v=rows[i],h=Number.isFinite(v)?v/max*170:0;out+=rect(x,y+35,barWidth,170,'#20182c',6);if(h>0)out+=rect(x,y+205-h,barWidth,h,'#bb6cff',6);out+=t(val(v),center,y+23,23,'#f7f0ff',400,'middle')+t(days[i],center,y+245,days[i]?.length>7?18:22,'#b7a9c9',400,'middle');}
 return out;
}
function tableRows(rows,labels,y){
 const third=Boolean(labels[2]),countX=third?720:992;
 let out=t(labels[0],80,y,22,'#a99eb9')+t(labels[1],countX,y,22,'#a99eb9',400,'end')+(third?t(labels[2],992,y,22,'#a99eb9',400,'end'):'')+rule(y+20);
 if(!rows.length)return out+t('Aguardando dados desta fonte.',80,y+75,27,'#a99eb9');
 rows.slice(0,4).forEach((row,i)=>{const ry=y+77+i*77;out+=t(short(row[0],35),80,ry,26)+t(val(row[1]),countX,ry,31,'#fff',600,'end')+(third?t(val(row[2]),992,ry,31,'#bb6cff',600,'end'):'')+rule(ry+25);});return out;
}
export function renderReportSvg(snapshot,type='website'){
 if(!['website','instagram'].includes(type))throw new Error('Invalid report type');
 const c=snapshot.current||{},p=snapshot.previous||{},period=snapshot.period||{};
 const metricool=type==='instagram'&&c.instagramSource?.provider==='metricool';
 const dated=(label,day)=>day?label+' · '+day.split('T')[0].slice(5).split('-').reverse().join('/'):label;
 const imported=(c.media||[]).filter(post=>post.provider==='metricool');
 const sum=key=>imported.length&&imported.every(post=>Number.isFinite(post[key]))?imported.reduce((total,post)=>total+post[key],0):null;
 const sums=['likes','comments','saves','shares'].map(sum),interactions=sums.every(Number.isFinite)?sums.reduce((total,n)=>total+n,0):null;
 const partial=type==='website'&&c.sourceCoverage?.website==='partial'||type==='instagram'&&c.sourceCoverage?.instagram==='partial';
 const before=partial||type==='instagram'&&!snapshot.demo&&!comparableInstagram(c,p)?{}:p;
 let body=t('TUNA',64,90,46,'#fff',600)+t('STREAM',215,90,46,'#bb6cff',600)+t('DESEMPENHO DO PERÍODO',64,142,22,'#b7a9c9')+t(type==='website'?'SITE & VENDAS':'INSTAGRAM',64,215,54,'#fff',600)+t(period.label||`${period.start} a ${period.end}`,64,263,26,'#c3b7d3');
 if(type==='website'){
  body+=metric('Visitas',c.visits,before.visits,64,310)+metric('Visitantes únicos',c.uniqueVisitors,before.uniqueVisitors,560,310)+metric('Recebimentos do site',c.websiteReceivedContacts,before.websiteReceivedContacts,64,518)+metric('Clientes identificados',c.uniqueClients,before.uniqueClients,560,518)+metric('Vendas fechadas',c.closed,before.closed,64,726)+metric('Clientes que compraram',c.buyingClients,before.buyingClients,560,726);
  body+=heading(c.dailyVisits?.length>7?'VISITAS POR FAIXA DE 6 DIAS':'MOVIMENTO POR DIA',990)+daily(c.dailyVisits,1025,period);
  body+=heading('PACOTES MAIS VENDIDOS',1380,'Vendas por data de fechamento · inclui personalizados');
  const sold=[...(c.sales?.salesByPackage||[]).filter(row=>row.won>0&&row.package!=='CUSTOM').map(row=>[packageLabels[row.package]||row.package,row.won,'—']),...(c.sales?.customPackages||[]).map(([name,n])=>[name,n,'—'])].sort((a,b)=>b[1]-a[1]);
  body+=tableRows(sold,['Pacote','Vendas',''],1470);
  body+=heading('SERVIÇOS & REGIÕES',1900);
  const service=c.sales?.salesByService?.[0],region=c.sales?.salesByRegion?.[0];
  body+=t('Serviço mais vendido',80,1950,22,'#b7a9c9')+t(short(service?.[0]||'Não disponível',48),80,1984,25,'#fff',600)+t(service?val(service[1])+' venda(s)':'',990,1984,23,'#6bf2b2',400,'end')+t('Região com mais compras',80,2017,22,'#b7a9c9')+t(region?region[0]+' · '+val(region[1])+' venda(s)':'Não disponível',990,2017,24,'#fff',600,'end');
 }else{
  if(metricool){
   body+=metric(dated('Alcance diário',c.instagramReachAsOf),c.instagramLastDailyReach,null,64,310)+metric(c.instagramViewsDays?.length===1?dated('Visualizações',c.instagramViewsDays[0]):'Visualizações informadas',c.instagramViewsObserved,null,560,310)+metric(dated('Seguidores',c.followersAsOf),c.followersTotal,null,64,518)+metric('Posts importados',imported.length||null,null,560,518)+metric('Interações nos posts',interactions,null,64,726)+metric('Visualizações dos posts',sum('views'),null,560,726);
   body+=heading('DETALHES DOS POSTS',994)+rect(64,1030,952,140)+t('Curtidas',90,1077,25,'#b7a9c9')+t(val(sum('likes')),90,1138,45,'#6bf2b2',600)+t('Comentários',420,1077,25,'#b7a9c9')+t(val(sum('comments')),420,1138,45,'#f3a0bf',600)+t('Salvos',740,1077,25,'#b7a9c9')+t(val(sum('saves')),740,1138,45,'#fff',600);
  }else{
   body+=metric('Alcance',c.instagramReach,before.instagramReach,64,310)+metric('Visualizações',c.instagramViews,before.instagramViews,560,310)+metric(dated('Seguidores atuais',c.followersAsOf),c.followersTotal,null,64,518)+metric('Interações no conteúdo',c.totalInteractions,before.totalInteractions,560,518)+metric('Visualizações · seguidores',c.viewsFollowers,before.viewsFollowers,64,726)+metric('Não seguidores · visualizações',c.viewsNonFollowers,before.viewsNonFollowers,560,726);
   body+=heading('INTERAÇÕES NO PERÍODO',994)+rect(64,1030,952,140,'#142032')+t('Curtidas',90,1077,25,'#b8d7ed')+t(val(c.instagramLikes),90,1138,45,'#78d9ff',600)+t('Compartilhamentos',395,1077,25,'#c6b5e4')+t(val(c.instagramShares),420,1138,45,'#d2a5ff',600)+t('Salvos',780,1077,25,'#e6bad7')+t(val(c.instagramSaves),780,1138,45,'#ff9ddd',600);
  }
  body+=heading('CONTEÚDOS DE MAIOR ALCANCE',1270,'Posts do período · métricas acumuladas até a consulta');
  const posts=[...(c.media||c.posts||[])].filter(post=>Number.isFinite(post.reach)).sort((a,b)=>b.reach-a.reach).slice(0,3);
  if(!posts.length)body+=t('Aguardando autorização e métricas do Instagram.',80,1350,26,'#a99eb9');
  posts.forEach((post,i)=>{const y=1330+i*180;const consulted=post.collectedAt?' · consulta '+new Date(post.collectedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'';body+=rect(64,y,952,158)+t(String(i+1).padStart(2,'0'),88,y+58,32,'#bb6cff',600)+t(short(post.title||post.caption,39),153,y+56,26,'#fff',600)+t((post.format||post.channel||'Feed')+consulted,153,y+102,22,'#b7a9c9')+t(val(post.reach),988,y+104,40,'#fff',600,'end')+t('de alcance',988,y+139,20,'#a99eb9',400,'end');});
  body+=heading('ALCANCE MÉDIO POR FORMATO',1900);
  const all=c.media||c.posts||[];
  ['feed','reels','stories'].forEach((channel,i)=>{const items=all.filter(post=>(post.channel||(post.format==='Reel'?'reels':post.format==='Story'?'stories':'feed'))===channel&&Number.isFinite(post.reach)),mean=items.length?Math.round(items.reduce((sum,post)=>sum+post.reach,0)/items.length):null,x=80+i*325;body+=t(['Feed','Reels','Stories'][i],x,1954,26,'#b7a9c9')+t(val(mean),x,2003,37,'#fff',600);});
 }
 const source=c.instagramSource;
 const footer=snapshot.demo?'DEMONSTRAÇÃO · Dados ilustrativos':type==='instagram'&&source?`${source.provider==='metricool'?'Metricool':'Meta'} · Consulta ${new Date(source.collectedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})} · ${c.sourceHealth?.instagram?.status==='error'?'Falha na atualização':source.coverage==='complete'?'Período completo':'Histórico parcial'}`:partial?'Período parcial · Sem comparação dos totais':'Dados disponíveis no período · Horário de Brasília';
 body+=rule(2061)+t(footer,64,2110,22,'#a99eb9');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2160" viewBox="0 0 1080 2160"><defs><style>@font-face{font-family:Poppins;src:url(data:font/ttf;base64,${fontBase64})}</style></defs><rect width="1080" height="2160" fill="#080809"/><rect width="1080" height="8" fill="#bb6cff"/><g font-family="Poppins, sans-serif">${body}</g></svg>`;
}
