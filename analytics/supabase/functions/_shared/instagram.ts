import {admin,check,graph as providerGraph,team} from './server.ts';
import {loadInstagram} from './instagram-auth.ts';
import {addDays,bounds,localDay,windows} from './aggregation.js';
import {count,metricValue,totalMetricValue,followerChanges} from './instagram-quality.js';

export async function collectInstagram(runId:string){
 const credential=await loadInstagram(),token=credential.token,account=credential.account;
 if(!token||!account)throw new Error('configuration_missing');
 const started=new Date(),collectedAt=started.toISOString(),deadline=started.getTime()+90000;
 let requests=0;
 async function graph(path:string,params:Record<string,string>){
  if(Date.now()>deadline)throw new Error('collection_timeout');
  requests++;
  return providerGraph(path,params,token,true,credential.mode);
 }
 async function insight(path:string,metric:string,params:Record<string,string>={},allowStoryThreshold=false){
  try{const result=await graph(path,{metric,...params});if(!Array.isArray(result.data))throw new Error('provider_invalid_response');return result;}
  catch(error){if(error instanceof Error&&(error.message==='provider_unsupported_metric'||allowStoryThreshold&&error.message==='provider_data_threshold'))return {data:[],unavailable:true,reason:error.message};throw error;}
 }
 const db=admin(),tenant=team(),profile=await graph(account,{fields:'id,username,followers_count'});
 if(profile.username!=='tuna.stream')throw new Error('account_mismatch');
 const today=localDay(started),followers=count(profile.followers_count),periods:any[]=[];
 const audience:Record<string,any>={};
 for(const breakdown of followers!==null&&followers>=100?['city','age','gender']:[]){
  const result=await insight(account+'/insights','follower_demographics',{period:'lifetime',timeframe:'this_month',metric_type:'total_value',breakdown});
  audience[breakdown]=(result.data?.[0]?.total_value?.breakdowns||[]).flatMap((item:any)=>item.results||[])
   .filter((item:any)=>count(item.value)!==null).map((item:any)=>[item.dimension_values?.join(' · ')||'Não informado',item.value]).sort((a:any,b:any)=>b[1]-a[1]).slice(0,10);
 }
 for(const period of windows(started)){
  const window=bounds(period),complete=new Date(window.end).getTime()<=started.getTime();
  // Meta documents an inclusive until; exclude the first second of the next week.
  const until=Math.floor(Math.min(new Date(window.end).getTime(),started.getTime())/1000)-(complete?1:0);
  const params={period:'day',metric_type:'total_value',since:String(Math.floor(new Date(window.start).getTime()/1000)),until:String(until)};
  if(Number(params.since)>=Number(params.until))continue;
  const response:Record<string,any>={};
  for(const name of ['reach','profile_links_taps','views',...(followers!==null&&followers>=100?['follows_and_unfollows']:[])])response[name]=await insight(account+'/insights',name,{...params,...(name==='follows_and_unfollows'?{breakdown:'follow_type'}:{})});
  // profile_links_taps measures contact buttons, not clicks on the bio website link.
  const metrics:Record<string,any>={instagramReach:totalMetricValue(response.reach,'reach'),instagramViews:totalMetricValue(response.views,'views'),profileVisits:null,bioClicks:null,profileContactTaps:totalMetricValue(response.profile_links_taps,'profile_links_taps'),...followerChanges(response.follows_and_unfollows),followersTotal:period.end>=today?followers:null,followersAsOf:period.end>=today?collectedAt:null,audience,audienceAsOf:collectedAt,audienceTimeframe:'this_month'};
  const available=['instagramReach','instagramViews','profileContactTaps'].filter(key=>metrics[key]!==null);
  if(period.end>=today&&!available.length)throw new Error('metrics_unavailable');
  const coverage=!available.length?'unavailable':complete?'complete':'partial';
  metrics.instagramSource={provider:'meta',handle:'tuna.stream',mode:'api',collectedAt,coverage,range:{from:window.start,to:new Date(until*1000).toISOString()},contentScope:'cumulative',unavailableMetrics:['instagramReach','instagramViews','profileVisits','bioClicks','profileContactTaps','netFollowers'].filter(key=>metrics[key]===null)};
  periods.push({...period,metrics});
 }
 const fields='id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
 const posts:any[]=[];let cursor='',pages=0;
 do{
  const page=await graph(account+'/media',{fields,limit:'25',...(cursor?{after:cursor}:{})});
  if(!Array.isArray(page.data))throw new Error('provider_invalid_response');
  posts.push(...page.data);pages++;cursor=page.paging?.next?page.paging.cursors?.after||'':'';
  if(page.data.some((post:any)=>new Date(post.timestamp)<new Date(addDays(today,-28)))){cursor='';break;}
 }while(cursor&&pages<8);
 if(cursor)throw new Error('data_window_exceeded');
 const stories=await graph(account+'/stories',{fields:'id,media_type,media_url,thumbnail_url,permalink,timestamp',limit:'100'});
 if(!Array.isArray(stories.data))throw new Error('provider_invalid_response');
 if(stories.paging?.next)throw new Error('data_window_exceeded');
 const media:any[]=[],seen=new Set<string>();
 for(const post of [...posts,...stories.data.map((item:any)=>({...item,media_product_type:'STORY'}))]){
  if(typeof post.id!=='string'||!/^\d+$/.test(post.id)||!Number.isFinite(new Date(post.timestamp).getTime()))throw new Error('provider_invalid_response');
  if(seen.has(post.id)||new Date(post.timestamp)<new Date(addDays(today,-28)))continue;seen.add(post.id);
  const channel=post.media_product_type==='REELS'?'reels':post.media_product_type==='STORY'?'stories':'feed';
  const requested=channel==='stories'?'reach,views,replies,shares,link_clicks':'reach,views,saved,shares';
  let response=await insight(post.id+'/insights',requested,{},channel==='stories'),unavailableReason=response.reason||null;
  if(response.unavailable){const parts:any[]=[];for(const name of requested.split(',')){const item=await insight(post.id+'/insights',name,{},channel==='stories');parts.push(...item.data);if(item.reason)unavailableReason=item.reason;}response={data:parts};}
  const metrics={id:post.id,title:(post.caption||'Conteúdo do Instagram').split('\n')[0].slice(0,120),channel,media_product_type:post.media_product_type,media_type:post.media_type,format:channel==='reels'?'Reel':channel==='stories'?'Story':post.media_type==='CAROUSEL_ALBUM'?'Carrossel':post.media_type==='VIDEO'?'Vídeo':'Estático',thumbnail:post.thumbnail_url||(post.media_type!=='VIDEO'?post.media_url:null),permalink:post.permalink||null,reach:metricValue(response,'reach'),views:metricValue(response,'views'),likes:count(post.like_count),comments:count(post.comments_count),saves:metricValue(response,'saved'),shares:metricValue(response,'shares'),replies:metricValue(response,'replies'),linkTaps:metricValue(response,'link_clicks'),unavailableReason,expired:channel==='stories'&&new Date(post.timestamp).getTime()+86400000<started.getTime(),provider:'meta',collectedAt,measurementScope:'cumulative'};
  // Do not relabel a previous provider's unavailable metric as a fresh measurement.
  media.push({id:post.id,published_at:post.timestamp,metrics});
 }
 if(Date.now()>deadline)throw new Error('collection_timeout');
 const batch={handle:'tuna.stream',day:today,daily:{followersTotal:followers,followersAsOf:collectedAt,followersProvider:'meta'},collectedAt,periods,media,requests,coverage:periods.every(period=>period.metrics.instagramSource.coverage==='complete')?'complete':'partial'};
 if(!check(await db.rpc('analytics_commit_instagram',{tenant,run_id:runId,batch})))throw new Error('collection_superseded');
 return {status:batch.coverage,media:media.length,periods:periods.length};
}
