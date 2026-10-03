// Pure JavaScript rasterizer for our controlled report SVG, with no filesystem or WASM.
import {parse} from 'opentype.js/dist/opentype.module.js';
import {fontBase64} from './font-data.js';
import {renderReportSvg} from './report-image.js';
let font;
const WIDTH=1080,HEIGHT=2160;
const unescape=value=>value.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function color(value){
 if(value==='none')return null;
 if(/^#[0-9a-f]{3}$/i.test(value))value='#'+[...value.slice(1)].map(c=>c+c).join('');
 if(/^#[0-9a-f]{6}$/i.test(value))return [parseInt(value.slice(1,3),16),parseInt(value.slice(3,5),16),parseInt(value.slice(5,7),16)];
 return value==='white'?[255,255,255]:[8,8,9];
}
function flatten(commands){
 const contours=[];let contour=[],x=0,y=0,sx=0,sy=0;
 const push=(px,py)=>{contour.push([px,py]);x=px;y=py;};
 for(const c of commands){
  if(c.type==='M'){if(contour.length)contours.push(contour);contour=[];push(c.x,c.y);sx=x;sy=y;}
  else if(c.type==='L')push(c.x,c.y);
  else if(c.type==='C'||c.type==='Q'){
   const ax=x,ay=y;
   for(let step=1;step<=12;step++){const t=step/12,u=1-t;
    if(c.type==='C')push(u*u*u*ax+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x,u*u*u*ay+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y);
    else push(u*u*ax+2*u*t*c.x1+t*t*c.x,u*u*ay+2*u*t*c.y1+t*t*c.y);
   }
  }else if(c.type==='Z'){push(sx,sy);contours.push(contour);contour=[];}
 }
 if(contour.length)contours.push(contour);return contours;
}
function pathCommands(value){
 const commands=[];let x=0,y=0;
 for(const match of value.matchAll(/([MLHVZ])([^MLHVZ]*)/g)){
  const type=match[1],n=(match[2].match(/-?\d*\.?\d+/g)||[]).map(Number);
  if(type==='Z'){commands.push({type});continue;}
  if(type==='H')x=n[0];else if(type==='V')y=n[0];else{x=n[0];y=n[1];}
  commands.push({type:type==='M'?'M':'L',x,y});
 }
 return commands;
}
function surface(){
 const data=new Uint8Array(WIDTH*HEIGHT*4),words=new Uint32Array(data.buffer);
 words.fill(0xff090808);
 function blend(x,y,rgb,alpha=1){
  if(!rgb||x<0||x>=WIDTH||y<0||y>=HEIGHT||alpha<=0)return;
  const index=(y*WIDTH+x)*4,a=Math.min(1,alpha);
  for(let c=0;c<3;c++)data[index+c]=Math.round(data[index+c]*(1-a)+rgb[c]*a);
 }
 function fillRect(x,y,w,h,fill,radius=0,opacity=1){
  const rgb=color(fill),gradient=fill==='url(#violet)';
  if(!rgb&&!gradient)return;
  const top=Math.max(0,Math.floor(y)),bottom=Math.min(HEIGHT,Math.ceil(y+h));
  for(let py=top;py<bottom;py++){
   const dy=Math.min(py+.5-y,y+h-py-.5),inset=radius&&dy<radius?radius-Math.sqrt(Math.max(0,radius*radius-(radius-dy)**2)):0;
   const left=Math.max(0,Math.ceil(x+inset)),right=Math.min(WIDTH,Math.floor(x+w-inset));
   if(!gradient&&opacity===1){const packed=(255<<24)|(rgb[2]<<16)|(rgb[1]<<8)|rgb[0];words.fill(packed>>>0,py*WIDTH+left,py*WIDTH+right);}
   else for(let px=left;px<right;px++){const t=(px-x)/w;blend(px,py,gradient?[114+86*t,39+81*t,220+35*t]:rgb,opacity);}
  }
 }
 function fillContours(contours,rgb,opacity=1){
  const edges=[];let ymin=HEIGHT,ymax=0;
  for(const contour of contours)for(let i=0;i<contour.length;i++){
   const a=contour[i],b=contour[(i+1)%contour.length];if(a[1]===b[1])continue;
   edges.push([a,b]);ymin=Math.min(ymin,a[1],b[1]);ymax=Math.max(ymax,a[1],b[1]);
  }
  const leftBound=Math.max(0,Math.floor(Math.min(...contours.flatMap(c=>c.map(p=>p[0])))));
  const rightBound=Math.min(WIDTH,Math.ceil(Math.max(...contours.flatMap(c=>c.map(p=>p[0])))));
  if(!edges.length)return;
  for(let py=Math.max(0,Math.floor(ymin));py<Math.min(HEIGHT,Math.ceil(ymax));py++){
   const coverage=new Float32Array(Math.max(0,rightBound-leftBound));
   for(const offset of [.25,.75]){
    const scan=py+offset,xs=[];
    for(const [a,b]of edges)if(scan>=Math.min(a[1],b[1])&&scan<Math.max(a[1],b[1]))xs.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    xs.sort((a,b)=>a-b);
    for(let i=0;i+1<xs.length;i+=2){const start=Math.max(leftBound,xs[i]),end=Math.min(rightBound,xs[i+1]);
     for(let px=Math.floor(start);px<Math.ceil(end);px++)if(px>=leftBound&&px<rightBound)coverage[px-leftBound]+=Math.max(0,Math.min(px+1,end)-Math.max(px,start))*.5;
    }
   }
   for(let px=leftBound;px<rightBound;px++)if(coverage[px-leftBound])blend(px,py,rgb,coverage[px-leftBound]*opacity);
  }
 }
 function line(a,b,rgb,width,opacity){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!length)return;
  const nx=-dy/length*width/2,ny=dx/length*width/2;
  fillContours([[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]]],rgb,opacity);
 }
 return {data,fillRect,fillContours,line};
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,bytes){
 const output=new Uint8Array(bytes.length+12),view=new DataView(output.buffer);view.setUint32(0,bytes.length);
 output.set(new TextEncoder().encode(type),4);output.set(bytes,8);
 let crc=0xffffffff;for(let i=4;i<bytes.length+8;i++)crc=crcTable[(crc^output[i])&255]^(crc>>>8);
 view.setUint32(bytes.length+8,(crc^0xffffffff)>>>0);return output;
}
async function encode(data){
 const stride=WIDTH*4,filtered=new Uint8Array((stride+1)*HEIGHT);
 for(let y=0;y<HEIGHT;y++)filtered.set(data.subarray(y*stride,(y+1)*stride),y*(stride+1)+1);
 const stream=new Blob([filtered]).stream().pipeThrough(new CompressionStream('deflate'));
 const compressed=new Uint8Array(await new Response(stream).arrayBuffer());
 const header=new Uint8Array(13),view=new DataView(header.buffer);view.setUint32(0,WIDTH);view.setUint32(4,HEIGHT);header[8]=8;header[9]=6;
 const parts=[new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())];
 const output=new Uint8Array(parts.reduce((sum,p)=>sum+p.length,0));let offset=0;for(const part of parts){output.set(part,offset);offset+=part.length;}return output;
}
export async function renderReportPng(snapshot,type){
 if(!font){const bytes=Uint8Array.from(atob(fontBase64),c=>c.charCodeAt(0));font=parse(bytes.buffer);}
 const svg=renderReportSvg(snapshot,type),canvas=surface();
 // Only render the controlled primitives generated by renderReportSvg; no external resources.
 const body=svg.slice(svg.indexOf('</defs>')+7);
 for(const match of body.matchAll(/<(rect|path|text)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g)){
  const tag=match[1],attrs={};for(const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[attr[1]]=unescape(attr[2]);
  const n=name=>Number(attrs[name]||0),opacity=attrs.opacity?Number(attrs.opacity):1;
  if(tag==='rect'){
   if(attrs.stroke){const sw=Number(attrs['stroke-width']||1);canvas.fillRect(n('x')-sw/2,n('y')-sw/2,n('width')+sw,n('height')+sw,attrs.stroke,n('rx')+sw/2,opacity);}
   canvas.fillRect(n('x'),n('y'),n('width'),n('height'),attrs.fill||'none',n('rx'),opacity);
  }else if(tag==='path'){
   const contours=flatten(pathCommands(attrs.d||''));
   if(attrs.fill&&attrs.fill!=='none')canvas.fillContours(contours,color(attrs.fill==='url(#violet)'?'#7227dc':attrs.fill),opacity);
   if(attrs.stroke)for(const contour of contours)for(let i=1;i<contour.length;i++)canvas.line(contour[i-1],contour[i],color(attrs.stroke),Number(attrs['stroke-width']||1),opacity);
  }else{
   const value=unescape((match[3]||'').replace(/<[^>]+>/g,'')),size=Number(attrs['font-size']||24);
   let x=n('x');if(attrs['text-anchor']==='end')x-=font.getAdvanceWidth(value,size);
   const commands=font.getPath(value,x,n('y'),size).commands;
   if(commands.length)canvas.fillContours(flatten(commands),color(attrs.fill||'#fff'),opacity);
  }
 }
 return encode(canvas.data);
}
