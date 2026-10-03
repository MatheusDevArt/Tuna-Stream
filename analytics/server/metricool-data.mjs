// Metric IDs are discovered through the connector before each export.
// Daily reach is never treated as deduplicated weekly account reach.
const number=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
const day=value=>/^\d{8}$/.test(String(value))?String(value).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3'):null;
const rows=section=>{
 if(!Array.isArray(section?.fields)||!Array.isArray(section?.rows))throw new Error('invalid_export');
 return section.rows.map(row=>Object.fromEntries(section.fields.map((field,i)=>[field,row[i]]).concat([['day',day(row[section.fields.length])]])));
};
function published(value){
 const match=String(value).match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
 if(!match)throw new Error('invalid_publication_date');
 const date=`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}-03:00`;
 if(!Number.isFinite(Date.parse(date)))throw new Error('invalid_publication_date');
 return date;
}
function url(value,thumbnail=false){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(thumbnail?/(^|\.)cdninstagram\.com$|(^|\.)fbcdn\.net$/.test(u.hostname):['www.instagram.com','instagram.com'].includes(u.hostname)&&/^\/(p|reel|reels|stories)\//.test(u.pathname))?u.href:null;}catch{return null;}
}
export function metricoolData(payload,periods){
 if(payload?.version!==1||payload.provider!=='metricool'||payload.brand?.id!=='7209286'||payload.brand.handle!=='tuna.stream'||payload.brand.timezone!=='America/Sao_Paulo'||!Number.isFinite(Date.parse(payload.collectedAt)))throw new Error('wrong_metricool_account');
 const evolution=rows(payload.evolution).filter(row=>row.day&&row.day>=payload.range.from&&row.day<=payload.range.to).sort((a,b)=>a.day.localeCompare(b.day));
 // Metricool may return historical zero-only reach rows before the first meaningful record.
 const firstAvailable=evolution.find(row=>number(row.IGEV01)!==null||number(row.IGEV05)!==null||number(row.IGEV06)>0)?.day;
 const daily=evolution.filter(row=>firstAvailable&&row.day>=firstAvailable).map(row=>({day:row.day,metrics:{followersTotal:number(row.IGEV01),views:number(row.IGEV05),reach:number(row.IGEV06),followersGained:number(row.IGEV43),followersLost:number(row.IGEV44),provider:'metricool',collectedAt:payload.collectedAt}}));
 const media=[];
 for(const [key,prefix,channel]of [['posts','IGPO','feed'],['reels','IGRE','reels'],['stories','IGST','stories']])for(const row of rows(payload[key])){
  const id=String(row[prefix+'04']||'');if(!/^\d+$/.test(id))throw new Error('invalid_media_id');
  const timestamp=published(row[prefix+'02']),caption=String(row[prefix+'03']||''),type=String(row[prefix+'07']||'');
  const metrics={id,channel,caption,title:caption.split('\n')[0].slice(0,100),publishedAt:timestamp,permalink:url(row[prefix+'06']),thumbnail:url(row[prefix+'05'],true),provider:'metricool',metricsAsOf:payload.collectedAt,metricScope:'cumulative',format:channel==='reels'?'Reel':channel==='stories'?'Story':type.includes('CAROUSEL')?'Carrossel':type.includes('VIDEO')?'Vídeo':'Estático'};
  if(channel==='feed')Object.assign(metrics,{comments:number(row.IGPO08),likes:number(row.IGPO13),reach:number(row.IGPO14),saves:number(row.IGPO15),shares:number(row.IGPO27),views:number(row.IGPO28)});
  if(channel==='reels')Object.assign(metrics,{comments:number(row.IGRE07),likes:number(row.IGRE10),reach:number(row.IGRE11),saves:number(row.IGRE12),shares:number(row.IGRE21),views:number(row.IGRE23)});
  if(channel==='stories')Object.assign(metrics,{reach:number(row.IGST10),replies:number(row.IGST11),views:number(row.IGST09),exits:number(row.IGST08),linkTaps:null});
  media.push({id,published_at:timestamp,metrics,collected_at:payload.collectedAt});
 }
 const periodRows=periods.map(period=>{
  const available=daily.filter(row=>row.day>=period.start&&row.day<=period.end);
  const latest=key=>[...available].reverse().find(row=>row.metrics[key]!==null);
  const followers=latest('followersTotal'),reach=latest('reach'),viewDays=available.filter(row=>row.metrics.views!==null);
  return {...period,collected_at:payload.collectedAt,metrics:{
   instagramReach:null,instagramViews:null,profileVisits:null,bioClicks:null,netFollowers:null,followersGained:null,followersLost:null,
   followersTotal:followers?.metrics.followersTotal??null,followersAsOf:followers?.day??null,
   instagramViewsObserved:viewDays.length?viewDays.reduce((sum,row)=>sum+row.metrics.views,0):null,instagramViewsDays:viewDays.map(row=>row.day),
   instagramLastDailyReach:reach?.metrics.reach??null,instagramReachAsOf:reach?.day??null,
   instagramDaily:available.map(row=>({day:row.day,...row.metrics})),
   instagramSource:{provider:'metricool',handle:payload.brand.handle,brandId:payload.brand.id,mode:'manual',collectedAt:payload.collectedAt,coverage:available.length?'partial':'unavailable',range:payload.range,firstAvailableDay:firstAvailable??null,contentScope:'cumulative'},
   audience:{},audienceAsOf:null
  }};
 });
 return {daily,media,periods:periodRows,collectedAt:payload.collectedAt};
}
