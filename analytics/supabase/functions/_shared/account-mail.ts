import {admin,check,digest,env} from './server.ts';
export function panelUrl(){
 const url=new URL(env('TUNA_PANEL_URL'));
 if(url.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('configuration_missing');
 if(url.username||url.password||url.search||url.hash)throw new Error('configuration_missing');
 return url;
}
export async function createRequest(userId:string,teamId:string,kind:string,payload:Record<string,unknown>,email:string){
 // Check configuration before saving a request. Token never appears in logs.
 const key=env('RESEND_API_KEY'),from=env('TUNA_MAIL_FROM'),url=panelUrl();
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join('');
 const hash=await digest(token,env('TUNA_RATE_SECRET'));
 const db=admin();await db.from('account_requests').delete().eq('user_id',userId).eq('kind',kind);
 check(await db.from('account_requests').insert({token_hash:hash,user_id:userId,team_id:teamId,kind,payload}));
 url.searchParams.set('account_token',token);
 const label=kind==='email'?'confirmar seu e-mail':kind==='username'?'confirmar a troca de usuário':'definir uma nova senha';
 let response;
 try{response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':hash},body:JSON.stringify({from,to:[email],subject:'TunaStream · confirmação de acesso',text:`Você solicitou ${label} no painel TunaStream.\n\nConfirme pelo link privado (válido por 15 minutos):\n${url.href}\n\nSe não foi você, ignore esta mensagem. Nenhuma alteração é feita ao apenas abrir o link.`}),signal:AbortSignal.timeout(15000)});}catch{await db.from('account_requests').delete().eq('token_hash',hash);throw new Error('mail_unavailable');}
 if(!response.ok){await db.from('account_requests').delete().eq('token_hash',hash);throw new Error('mail_unavailable');}
}
