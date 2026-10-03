import test from 'node:test';
import assert from 'node:assert/strict';
import {count,metricValue,totalMetricValue,followerChanges,providerFailure,protectInstagramComparison,safeCollectionError} from '../supabase/functions/_shared/instagram-quality.js';
import {instagramHealth} from '../src/source-health.js';
import {renderReportSvg} from '../supabase/functions/_shared/report-image.js';
import {variation} from '../src/report.js';

test('missing, malformed and negative provider counts never become zero',()=>{
 for(const value of [null,undefined,'12',NaN,Infinity,-1,{}])assert.equal(count(value),null);
 assert.equal(count(0),0);
 assert.equal(metricValue({data:[{name:'reach',total_value:{value:108}}]},'reach'),108);
 assert.equal(metricValue({data:[{name:'reach',values:[{value:0}]}]},'reach'),0);
 assert.equal(metricValue({data:[]},'reach'),null);
 assert.equal(totalMetricValue({data:[{name:'reach',values:[{value:108}]}]},'reach'),null);
 assert.equal(metricValue({data:[{name:'reach',values:[{value:40},{value:108}]}]},'reach'),null);
});
test('net followers requires both provider buckets, not an unrelated count difference',()=>{
 const response={data:[{name:'follows_and_unfollows',total_value:{breakdowns:[{results:[{dimension_values:['follows'],value:9},{dimension_values:['unfollows'],value:2}]}]}}]};
 assert.deepEqual(followerChanges(response),{followersGained:9,followersLost:2,netFollowers:7});
 response.data[0].total_value.breakdowns[0].results.pop();
 assert.equal(followerChanges(response).netFollowers,null);
});
test('permission, quota and outages cannot be hidden as unsupported metrics',()=>{
 assert.equal(providerFailure(400,{code:190}),'token_expired');
 assert.equal(providerFailure(400,{code:200,message:'metric unavailable'}),'provider_permission_denied');
 assert.equal(providerFailure(400,{code:10,message:'(#10) Not enough viewers for the media to show insights'}),'provider_data_threshold');
 assert.equal(providerFailure(400,{code:10,message:'Application does not have permission'}),'provider_permission_denied');
 assert.equal(providerFailure(429,{code:100,message:'metric unavailable'}),'provider_rate_limited');
 assert.equal(providerFailure(503),'provider_unavailable');
 assert.equal(providerFailure(400,{code:100,message:'metric must be one of the valid values'}),'provider_unsupported_metric');
 assert.equal(providerFailure(400,{code:100,message:'Invalid since parameter'}),'provider_error');
 assert.equal(safeCollectionError(new Error('secret-token-in-provider-body')),'collection_failed');
});
test('comparisons require two complete periods from the same provider',()=>{
 const current={instagramReach:200,instagramSource:{provider:'meta',coverage:'complete',contentScope:'cumulative'}};
 const previous={instagramReach:100,followersTotal:15,instagramSource:{provider:'meta',coverage:'complete',contentScope:'cumulative'}};
 assert.equal(protectInstagramComparison(current,{...previous}).instagramReach,100);
 assert.equal(protectInstagramComparison(current,{...previous}).followersTotal,null);
 for(const source of [{...previous.instagramSource,coverage:'partial'},{...previous.instagramSource,provider:'metricool'}])assert.equal(protectInstagramComparison(current,{...previous,instagramSource:source}).instagramReach,null);
 for(const value of [NaN,Infinity,undefined])assert.equal(variation(value,1),null);
});
test('failed attempts and stale Meta collections are visible without altering saved data',()=>{
 const source={provider:'meta',collectedAt:'2026-10-03T03:00:00Z'};
 assert.equal(instagramHealth(source,{},Date.parse('2026-10-03T06:00:00Z')).tone,'warning');
 assert.equal(instagramHealth(source,{},Date.parse('2026-10-03T04:00:00Z')),null);
 const error=instagramHealth(source,{status:'error',errorCode:'token_expired',lastAttemptAt:'2026-10-03T05:00:00Z'});
 assert.match(error.detail,/autorização expirou/);
 assert.match(error.detail,/última coleta válida/);
 assert.equal(instagramHealth({...source,provider:'metricool'},{},Date.parse('2026-10-04T06:00:00Z')),null);
});
test('image report carries source, measurement time, cumulative scope and failed-update notice',()=>{
 const current={instagramReach:200,followersTotal:15,followersAsOf:'2026-10-03T03:00:00Z',instagramSource:{provider:'meta',collectedAt:'2026-10-03T03:00:00Z',coverage:'partial'},sourceHealth:{instagram:{status:'error'}}};
 const svg=renderReportSvg({current,previous:{instagramReach:100},period:{start:'2026-09-28',end:'2026-10-04'}},'instagram');
 assert.match(svg,/Meta · Consulta/);assert.match(svg,/Falha na atualização/);assert.match(svg,/métricas acumuladas/);assert.match(svg,/Seguidores informados · 03\/10/);assert.doesNotMatch(svg,/\+100%/);
});
