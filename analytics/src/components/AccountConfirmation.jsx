import {useState} from 'react';
import {invokeEndpoint} from '../lib/endpoints.js';
export default function AccountConfirmation({token,onDone,onRequireLogin}){
 const [password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[kind,setKind]=useState(''),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState('');
 async function submit(event){event.preventDefault();setBusy(true);setFeedback('');try{
  if(kind==='password'&&(password.length<10||password!==repeat)){setFeedback('Use pelo menos 10 caracteres e repita a mesma senha.');return;}
  const result=await invokeEndpoint('tuna-account',{body:{action:'complete',token,password:kind==='password'?password:undefined}});
  if(result.data?.needsPassword){setKind('password');return;}
  if(result.data?.needsLogin){onRequireLogin();return;}
  if(result.error)throw new Error('Este link expirou, já foi usado ou pertence a outra conta. Solicite um novo link.');
  setFeedback('Alteração confirmada.');setKind('done');setPassword('');setRepeat('');
 }catch(error){setFeedback(error.message);}finally{setBusy(false);}}
 return <div className="auth-screen"><section className="auth-card"><h1>Confirmar alteração</h1><p>Use este link somente para a alteração que você solicitou.</p><form className="account-form" onSubmit={submit}>{kind==='password'&&<><label>Nova senha<input type="password" minLength={10} maxLength={200} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/></label><label>Repetir nova senha<input type="password" required value={repeat} onChange={e=>setRepeat(e.target.value)} autoComplete="new-password"/></label></>}{kind!=='done'&&<button className="button primary" disabled={busy}>{busy?'Confirmando…':kind==='password'?'Salvar nova senha':'Confirmar minha solicitação'}</button>}</form><p className="feedback" role="status">{feedback}</p><button className="button secondary view-section" onClick={onDone}>Voltar ao painel</button></section></div>;
}
