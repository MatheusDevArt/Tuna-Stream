import login from '../supabase/functions/tuna-login/index.ts';
import collect from '../supabase/functions/tuna-collect/index.ts';
import team from '../supabase/functions/tuna-team/index.ts';
import account from '../supabase/functions/tuna-account/index.ts';
import instagram from '../supabase/functions/tuna-instagram/index.ts';
import report from '../supabase/functions/tuna-report/index.ts';
import {configureRuntime} from '../supabase/functions/_shared/server.ts';

const routes={'tuna-login':login,'tuna-collect':collect,'tuna-team':team,'tuna-account':account,'tuna-instagram':instagram,'tuna-report':report};
export default {
 async fetch(request:Request,bindings:any){
  configureRuntime({...Object.fromEntries(Object.entries(bindings).filter(([,value])=>typeof value==='string')),TUNA_TRUST_PLATFORM_GEO:'true'} as Record<string,string>);
  const url=new URL(request.url),name=url.pathname.match(/^\/api\/public\/(tuna-[a-z]+)$/)?.[1];
  if(name&&Object.hasOwn(routes,name)){
   const headers=new Headers(request.headers);
   // Forwarded IP and geographic headers are derived only from the hosting platform.
   headers.delete('x-forwarded-for');headers.set('x-real-ip',headers.get('cf-connecting-ip')||'unknown');
   headers.delete('x-tuna-region');headers.delete('x-tuna-city');headers.delete('x-tuna-country');
   if((request as any).cf?.country)headers.set('x-tuna-country',String((request as any).cf.country));
   if((request as any).cf?.country==='BR'&&(request as any).cf?.regionCode)headers.set('x-tuna-region',(request as any).cf.regionCode);
   if((request as any).cf?.country==='BR'&&(request as any).cf?.city)headers.set('x-tuna-city',String((request as any).cf.city).slice(0,80));
   return routes[name as keyof typeof routes](new Request(request,{headers}));
  }
  if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/_integracao')||url.pathname.startsWith('/.'))return new Response('Não encontrado',{status:404});
  if(!bindings.ASSETS)return new Response('Aplicação temporariamente indisponível',{status:503});
  let response=await bindings.ASSETS.fetch(request);
  if(response.status===404&&!url.pathname.split('/').at(-1)?.includes('.'))response=await bindings.ASSETS.fetch(new Request(new URL('/index.html',url),request));
  const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');
  if(headers.get('Content-Type')?.includes('text/html'))headers.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,headers});
 }
};
