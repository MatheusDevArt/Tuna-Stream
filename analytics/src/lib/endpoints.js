import {supabase} from './supabase.js';
export async function invokeEndpoint(name,{body}={}){
 const names=new Set(['tuna-login','tuna-team','tuna-report','tuna-account','tuna-instagram']);
 if(!names.has(name))return {data:null,error:new Error('Unsupported endpoint')};
 const readOnly=import.meta.env.VITE_LIVE_READ_ONLY==='true';
 if(readOnly&&!(name==='tuna-login'||name==='tuna-report'&&body?.action==='status'||name==='tuna-account'&&body?.action==='profile'||name==='tuna-instagram'&&body?.action==='status'))return {data:{error:'read_only_mode'},error:new Error('O servidor para salvar alterações ainda precisa ser conectado.')};
 try{
  const {data:{session}}=await (supabase?.auth.getSession()||Promise.resolve({data:{session:null}}));
  const base=import.meta.env.VITE_API_BASE_URL||window.location.origin;
  const path=window.location.pathname.startsWith('/historico/')?'/api/old/'+name:'/api/public/'+name;
  const response=await fetch(new URL(path,base),{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify(body||{}),signal:AbortSignal.timeout(90000)});
  const data=await response.json();
  return response.ok?{data,error:null}:{data,error:new Error('Request failed')};
 }catch{return {data:null,error:new Error('Service unavailable')};}
}
