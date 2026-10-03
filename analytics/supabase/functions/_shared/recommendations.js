const fmt=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
export function recommendations(data={}){
 const result=[],packs=data.packages||[];
 if(data.visits>0&&packs.length){
  const total=packs.reduce((n,p)=>n+p.clicks,0),clicks=packs.reduce((n,p)=>n+(p.whatsapp||0),0),top=[...packs].sort((a,b)=>b.clicks-a.clicks)[0];
  if(top?.clicks>0&&Number.isFinite(top.whatsapp)&&total>0&&top.whatsapp/top.clicks<clicks/total)result.push({source:'website',title:'Revise o CTA do '+top.name,body:fmt.format(top.clicks)+' cliques, mas só '+fmt.format(top.whatsapp/top.clicks*100)+'% seguem para o WhatsApp. Teste um convite mais específico para conversar.'});
  if(Number.isFinite(data.packagesReached)&&data.packagesReached/data.visits<.7)result.push({source:'website',title:'Leve os pacotes para mais perto',body:fmt.format(data.packagesReached/data.visits*100)+'% das visitas chegam aos pacotes. Deixe esse caminho mais visível no início.'});
 }
 const post=[...(data.media||data.posts||[])].filter(p=>Number.isFinite(p.reach)).sort((a,b)=>b.reach-a.reach)[0];
 if(post)result.push({source:'instagram',title:'Repita os temas dos melhores posts',body:'“'+(post.title||'Conteúdo em destaque')+'” liderou o alcance. Teste outro '+(post.format||'conteúdo').toLowerCase()+' sobre o mesmo tema.'});
 return result.slice(0,3);
}
