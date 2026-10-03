import {supabase} from './supabase.js';
export async function invokeEndpoint(name,{body}={}){
 const names=new Set(['tuna-login','tuna-team','tuna-report','tuna-account','tuna-instagram']);
 if(!names.has(name))return {data:null,error:new Error('Unsupported endpoint')};
 try{
  const {data:{session}}=await (supabase?.auth.getSession()||Promise.resolve({data:{session:null}}));
  const base=import.meta.env.VITE_API_BASE_URL||window.location.origin;
  const response=await fetch(new URL('/api/public/'+name,base),{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify(body||{}),signal:AbortSignal.timeout(90000)});
  const data=await response.json();
  return response.ok?{data,error:null}:{data,error:new Error('Request failed')};
 }catch{return {data:null,error:new Error('Service unavailable')};}
}
