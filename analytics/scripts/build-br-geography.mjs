// Public DB-IP City Lite subset. CC BY 4.0, https://db-ip.com/db/download/ip-to-city-lite
import {createGunzip,gzipSync} from 'node:zlib';
import {Readable} from 'node:stream';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
const release=process.argv[2]||'2026-10';
if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(release))throw new Error('Invalid release');
const states=['AC:Acre','AL:Alagoas','AP:Amapá','AM:Amazonas','BA:Bahia','CE:Ceará','DF:Distrito Federal','ES:Espírito Santo','GO:Goiás','MA:Maranhão','MT:Mato Grosso','MS:Mato Grosso do Sul','MG:Minas Gerais','PA:Pará','PB:Paraíba','PR:Paraná','PE:Pernambuco','PI:Piauí','RJ:Rio de Janeiro','RN:Rio Grande do Norte','RS:Rio Grande do Sul','RO:Rondônia','RR:Roraima','SC:Santa Catarina','SP:São Paulo','SE:Sergipe','TO:Tocantins'];
const normalize=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/^state of /,'');
const stateMap=Object.fromEntries(states.flatMap(s=>{const [code,name]=s.split(':');return [[normalize(name),code],[normalize(code),code]]}));
stateMap['federal district']='DF';
function csv(line){const cells=[];let cell='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){cells.push(cell);cell='';}else cell+=c;}cells.push(cell);return cells;}
function ip(value){if(!value.includes(':'))return value.split('.').reduce((n,b)=>n*256+Number(b),0);const parts=value.split('::'),left=parts[0]?parts[0].split(':'):[],right=parts[1]?parts[1].split(':'):[];return [...left,...Array(8-left.length-right.length).fill('0'),...right].map(p=>p.padStart(4,'0')).join('').toLowerCase();}
const response=await fetch(`https://download.db-ip.com/free/dbip-city-lite-${release}.csv.gz`);if(!response.ok)throw new Error('Dataset download failed');
const hash=createHash('sha1'),input=Readable.fromWeb(response.body);input.on('data',chunk=>hash.update(chunk));
const csvHash=createHash('sha1'),decompressed=input.pipe(createGunzip());decompressed.on('data',chunk=>csvHash.update(chunk));
const lines=createInterface({input:decompressed,crlfDelay:Infinity});
const v4=[],v6=[],locations=[],indexes=new Map();let scanned=0;
for await(const line of lines){scanned++;if(!line.includes(',BR,')&&!line.includes(',"BR",'))continue;const row=csv(line);if(row[3]!=='BR')continue;const state=stateMap[normalize(row[4])];if(!state)continue;const city=row[5]?.slice(0,80)||null,key=JSON.stringify([state,city]);if(!indexes.has(key)){indexes.set(key,locations.length);locations.push([state,city]);}const ranges=row[0].includes(':')?v6:v4;ranges.push([ip(row[0]),ip(row[1]),indexes.get(key)]);}
const sha1=hash.digest('hex'),csvSha1=csvHash.digest('hex');console.log(JSON.stringify({scanned,locations:locations.length,ipv4:v4.length,ipv6:v6.length,sha1,csvSha1}));if(release==='2026-10'&&![sha1,csvSha1].includes('2e5fecf1cc24d2c2379d5bd87d669ae346150c06'))throw new Error('Dataset checksum mismatch');
for(const ranges of [v4,v6])ranges.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
await mkdir('../.preview',{recursive:true});
const ranges=Buffer.alloc(v4.length*12+v6.length*36);let offset=0;
for(const [start,end,place]of v4){ranges.writeUInt32BE(start,offset);ranges.writeUInt32BE(end,offset+4);ranges.writeUInt32BE(place,offset+8);offset+=12;}
for(const [start,end,place]of v6){Buffer.from(start,'hex').copy(ranges,offset);Buffer.from(end,'hex').copy(ranges,offset+16);ranges.writeUInt32BE(place,offset+32);offset+=36;}
const compressed=gzipSync(ranges,{level:9});
await writeFile('../.preview/br-geography-data.js',`// Derived from DB-IP City Lite ${release}, CC BY 4.0. https://db-ip.com\nexport const release=${JSON.stringify(release)};\nexport const locations=${JSON.stringify(locations)};\nexport const counts=[${v4.length},${v6.length}];\nexport const compressedRanges=${JSON.stringify(compressed.toString('base64'))};\n`);
console.log(JSON.stringify({binaryBytes:ranges.length,compressedBytes:compressed.length}));
console.log(JSON.stringify({release,scanned,locations:locations.length,ipv4:v4.length,ipv6:v6.length,sha1}));
