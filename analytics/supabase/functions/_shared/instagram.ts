import {admin,check,env,graph,team} from './server.ts';
import {addDays,bounds,localDay,windows} from './aggregation.js';
const scalar=(result:any,name:string)=>{const metric=result.data?.find((r:any)=>r.name===name),value=metric?.total_value?.value;return typeof value==='number'?value:null;};
export async function collectInstagram(){
 const deadline=Date.now()+90000;
 async function insight(path:string,metric:string,params:Record<string,string>={}){
  if(Date.now()>deadline)throw new Error('collection_timeout');
  try{return await graph(path,{metric,...params},env('INSTAGRAM_ACCESS_TOKEN'),true);}catch(error){if(error instanceof Error&&error.message==='token_expired')throw error;return {data:[],unavailable:true};}
 }
 const token=env('INSTAGRAM_ACCESS_TOKEN',false),account=env('INSTAGRAM_ACCOUNT_ID',false);if(!token||!account)return;
 const db=admin(),tenant=team(),profile=await graph(account,{fields:'id,username,followers_count'},token,true);
 // Protect against accidentally connecting another company's account.
 if(profile.username!=='tuna.stream')throw new Error('account_mismatch');
 const today=localDay(new Date());
 check(await db.from('instagram_daily').upsert({team_id:tenant,day:today,metrics:{followersTotal:profile.followers_count},collected_at:new Date().toISOString()}));
 for(const period of windows()){
  const window=bounds(period),params={period:'day',metric_type:'total_value',since:String(Math.floor(new Date(window.start).getTime()/1000)),until:String(Math.min(Math.floor(new Date(window.end).getTime()/1000),Math.floor(Date.now()/1000)))};
  if(Number(params.since)>=Number(params.until))continue;
  const reach=await insight(account+'/insights','reach',params),visits=await insight(account+'/insights','profile_views',params),bio=await insight(account+'/insights','profile_links_taps',params);
  const [before,end]=await Promise.all([db.from('instagram_daily').select('metrics').eq('team_id',tenant).eq('day',addDays(period.start,-1)).maybeSingle(),db.from('instagram_daily').select('metrics').eq('team_id',tenant).eq('day',period.end<today?period.end:today).maybeSingle()]);
  const first=check(before)?.metrics?.followersTotal,last=check(end)?.metrics?.followersTotal;
  const follows=await insight(account+'/insights','follows_and_unfollows',{...params,breakdown:'follow_type'});
  const buckets=follows.data?.[0]?.total_value?.breakdowns?.flatMap((b:any)=>b.results||[])||[];
  const gained=buckets.find((b:any)=>String(b.dimension_values?.[0]).toLowerCase()==='follows')?.value??null,lost=buckets.find((b:any)=>String(b.dimension_values?.[0]).toLowerCase()==='unfollows')?.value??null;
  const views=await insight(account+'/insights','views',params);
  const metrics:Record<string,any>={instagramReach:scalar(reach,'reach'),instagramViews:scalar(views,'views'),profileVisits:scalar(visits,'profile_views'),bioClicks:scalar(bio,'profile_links_taps'),followersTotal:last??null,netFollowers:Number.isFinite(gained)&&Number.isFinite(lost)?gained-lost:Number.isFinite(first)&&Number.isFinite(last)?last-first:null,followersGained:gained,followersLost:lost,audience:{},audienceAsOf:new Date().toISOString()};
  for(const breakdown of ['city','age','gender']){
   const demographic=await insight(account+'/insights','follower_demographics',{period:'lifetime',metric_type:'total_value',breakdown});
   metrics.audience[breakdown]=(demographic.data?.[0]?.total_value?.breakdowns||[]).flatMap((b:any)=>b.results||[]).filter((r:any)=>Number.isFinite(r.value)).map((r:any)=>[r.dimension_values?.join(' · ')||'Não informado',r.value]).sort((a:any,b:any)=>b[1]-a[1]).slice(0,10);
  }
  // Never sum daily reach: the same person may appear on several days.
  check(await db.from('instagram_periods').upsert({team_id:tenant,period_start:period.start,period_end:period.end,metrics,collected_at:new Date().toISOString()}));
 }
 const fields='id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
 let cursor='',pageCount=0;const posts:any[]=[];
 do{
  const page=await graph(account+'/media',{fields,limit:'25',...(cursor?{after:cursor}:{})},token,true);posts.push(...page.data);
  cursor=page.paging?.next?page.paging.cursors?.after||'':'';
  if(page.data.some((p:any)=>new Date(p.timestamp)<new Date(addDays(today,-28))))break;
 }while(cursor&&++pageCount<8);
 if(cursor&&pageCount>=8)throw new Error('data_window_exceeded');
 // Poll while Stories still exist; previously stored metrics remain available after expiry.
 let stories:any[]=[];try{stories=(await graph(account+'/stories',{fields:'id,media_type,media_url,thumbnail_url,permalink,timestamp',limit:'100'},token,true)).data||[];}catch(error){if(error instanceof Error&&error.message==='token_expired')throw error;}
 for(const post of [...posts,...stories.map(s=>({...s,media_product_type:'STORY'}))]){
  if(new Date(post.timestamp)<new Date(addDays(today,-28)))continue;
  const channel=post.media_product_type==='REELS'?'reels':post.media_product_type==='STORY'?'stories':'feed';
  const requested=channel==='stories'?'reach,replies,shares':'reach,saved,shares';
  let response=await insight(post.id+'/insights',requested);
  if(response.unavailable){const parts=[];for(const name of requested.split(','))parts.push(...(await insight(post.id+'/insights',name)).data);response={data:parts};}
  const value=(name:string)=>{const m=response.data?.find((r:any)=>r.name===name),v=m?.total_value?.value??m?.values?.[0]?.value;return Number.isFinite(v)?v:null;};
  const metrics:Record<string,any>={id:post.id,title:(post.caption||'Conteúdo do Instagram').split('\n')[0].slice(0,120),channel,media_product_type:post.media_product_type,media_type:post.media_type,format:channel==='reels'?'Reel':channel==='stories'?'Story':post.media_type==='CAROUSEL_ALBUM'?'Carrossel':post.media_type==='VIDEO'?'Vídeo':'Estático',thumbnail:post.thumbnail_url||(post.media_type!=='VIDEO'?post.media_url:null),permalink:post.permalink||null,reach:value('reach'),likes:post.like_count??null,comments:post.comments_count??null,saves:value('saved'),shares:value('shares'),replies:value('replies'),linkTaps:null,expired:channel==='stories'&&new Date(post.timestamp).getTime()+86400000<Date.now()};
  const existing=check(await db.from('instagram_media').select('metrics').eq('team_id',tenant).eq('id',post.id).maybeSingle());
  if(existing)for(const key of ['reach','likes','comments','saves','shares','replies'])if(metrics[key]===null&&existing.metrics[key]!==null)metrics[key]=existing.metrics[key];
  check(await db.from('instagram_media').upsert({team_id:tenant,id:post.id,published_at:post.timestamp,metrics,collected_at:new Date().toISOString()}));
 }
 check(await db.from('analytics_integrations').upsert({team_id:tenant,source:'instagram',status:'ready',last_success_at:new Date().toISOString(),error_code:null}));
}
