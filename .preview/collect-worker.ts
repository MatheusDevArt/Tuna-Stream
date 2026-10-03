import collect from '../analytics/supabase/functions/tuna-collect/index.ts';
import {configureRuntime} from '../analytics/supabase/functions/_shared/server.ts';
import {lookupBrazil} from './br-geography.js';
export default {
 async fetch(request:Request,bindings:any){
  const url=new URL(request.url);
  if(url.pathname==='/api/coleta'){
   configureRuntime({...Object.fromEntries(Object.entries(bindings).filter(([,v])=>typeof v==='string')),TUNA_TRUST_PLATFORM_GEO:'true'} as Record<string,string>);
   const headers=new Headers(request.headers),geo=(request as any).cf;
   for(const name of ['x-real-ip','x-forwarded-for','x-tuna-region','x-tuna-city','x-tuna-country'])headers.delete(name);
   headers.set('x-real-ip',request.headers.get('cf-connecting-ip')||'unknown');
   const country=geo?.country||request.headers.get('cf-ipcountry');
   if(country)headers.set('x-tuna-country',String(country));
   if(geo?.country==='BR'&&geo?.regionCode)headers.set('x-tuna-region',String(geo.regionCode));
   if(geo?.country==='BR'&&geo?.city)headers.set('x-tuna-city',String(geo.city).slice(0,80));
   if(country==='BR'&&(!geo?.regionCode||!geo?.city)){
    try{const place=await lookupBrazil(request.headers.get('cf-connecting-ip')||'');if(place){headers.set('x-tuna-region',place.region);if(place.city)headers.set('x-tuna-city',place.city);}}catch{/* Never guess a locality when the database cannot resolve it. */}
   }
   return collect(new Request(request,{headers}));
  }
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/.'))return new Response('Não encontrado',{status:404});
  if(!bindings.ASSETS)return new Response('Temporariamente indisponível',{status:503});
  const response=await bindings.ASSETS.fetch(request),headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  if(headers.get('Content-Type')?.includes('text/html'))headers.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,headers});
 }
};
