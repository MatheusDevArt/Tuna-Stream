import {useCallback,useEffect,useState,useRef} from 'react';
import {supabase} from '../lib/supabase.js';
import {invokeEndpoint} from '../lib/endpoints.js';
export function useTeamOperations(session,period){
 const [state,setState]=useState({leads:[],crmAvailable:false,schedule:null,integrations:[],deliveries:[],reportConfigured:false,error:null}),[busy,setBusy]=useState(false);
 const key=(session?.user.id||'')+period.start+period.end,generation=useRef(0);
 const refresh=useCallback(async()=>{
  if(!session||!supabase)return;const attempt=++generation.current;
  try{
   const membership=await supabase.from('team_members').select('team_id').eq('user_id',session.user.id).limit(1).maybeSingle();if(membership.error||!membership.data)throw new Error('access');
   const team=membership.data.team_id;
   async function opportunities(){
    const core='id,reference,package,source,received_at,won_at,stage,attributed',extra=',selected_package,identity_method,client_id,client_label,service_category,custom_package_name,customer_state,customer_city,origin,sale_amount,archived_at';
    const probe=await supabase.from('site_opportunities').select(core+extra).eq('team_id',team).eq('attributed',true).order('received_at',{ascending:false}).order('id').range(0,749);
    if(probe.error&&!['42703','PGRST204'].includes(probe.error.code))return probe;
    const upgraded=!probe.error,columns=core+(upgraded?extra:'');let rows=upgraded?(probe.data||[]):[];
    for(let offset=upgraded?750:0;offset<100000;offset+=750){if(upgraded&&offset===750&&rows.length<750)return {data:rows,crmAvailable:true};const result=await supabase.from('site_opportunities').select(columns).eq('team_id',team).eq('attributed',true).order('received_at',{ascending:false}).order('id').range(offset,offset+749);if(result.error)return result;rows.push(...result.data);if(result.data.length<750)return {data:rows,crmAvailable:upgraded};}
    return {error:new Error('history_limit')};
   }
   const [leads,schedule,integrations,status]=await Promise.all([
    opportunities(),
    supabase.from('report_preferences').select('weekday,send_time,enabled,email_reports_enabled').eq('team_id',team).maybeSingle(),
    supabase.from('analytics_integrations').select('source,status,mode,last_success_at,first_success_at,error_code').eq('team_id',team),
    invokeEndpoint('tuna-report',{body:{action:'status'}})
   ]);
   if(leads.error||schedule.error||integrations.error)throw new Error('query');
   if(attempt!==generation.current)return;
   setState({key,crmAvailable:leads.crmAvailable,leads:(leads.data||[]).map(lead=>({...lead,received:new Date(lead.received_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'})})),schedule:schedule.data,integrations:integrations.data||[],deliveries:status.data?.deliveries||[],reportConfigured:status.data?.configured||false,error:status.error?'O serviço de envio ainda não está disponível.':null});
  }catch{if(attempt!==generation.current)return;setState(current=>({...current,key,leads:current.key===key?current.leads:[],error:'Não foi possível atualizar as oportunidades e preferências da equipe.'}));}
 },[session?.user.id,period.start,period.end,key]);
 useEffect(()=>{if(!session||!supabase)return;let stopped=false;const load=()=>{if(!stopped)refresh();};load();const timer=setInterval(load,60000);const channel=supabase.channel("team-operations-"+session.user.id).on("postgres_changes",{event:"*",schema:"public",table:"site_opportunities"},load).on("postgres_changes",{event:"*",schema:"public",table:"report_preferences"},load).on("postgres_changes",{event:"*",schema:"public",table:"report_deliveries"},load).subscribe();return()=>{generation.current++;stopped=true;clearInterval(timer);supabase.removeChannel(channel);};},[refresh,session?.user.id]);
 async function invoke(name,body){setBusy(true);try{const result=await invokeEndpoint(name,{body});if(result.error||result.data?.error)throw new Error('Não foi possível salvar. Verifique sua conexão e tente novamente.');await refresh();return result.data;}finally{setBusy(false);}}
 const visible=state.key===key?state:{leads:[],schedule:null,integrations:[],deliveries:[],reportConfigured:false,error:null};
 return {...visible,busy,refresh,createClient:(id,details)=>invoke('tuna-team',{action:'create-client',id,details}),archiveClient:(id,restore=false)=>invoke('tuna-team',{action:'archive-client',id,restore}),saveClient:(id,details)=>invoke('tuna-team',{action:'client',id,details}),confirmLink:body=>invoke('tuna-team',{action:'confirm-link',...body}),changePackage:(id,pack)=>invoke('tuna-team',{action:'package',id,package:pack}),confirmContact:body=>invoke("tuna-team",{action:"confirm",...body}),changeStage:(id,stage)=>invoke('tuna-team',{action:'stage',id,stage}),saveSchedule:(schedule)=>invoke('tuna-team',{action:'schedule',weekday:Number(schedule.day),time:schedule.time}),sendReport:()=>invoke('tuna-report',{action:'send'})};
}
