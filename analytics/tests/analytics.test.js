import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyChannel,engagement,sortContent,isInstagramContentUrl,getDemoMedia } from '../src/content.js';
import { distributeRegions } from '../src/regions.js';
import { summarizeInbound,countQuoteRequests,trackingReference } from '../src/whatsapp.js';
import { getDemoSnapshot } from '../src/data.js';
import { normalizeMetrics } from '../src/metrics.js';

test('Brazil has 27 states and integer demo visitor totals match both weeks',()=>{
 for(const total of [0,1,813,942,12345]){
 const counts=distributeRegions(total);
 assert.equal(Object.keys(counts).length,27);
 assert.equal(Object.values(counts).reduce((sum,count)=>sum+count,0),total);
 assert.ok(Object.values(counts).every(count=>Number.isInteger(count)&&count>=0));
 }
 assert.equal(distributeRegions(942).RJ,396);
});
test('media classification uses product type and unavailable metrics stay unavailable',()=>{
 assert.equal(classifyChannel({media_type:'VIDEO',media_product_type:'FEED'}),'feed');
 assert.equal(classifyChannel({media_product_type:'REELS'}),'reels');
 assert.equal(classifyChannel({media_product_type:'STORY'}),'stories');
 assert.equal(engagement({reach:100,likes:3,comments:null,saves:2,shares:1}),null);
 assert.ok(Math.abs(engagement({reach:100,likes:3,comments:1,saves:2,shares:1})-7)<1e-9);
 assert.equal(sortContent([{id:'a',shares:null},{id:'b',shares:1}],'shares')[0].id,'b');
 assert.equal(sortContent(getDemoMedia(getDemoSnapshot('last-week')).filter(item=>item.channel==='reels'),'shares')[0].id,'demo-reel-2');
});
test('content links only use canonical Instagram HTTPS locations, not sample URLs',()=>{
 assert.equal(isInstagramContentUrl('https://www.instagram.com/reel/Example_123/'),true);
 for(const value of ['https://www.instagram.com/tuna.stream/','javascript:alert(1)','https://instagram.com.evil.test/p/X/',''])assert.equal(isInstagramContentUrl(value),false);
 assert.ok(getDemoMedia(getDemoSnapshot('last-week')).every(item=>item.demo&&item.permalink===null));
});
test('inbound contacts deduplicate messages and people, excluding status and outbound traffic',()=>{
 const first={direction:'inbound',id:'m1',contactHash:'h1',type:'text'};
 assert.deepEqual(summarizeInbound([first,first,{...first,id:'m2'},{...first,id:'m3',contactHash:'h2',type:'image'},{...first,id:'m4',type:'reaction'},{...first,id:'m5',type:'status'},{...first,id:'m6',direction:'outbound'}]),{messages:3,contacts:2});
 assert.equal(countQuoteRequests([{stage:'quote_requested',contactHash:'h1'},{stage:'quote_requested',contactHash:'h1'},{stage:'new',contactHash:'h2'}]),1);
});
test('tracking references are explicit; removal or incomplete codes stay unattributed',()=>{
 assert.equal(trackingReference('Quero orçamento TS-LIVE-A7K9P2Z4'),'TS-LIVE-A7K9P2Z4');
 assert.equal(trackingReference('Quero orçamento'),null);
 assert.equal(trackingReference('TS-LIVE-ABC'),null);
});
test('real snapshots never fall back to fictitious metrics',()=>{
 const result=normalizeMetrics({visits:0,dailyVisits:[0,0,0,0,0,0,0]});
 assert.equal(result.visits,0);assert.equal(result.quoteRequests,undefined);
 assert.deepEqual(result.packages,[]);assert.deepEqual(result.dailyVisits,[0,0,0,0,0,0,0]);
 assert.equal(normalizeMetrics({}).dailyVisits,null);
});
