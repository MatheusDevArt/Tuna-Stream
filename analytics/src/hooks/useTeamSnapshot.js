import { useCallback,useEffect,useRef,useState } from 'react';
import { supabase } from '../lib/supabase.js';

export function useTeamSnapshot(session,period){
 const key=(session?.user.id||'')+':'+period.start+':'+period.end;
 const [state,setState]=useState({key:null,loading:true,snapshot:null,error:null,updatedAt:null});
 const generation=useRef(0);
 const refresh=useCallback(async()=>{
  if(!session||!supabase)return;
  const attempt=++generation.current;
  setState(current=>current.key===key?{...current,error:null}:{key,loading:true,snapshot:null,error:null,updatedAt:null});
  try {
   const member=await supabase.from('team_members').select('team_id').eq('user_id',session.user.id).limit(1).maybeSingle();
   if(member.error)throw new Error('membership');
   if(!member.data)throw new Error('unauthorized');
   const result=await supabase.from('analytics_snapshots').select('current_metrics,previous_metrics,updated_at').eq('team_id',member.data.team_id).eq('period_start',period.start).eq('period_end',period.end).maybeSingle();
   if(result.error)throw new Error('query');
   if(attempt!==generation.current)return;
   setState({key,loading:false,snapshot:result.data?{demo:false,period,current:result.data.current_metrics,previous:result.data.previous_metrics}:null,error:null,updatedAt:result.data?.updated_at||null});
  } catch(error){
   if(attempt!==generation.current)return;
   setState({key,loading:false,snapshot:null,error:error.message==='unauthorized'?'Seu acesso ainda não foi autorizado para a equipe.':'Não conseguimos carregar as métricas. Verifique sua conexão e tente atualizar.',updatedAt:null});
  }
 },[session?.user.id,period.start,period.end,key]);
 useEffect(()=>{
  if(!session||!supabase)return;
  refresh();
  const timer=setInterval(refresh,60000);
  const visibility=()=>{if(document.visibilityState==='visible')refresh();};
  document.addEventListener('visibilitychange',visibility);
  const channel=supabase.channel('team-metrics-'+session.user.id).on('postgres_changes',{event:'*',schema:'public',table:'analytics_snapshots'},()=>refresh()).subscribe();
  return()=>{generation.current++;clearInterval(timer);document.removeEventListener('visibilitychange',visibility);supabase.removeChannel(channel);};
 },[refresh,session?.user.id]);
 const visible=state.key===key?state:{key,loading:true,snapshot:null,error:null,updatedAt:null};
 return {...visible,refresh};
}
