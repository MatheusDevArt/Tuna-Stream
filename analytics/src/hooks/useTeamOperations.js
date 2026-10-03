import {useCallback,useEffect,useState,useRef} from 'react';
import {supabase} from '../lib/supabase.js';
import {invokeEndpoint} from '../lib/endpoints.js';
export function useTeamOperations(session,period){
 const [state,setState]=useState({leads:[],schedule:null,integrations:[],deliveries:[],reportConfigured:false,error:null}),[busy,setBusy]=useState(false);
 const key=(session?.user.id||'')+period.start+period.end,generation=useRef(0);
 const refresh=useCallback(async()=>{
  if(!session||!supabase)return;const attempt=++generation.current;
  try{
   const membership=await supabase.from('team_members').select('team_id').eq('user_id',session.user.id).limit(1).maybeSingle();if(membership.error||!membership.data)throw new Error('access');
   const team=membership.data.team_id,start=period.start+'T00:00:00-03:00',end=new Date(new Date(period.end+'T00:00:00-03:00').getTime()+86400000).toISOString();
   const [leads,schedule,integrations,status]=await Promise.all([
    supabase.from('site_opportunities').select('id,reference,package,source,received_at,stage,attributed').eq('team_id',team).eq('attributed',true).gte('received_at',start).lt('received_at',end).order('received_at',{ascending:false}).limit(200),
    supabase.from('report_preferences').select('weekday,send_time,enabled').eq('team_id',team).maybeSingle(),
    supabase.from('analytics_integrations').select('source,status,mode,last_success_at,first_success_at,error_code').eq('team_id',team),
    invokeEndpoint('tuna-report',{body:{action:'status'}})
   ]);
   if(leads.error||schedule.error||integrations.error)throw new Error('query');
   if(attempt!==generation.current)return;
   setState({key,leads:(leads.data||[]).map(lead=>({...lead,received:new Date(lead.received_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})})),schedule:schedule.data,integrations:integrations.data||[],deliveries:status.data?.deliveries||[],reportConfigured:status.data?.configured||false,error:status.error?'O serviço de envio ainda não está disponível.':null});
  }catch{if(attempt!==generation.current)return;setState(current=>({...current,key,leads:current.key===key?current.leads:[],error:'Não foi possível atualizar as oportunidades e preferências da equipe.'}));}
 },[session?.user.id,period.start,period.end,key]);
 useEffect(()=>{if(!session||!supabase)return;let stopped=false;const load=()=>{if(!stopped)refresh();};load();const timer=setInterval(load,60000);const channel=supabase.channel("team-operations-"+session.user.id).on("postgres_changes",{event:"*",schema:"public",table:"site_opportunities"},load).on("postgres_changes",{event:"*",schema:"public",table:"report_preferences"},load).on("postgres_changes",{event:"*",schema:"public",table:"report_deliveries"},load).subscribe();return()=>{generation.current++;stopped=true;clearInterval(timer);supabase.removeChannel(channel);};},[refresh,session?.user.id]);
 async function invoke(name,body){setBusy(true);try{const result=await invokeEndpoint(name,{body});if(result.error||result.data?.error)throw new Error('Não foi possível salvar. Verifique sua conexão e tente novamente.');await refresh();return result.data;}finally{setBusy(false);}}
 const visible=state.key===key?state:{leads:[],schedule:null,integrations:[],deliveries:[],reportConfigured:false,error:null};
 return {...visible,busy,refresh,confirmContact:body=>invoke("tuna-team",{action:"confirm",...body}),changeStage:(id,stage)=>invoke('tuna-team',{action:'stage',id,stage}),saveSchedule:(schedule)=>invoke('tuna-team',{action:'schedule',weekday:Number(schedule.day),time:schedule.time}),sendReport:()=>invoke('tuna-report',{action:'send'})};
}
