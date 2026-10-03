// Values remain unknown unless the provider explicitly returned a finite count.
export const count=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
export function metricValue(response,name){
 const metric=response?.data?.find(item=>item.name===name);
 return count(metric?.total_value?.value??(metric?.values?.length===1?metric.values[0].value:null));
}
export function totalMetricValue(response,name){return count(response?.data?.find(item=>item.name===name)?.total_value?.value);}
export function followerChanges(response){
 const metric=response?.data?.find(item=>item.name==='follows_and_unfollows');
 const buckets=(metric?.total_value?.breakdowns||[]).flatMap(item=>item.results||[]);
 const gained=count(buckets.find(item=>String(item.dimension_values?.[0]).toLowerCase()==='follows')?.value);
 const lost=count(buckets.find(item=>String(item.dimension_values?.[0]).toLowerCase()==='unfollows')?.value);
 return {followersGained:gained,followersLost:lost,netFollowers:gained!==null&&lost!==null?gained-lost:null};
}
export function providerFailure(status,error={}){
 if(error.code===190)return 'token_expired';
 if(status===429||[4,17,32,613].includes(error.code))return 'provider_rate_limited';
 if(error.code===10&&/Not enough viewers for the media to show insights/i.test(error.message||''))return 'provider_data_threshold';
 if(status===403||[10,200].includes(error.code))return 'provider_permission_denied';
 if(status>=500)return 'provider_unavailable';
 // Only an explicit rejection of a metric is optional. Other API errors abort the batch.
 if(error.code===100&&/metric/i.test(error.message||'')&&/(valid|support|available)/i.test(error.message||''))return 'provider_unsupported_metric';
 return 'provider_error';
}
export const instagramPeriodKeys=['instagramReach','instagramViews','profileVisits','bioClicks','profileContactTaps','netFollowers','followersGained','followersLost','followersTotal'];
export function comparableInstagram(current,previous){
 const a=current.instagramSource,b=previous.instagramSource;
 return Boolean(a&&b&&a.provider===b.provider&&a.coverage==='complete'&&b.coverage==='complete'&&a.contentScope===b.contentScope);
}
export function protectInstagramComparison(current,previous){
 if(!comparableInstagram(current,previous))for(const key of instagramPeriodKeys)previous[key]=null;
 // Followers are a point-in-time count, not a total accumulated over a week.
 previous.followersTotal=null;
 return previous;
}
export const safeCollectionError=error=>['token_expired','account_mismatch','collection_timeout','data_window_exceeded','provider_rate_limited','provider_permission_denied','provider_unsupported_metric','provider_unavailable','provider_timeout','provider_error','provider_invalid_response','metrics_unavailable','database_error','configuration_missing','collection_superseded'].includes(error?.message)?error.message:'collection_failed';
