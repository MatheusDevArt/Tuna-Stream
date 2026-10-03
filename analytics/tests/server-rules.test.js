import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {extractReference,inboundMessages,verifySignature} from '../supabase/functions/_shared/whatsapp.js';
import {aggregate,windows,bounds,addDays} from '../supabase/functions/_shared/aggregation.js';
import {renderReportSvg} from '../supabase/functions/_shared/report-image.js';

const reference='TS-LIVE-'+'A'.repeat(32);
const period={start:'2026-09-21',end:'2026-09-27'};
const ready=[
 {source:'website',first_success_at:'2026-09-01T03:00:00Z',last_success_at:'2026-09-27T20:00:00Z'},
 {source:'whatsapp',mode:'manual',first_success_at:'2026-09-21T14:00:00Z',last_success_at:'2026-09-27T20:00:00Z'}
];
test('registered reference syntax requires full 128-bit code',()=>{
 assert.equal(extractReference('Olá! '+reference),reference);
 for(const invalid of ['TS-LIVE-ABC123',reference+'A','TS-OTHER-'+'A'.repeat(32),reference.toLowerCase()])assert.equal(extractReference(invalid),null);
});
test('incoming messages exclude delivery statuses, reactions and other numbers',()=>{
 const change={field:'messages',value:{metadata:{phone_number_id:'allowed'},statuses:[{status:'delivered'}],messages:[{id:'1',from:'phone',type:'text'},{id:'2',from:'phone',type:'reaction'},{type:'system'}]}};
 assert.equal(inboundMessages({entry:[{changes:[change]}]},'allowed').length,1);
 assert.equal(inboundMessages({entry:[{changes:[change]}]},'other').length,0);
});
test('Meta signature verifies exact raw bytes and rejects forged or edited content',async()=>{
 const bytes=new TextEncoder().encode('{"entry":[]}'),secret='unit-test-secret';
 const signature='sha256='+createHmac('sha256',secret).update(bytes).digest('hex');
 assert.equal(await verifySignature(bytes,signature,secret),true);
 assert.equal(await verifySignature(new TextEncoder().encode('{"entry":[1]}'),signature,secret),false);
 assert.equal(await verifySignature(bytes,signature,'other'),false);
 assert.equal(await verifySignature(bytes,'invalid',secret),false);
});
test('attributed contacts count people, excluding ambiguous and unknown receipts',()=>{
 const opportunities=[{id:'a',contact_hash:'person1',attributed:true,requested_at:'date'},{id:'b',contact_hash:'person1',attributed:true},{id:'c',contact_hash:'person2',attributed:false,requested_at:'date'}];
 const result=aggregate({period,integrations:ready,opportunities,receipts:[{opportunity_id:'a'},{opportunity_id:'a'},{opportunity_id:'b'},{opportunity_id:'c'},{opportunity_id:null}]});
 assert.equal(result.websiteReceivedContacts,1);assert.equal(result.websiteQuoteRequests,1);
 assert.equal(result.sourceCoverage.whatsapp,'manual');
});
test('source history before installation remains unavailable instead of zero',()=>{
 const result=aggregate({period,integrations:[{source:'website',first_success_at:'2026-10-02T12:00:00Z',last_success_at:'2026-10-02T12:00:00Z'}]});
 assert.equal(result.visits,undefined);assert.equal(result.websiteReceivedContacts,null);
 assert.equal(result.sourceCoverage.website,'unavailable');
});
test('manual confirmed historical contact remains countable before integration started',()=>{
 const result=aggregate({period,integrations:[],opportunities:[{id:'a',contact_hash:'p',attributed:true,requested_at:'date'}],receipts:[{opportunity_id:'a'}]});
 assert.equal(result.websiteReceivedContacts,1);assert.equal(result.websiteQuoteRequests,1);
});
test('partial first day and no activity do not invent best package or section',()=>{
 const result=aggregate({period,integrations:[{source:'website',first_success_at:'2026-09-21T15:00:00Z',last_success_at:'2026-09-27T15:00:00Z'}]});
 assert.equal(result.sourceCoverage.website,'partial');
 assert.equal(result.topSection,null);assert.equal(result.topPackage,null);assert.equal(result.topRegion,null);
});
test('sessions distinguish new and returning visitors and funnel session units',()=>{
 const sessions=[{id:'1',visitor_id:'new',created_at:'2026-09-21T12:00:00Z',first_seen_at:'2026-09-21T12:00:00Z',source:'Instagram',device:'Celular',browser:'Chrome',operating_system:'Android',active_seconds:20},{id:'2',visitor_id:'new',created_at:'2026-09-22T12:00:00Z',first_seen_at:'2026-09-21T12:00:00Z',active_seconds:0},{id:'3',visitor_id:'old',created_at:'2026-09-22T12:00:00Z',first_seen_at:'2026-09-01T12:00:00Z',active_seconds:10}];
 const events=[{session_id:'1',kind:'package',label:'LIVE'},{session_id:'1',kind:'package',label:'LIVE'},{session_id:'1',kind:'whatsapp',label:'LIVE'}];
 const result=aggregate({period,integrations:ready,sessions,events});
 assert.equal(result.visits,3);assert.equal(result.uniqueVisitors,2);assert.equal(result.newVisitors,1);assert.equal(result.returningVisitors,1);
 assert.equal(result.packageClicks,2);assert.equal(result.packageSessions,1);assert.equal(result.whatsappSessions,1);
 assert.equal(result.topPackage,'LIVE');assert.deepEqual(result.dailyVisits,[1,2,0,0,0,0,0]);
});
test('Brazil week bounds and future days respect missing values',()=>{
 const current=windows()[0],day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
 assert.equal(bounds(period).start,'2026-09-21T00:00:00-03:00');
 const result=aggregate({period:current,integrations:ready});
 result.dailyVisits.forEach((value,i)=>assert.equal(value,addDays(current.start,i)>day?null:0));
});
test('expired Stories stay unavailable and report outputs are distinct and XML safe',()=>{
 const result=aggregate({period,media:[{published_at:'2026-09-21T12:00:00Z',metrics:{channel:'stories',reach:5}}]});
 assert.equal(result.media[0].expired,true);
 const snapshot={demo:true,period,current:{...result,topSource:'<script>&test'},previous:{}};
 const site=renderReportSvg(snapshot,'website'),instagram=renderReportSvg(snapshot,'instagram');
 assert.match(site,/height="2160"/);assert.match(site,/DEMONSTRAÇÃO/);assert.match(site,/&lt;script&gt;&amp;test/);
 assert.match(instagram,/INSTAGRAM/);assert.notEqual(site,instagram);
 assert.throws(()=>renderReportSvg(snapshot,'other'));
});
