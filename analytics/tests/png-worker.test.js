import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {renderReportPng} from '../supabase/functions/_shared/report-raster.js';
test('portable renderer produces two valid PNGs without WASM or native canvas',async()=>{
 const snapshot={demo:true,period:{start:'2026-09-21',end:'2026-09-27',label:'21 a 27 set. 2026'},current:{visits:20,uniqueVisitors:10,websiteReceivedContacts:2,websiteQuoteRequests:1,packages:[],media:[]},previous:{}};
 const pngs=[];
 for(const type of ['website','instagram']){
  const png=Buffer.from(await renderReportPng(snapshot,type));pngs.push(png);
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),2160);
  const compressed=[];let offset=8,ended=false;
  while(offset<png.length){const length=png.readUInt32BE(offset),tag=png.subarray(offset+4,offset+8).toString();
   if(tag==='IDAT')compressed.push(png.subarray(offset+8,offset+8+length));if(tag==='IEND')ended=true;
   offset+=length+12;
  }
  assert.equal(offset,png.length);assert.equal(ended,true);
  const pixels=inflateSync(Buffer.concat(compressed));assert.equal(pixels.length,(1080*4+1)*2160);
  assert.equal(pixels[0],0);assert.equal(pixels[4],255);
  assert.ok(png.length>10000&&png.length<5*1024*1024);
 }
 assert.notDeepEqual(pngs[0],pngs[1]);
});
