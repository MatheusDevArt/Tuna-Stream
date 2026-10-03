import {release,locations,counts,compressedRanges} from './br-geography-data.js';
export {release};
let loaded;
async function ranges(){
 if(!loaded)loaded=(async()=>{const raw=atob(compressedRanges),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));const buffer=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();if(buffer.byteLength!==counts[0]*12+counts[1]*36)throw new Error('geography_integrity');return {view:new DataView(buffer),bytes:new Uint8Array(buffer)};})();
 return loaded;
}
function parseIPv4(ip){const p=ip.split('.');return p.length===4&&p.every(s=>/^\d{1,3}$/.test(s)&&Number(s)<=255)?p.reduce((n,s)=>n*256+Number(s),0):null;}
function parseIPv6(ip){
 const mapped=ip.match(/(^|:)(\d+\.\d+\.\d+\.\d+)$/);if(mapped){const n=parseIPv4(mapped[2]);if(n===null)return null;ip=ip.slice(0,-mapped[2].length)+(Math.floor(n/65536)).toString(16)+':'+(n%65536).toString(16);}
 const parts=ip.split('::');if(parts.length>2)return null;const left=parts[0]?parts[0].split(':'):[],right=parts[1]?parts[1].split(':'):[],missing=8-left.length-right.length;
 if(parts.length===1&&left.length!==8||parts.length===2&&missing<1||![...left,...right].every(p=>/^[0-9a-f]{1,4}$/i.test(p)))return null;
 const groups=[...left,...Array(parts.length===2?missing:0).fill('0'),...right],bytes=new Uint8Array(16);groups.forEach((s,i)=>{const n=parseInt(s,16);bytes[i*2]=n>>>8;bytes[i*2+1]=n&255});return bytes;
}
export async function lookupBrazil(ip){
 if(typeof ip!=='string'||ip.length>60)return null;
 const value=ip.includes(':')?parseIPv6(ip):parseIPv4(ip);if(value===null)return null;
 const data=await ranges(),v6=value instanceof Uint8Array;let low=0,high=counts[v6?1:0]-1;
 const compare=offset=>{for(let i=0;i<16;i++){const delta=value[i]-data.bytes[offset+i];if(delta)return delta;}return 0;};
 while(low<=high){const mid=(low+high)>>>1,offset=v6?counts[0]*12+mid*36:mid*12,start=v6?compare(offset):value-data.view.getUint32(offset),end=v6?compare(offset+16):value-data.view.getUint32(offset+4);if(start<0)high=mid-1;else if(end>0)low=mid+1;else{const location=locations[data.view.getUint32(offset+(v6?32:8))];return location?{country:'BR',region:location[0],city:location[1],provider:'db-ip-lite',release}:null;}}
 return null;
}
