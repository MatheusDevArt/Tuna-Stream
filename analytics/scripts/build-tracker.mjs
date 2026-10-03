import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
await build({entryPoints:[fileURLToPath(new URL('../src/tracker.js',import.meta.url))],outfile:fileURLToPath(new URL('../../assets/tuna-analytics.js',import.meta.url)),bundle:true,minify:true,format:'iife',target:['es2020']});
console.log('Website tracker built.');
