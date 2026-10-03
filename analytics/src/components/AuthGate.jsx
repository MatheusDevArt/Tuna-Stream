import {useEffect,useState} from 'react';
import {LockKeyhole,ShieldCheck,LogIn} from 'lucide-react';
import {supabase} from '../lib/supabase.js';
import {invokeEndpoint} from '../lib/endpoints.js';
import {launch} from '../lib/launch.js';
import AccountConfirmation from './AccountConfirmation.jsx';
export default function AuthGate({children}){
 const localDemo=import.meta.env.VITE_ALLOW_LOCAL_DEMO==='true'&&['127.0.0.1','localhost'].includes(window.location.hostname)&&new URLSearchParams(location.search).get('modo')==='demonstracao';
 const [session,setSession]=useState(null),[loading,setLoading]=useState(Boolean(supabase)),[error,setError]=useState('');
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[forgot,setForgot]=useState(false),[confirmation,setConfirmation]=useState(Boolean(launch.accountToken));
 useEffect(()=>{
  if(!supabase)return;let active=true;
  supabase.auth.getSession().then(({data,error})=>{if(active){setSession(data.session);setLoading(false);if(error)setError('Não foi possível verificar sua sessão. Entre novamente.');}}).catch(()=>{if(active){setLoading(false);setError('Não foi possível verificar sua sessão.');}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{if(active){setSession(nextSession);setLoading(false);}});
  return()=>{active=false;subscription.unsubscribe();};
 },[]);
 async function submit(event){
  event.preventDefault();setError('');setBusy(true);
  try{
   const result=await invokeEndpoint(forgot?'tuna-account':'tuna-login',{body:forgot?{action:'recover',username}:{username,password}});
   if(forgot){if(result.error)throw new Error('recovery');setError('Se este usuário tiver um e-mail confirmado, enviaremos um link para ele.');return;}
   if(result.error||!result.data?.access_token)throw new Error('login');
   const saved=await supabase.auth.setSession(result.data);if(saved.error)throw new Error('session');
   if(launch.accountToken)setConfirmation(true);
  }catch{setError(forgot?'O serviço de recuperação ainda não está disponível.':'Não foi possível entrar. Confira o usuário e a senha. Se tentou várias vezes, aguarde 15 minutos.');}
  finally{setPassword('');setBusy(false);}
 }
 if(localDemo)return children({session:null,demo:true});
 if(loading)return <div className="auth-screen"><p role="status">Verificando seu acesso…</p></div>;
 if(confirmation)return <AccountConfirmation token={launch.accountToken} onRequireLogin={()=>{setConfirmation(false);setError('Entre na conta que solicitou esta alteração para confirmar o e-mail ou usuário.');}} onDone={()=>{launch.accountToken='';setConfirmation(false);}}/>;
 if(!supabase){
  if(import.meta.env.VITE_REQUIRE_AUTH==='true')return <div className="auth-screen"><p role="alert">O acesso protegido ainda está sendo configurado. Tente novamente mais tarde.</p></div>;
  return children({session:null,demo:true});
 }
 if(session&&!forgot)return children({session,demo:false});
 return <div className="auth-screen"><div className="auth-brand">TUNA<span>STREAM</span></div><section className="auth-card"><LockKeyhole size={32}/><h1>{forgot?'Recuperar acesso':'Acesso da equipe'}</h1><p>{forgot?'O link será enviado para o e-mail de recuperação confirmado.':'Entre com seu nome de usuário e senha.'}</p><form onSubmit={submit}>
 <label>Nome de usuário<input value={username} onChange={event=>setUsername(event.target.value)} required maxLength={80} autoComplete="username" placeholder="Seu usuário"/></label>
 {!forgot&&<label>Senha<input type="password" value={password} onChange={event=>setPassword(event.target.value)} required maxLength={200} autoComplete="current-password"/></label>}
 <button className="button primary" disabled={busy}><LogIn size={16}/>{busy?'Aguarde…':forgot?'Enviar link de recuperação':'Entrar no painel'}</button>
 {error&&<p role="status" className="auth-error">{error}</p>}
 </form><button className="auth-reset" onClick={()=>{setForgot(!forgot);setError('');setPassword('');}}>{forgot?'Voltar ao login':'Esqueci minha senha'}</button><p className="auth-note"><ShieldCheck size={15}/>Acesso privado da equipe TunaStream.</p></section></div>;
}
