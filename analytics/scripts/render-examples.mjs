import {Resvg,initWasm} from '@resvg/resvg-wasm';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {getDemoSnapshot} from '../src/data.js';
import {renderReportSvg} from '../supabase/functions/_shared/report-image.js';
const require=createRequire(import.meta.url);
await initWasm(await readFile(require.resolve('@resvg/resvg-wasm/index_bg.wasm')));
for(const type of ['website','instagram']){
 const renderer=new Resvg(renderReportSvg(getDemoSnapshot('last-week'),type),{font:{fontBuffers:[await readFile(new URL('../public/fonts/poppins-regular.ttf',import.meta.url))],loadSystemFonts:false,defaultFontFamily:'Poppins'}});
 try{const result=renderer.render();try{await writeFile(new URL('../design/relatorio-'+(type==='website'?'site':'instagram')+'-exemplo.png',import.meta.url),result.asPng());}finally{result.free();}}finally{renderer.free();}
}
console.log('Two illustrative PNG reports rendered with the server WASM renderer.');
