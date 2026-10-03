import {Resvg,initWasm} from 'npm:@resvg/resvg-wasm@2.6.2';
import {fontBase64} from './font-data.js';
import {renderReportSvg} from './report-image.js';
let initialized:Promise<void>|null=null;
export async function renderPng(snapshot:any,type:string){
 if(!initialized)initialized=(async()=>{
  // Pinned WASM file; no user-supplied URL is fetched.
  const response=await fetch('https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm',{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('renderer_unavailable');await initWasm(await response.arrayBuffer());
 })().catch(error=>{initialized=null;throw error;});
 await initialized;
 const font=Uint8Array.from(atob(fontBase64),c=>c.charCodeAt(0));
 const renderer=new Resvg(renderReportSvg(snapshot,type),{font:{fontBuffers:[font],loadSystemFonts:false,defaultFontFamily:'Poppins'}});
 const rendered=renderer.render();try{return rendered.asPng();}finally{rendered.free();renderer.free();}
}
