import {useCallback,useEffect,useState} from 'react';
import {invokeEndpoint} from '../lib/endpoints.js';
import {initialProfiles} from '../lib/profiles.js';
export function useProfiles(session,demo){
 const [state,setState]=useState({profiles:demo?initialProfiles:[],self:null,error:'',busy:false});
 const refresh=useCallback(async()=>{
  if(demo)return;
  const result=await invokeEndpoint('tuna-account',{body:{action:'profile'}});
  if(result.error)setState(s=>({...s,error:'A configuração de perfis ainda não foi ativada neste servidor.'}));
  else setState(s=>({...s,profiles:result.data.profiles,self:result.data.self,error:''}));
 },[demo,session?.user.id]);
 useEffect(()=>{refresh();if(demo)return;const timer=setInterval(refresh,60000);const visible=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',visible);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[refresh,demo]);
 async function action(body){
  setState(s=>({...s,busy:true,error:''}));
  try{const result=await invokeEndpoint('tuna-account',{body});if(result.error)throw new Error(result.data?.error==='configuration_missing'?'O serviço de e-mail ainda precisa ser configurado.':'Não foi possível concluir. Confira os dados e tente novamente.');await refresh();return result.data;}
  finally{setState(s=>({...s,busy:false}));}
 }
 function demoAvatar(url){setState(s=>({...s,profiles:s.profiles.map((p,i)=>i===0?{...p,avatar_url:url}:p)}));}
 return {...state,refresh,action,demoAvatar};
}
