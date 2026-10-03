// Shared deterministic renderer: the browser export and scheduled sender use the same data.
import {fontBase64} from './font-data.js';
import {recommendations} from './recommendations.js';
const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const val = n => Number.isFinite(n) ? fmt.format(n) : 'Não disponível';
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const text = (s,x,y,size=26,color='#f7f0ff',weight=400,anchor='start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${escape(s)}</text>`;
function lines(s,x,y,width=60,size=24,color='#bbb3c9') {
  const words=String(s||'').split(/\s+/);let line='',out='',row=0;
  for(const word of words){if((line+' '+word).length>width&&line){out+=text(line,x,y+row++*(size+12),size,color);line=word;}else line+=(line?' ':'')+word;}
  return out+text(line,x,y+row*(size+12),size,color);
}
const box=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="15" fill="#141019" stroke="#39224d"/>`;
function change(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&b>0?`${a>=b?'+':''}${val((a-b)/b*100)}% vs. semana anterior`:'Sem comparação disponível';}
function kpi(label,a,b,x,y){return box(x,y,450,160)+text(label,x+24,y+39,24,'#c3b6d5')+text(val(a),x+24,y+91,Number.isFinite(a)?44:28,'#fff',700)+text(change(a,b),x+24,y+133,20,'#b983ff');}
function bars(items,x,y,width=870,maxRows=4){
 const rows=(items||[]).filter(r=>Number.isFinite(r[1])).slice(0,maxRows),max=Math.max(1,...rows.map(r=>r[1]));
 if(!rows.length)return text('Aguardando dados desta fonte.',x,y+25,24,'#a99fb9');
 return rows.map(([label,n],i)=>text(label,x,y+i*67,24)+text(val(n),x+width+52,y+i*67,24,'#ddd',400,'end')+`<rect x="${x}" y="${y+12+i*67}" width="${width}" height="12" rx="6" fill="#2a2134"/><rect x="${x}" y="${y+12+i*67}" width="${Math.max(2,width*n/max)}" height="12" rx="6" fill="url(#violet)"/>`).join('');
}
function lineChart(current,previous){
 if(!Array.isArray(current)||!current.every(Number.isFinite))return text('Aguardando coleta diária.',84,681,26,'#bbb3c9');
 const max=Math.max(1,...current,...(previous||[]).filter(Number.isFinite));
 const points=rows=>rows.map((n,i)=>`${90+i*149},${760-n/max*168}`).join(' ');
 return `<path d="M90 770H984" stroke="#39224d"/><polyline points="${points(current)}" fill="none" stroke="#bd78ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`+(Array.isArray(previous)&&previous.every(Number.isFinite)?`<polyline points="${points(previous)}" fill="none" stroke="#695876" stroke-width="3" stroke-dasharray="8 8"/>`:'')+['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map((d,i)=>text(d,73+i*149,811,21,'#aaa')).join('');
}
function heading(label,y){return text(label,72,y,30,'#fff',700)+`<path d="M72 ${y+17}H1008" stroke="#39224d"/>`;}
export function renderReportSvg(snapshot,type='website',options={}){
 if(!['website','instagram'].includes(type))throw new Error('Invalid report type');
 const c=snapshot.current||{},p=snapshot.previous||{},period=snapshot.period||{};
 const label=type==='website'?'SITE + CONTATOS':'INSTAGRAM';
 let body=text('TUNA',72,89,45,'#fff',800)+text('STREAM',215,89,45,'#bd78ff',800)+text('RELATÓRIO DA SEMANA',72,139,22,'#bbaace',600)+text(label,72,211,44,'#fff',700)+text(period.label||`${period.start} a ${period.end}`,72,254,26,'#bbaace');
 if(type==='website'){
  body+=kpi('Visitas no site',c.visits,p.visits,72,298)+kpi('Visitantes únicos',c.uniqueVisitors,p.uniqueVisitors,558,298)+kpi('Contatos vindos do site',c.websiteReceivedContacts,p.websiteReceivedContacts,72,478)+kpi('Orçamentos vindos do site',c.websiteQuoteRequests,p.websiteQuoteRequests,558,478);
  body+=heading('O caminho até a conversa',705)+bars([['Visitas',c.visits],['Chegaram aos pacotes',c.packagesReached],['Clicaram no WhatsApp',c.whatsappClicks],['Enviaram mensagem com referência',c.websiteReceivedContacts]],86,759,870);
  body+=text('Cliques indicam intenção. Contatos exigem mensagem recebida.',72,1050,22,'#9e94ac');
  body+=heading('Pacotes que despertaram interesse',1123)+bars((c.packages||[]).map(r=>[r.name,r.clicks]),86,1170,870);
  body+=text('Principal origem: '+(c.topSource||'Não disponível'),72,1490,25)+text('Principal estado: '+(c.topRegion||'Não disponível'),72,1535,25);
  body+=text('Tempo médio ativo: '+(Number.isFinite(c.averageDuration)?val(Math.round(c.averageDuration))+' segundos':'Não disponível'),72,1585,25)+text('Seção em destaque: '+(c.topSection||'Não disponível'),72,1630,25)+text('Pacote mais clicado: '+(c.topPackage||'Não disponível'),72,1675,25);
  body+=text('Cliques no WhatsApp / visitas: '+(Number.isFinite(c.whatsappClicks)&&c.visits>0?val(c.whatsappClicks/c.visits*100)+'%':'Não disponível'),72,1720,25);
 }else{
  body+=kpi('Alcance da conta',c.instagramReach,p.instagramReach,72,298)+kpi('Visitas ao perfil',c.profileVisits,p.profileVisits,558,298)+kpi('Seguidores atuais',c.followersTotal,p.followersTotal,72,478)+kpi('Saldo de seguidores',c.netFollowers,p.netFollowers,558,478);
  body+=heading('Conteúdos em destaque por alcance',712);
  const posts=[...(c.media||c.posts||[])].filter(r=>Number.isFinite(r.reach)).sort((a,b)=>b.reach-a.reach).slice(0,3);
  if(!posts.length)body+=text('Aguardando conexão e métricas do Instagram.',86,770,26,'#bbb3c9');
  posts.forEach((post,i)=>{
   const y=755+i*204,thumbnail=options.thumbnails?.[post.id];
   body+=box(72,y,936,184);
   body+=thumbnail&&/^data:image\/(png|jpeg|webp);base64,/.test(thumbnail)?`<image href="${escape(thumbnail)}" x="88" y="${y+16}" width="132" height="152" preserveAspectRatio="xMidYMid slice"/>`:`<rect x="88" y="${y+16}" width="132" height="152" rx="9" fill="#28113f"/>`+text(String(i+1).padStart(2,'0'),112,y+106,52,'#b983ff',700);
   body+=lines(post.title||'Conteúdo do Instagram',245,y+43,45,25,'#fff')+text((post.format||post.channel||'Feed')+' · '+val(post.reach)+' de alcance',245,y+126,23,'#ba87ed')+text(val(post.shares)+' compart. · '+val(post.saves)+' salvos',245,y+158,21,'#bbaace');
  });
  body+=heading('Feed, Reels e Stories',1433)+lines('Veja as miniaturas, os links e as métricas de cada formato no painel. Alcance por post não representa pessoas únicas da conta.',72,1490,68,24);
  body+=text('Novos seguidores: '+val(c.followersGained)+' · Perdidos: '+val(c.followersLost),72,1600,25)+text('Cliques na bio: '+val(c.bioClicks),72,1645,25);
 }
 body+=heading('Próximos passos',1783);
 const tips=recommendations(c).filter(item=>item.source===type).slice(0,2);
 if(!tips.length)body+=lines('Ainda não há dados suficientes para sugerir uma melhoria específica. Acompanhe os próximos períodos no painel.',72,1843,66,24);
 tips.forEach((tip,i)=>{body+=text(tip.title,72,1843+i*146,26,'#c58bff',600)+lines(tip.body,72,1886+i*146,68,23);});
 const footer=snapshot.demo?'DEMONSTRAÇÃO • Dados ilustrativos • Sem envio real':'Horário de Brasília • Dados disponíveis no período';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="2160" viewBox="0 0 1080 2160"><defs><style>@font-face{font-family:Poppins;src:url(data:font/ttf;base64,${fontBase64})}</style><linearGradient id="violet"><stop stop-color="#7227dc"/><stop offset="1" stop-color="#c778ff"/></linearGradient></defs><rect width="1080" height="2160" fill="#080809"/><path d="M0 0H1080V8H0Z" fill="url(#violet)"/><path d="M930 0V185L1080 300" stroke="#7227dc" opacity=".35" fill="none" stroke-width="2"/><g font-family="Poppins, sans-serif">${body}<path d="M72 2085H1008" stroke="#39224d"/>${text(footer,72,2125,21,'#bbaace')}</g></svg>`;
}
