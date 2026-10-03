const date=value=>value&&Number.isFinite(new Date(value).getTime())?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'não disponível';
export function instagramHealth(source,health={},now=Date.now()){
 if(health.status==='error'){
  const reason={token_expired:'A autorização expirou. Reconecte o Instagram.',provider_rate_limited:'A Meta limitou temporariamente as consultas.',provider_permission_denied:'A Meta recusou uma permissão da integração.',metrics_unavailable:'A Meta não retornou métricas suficientes.'}[health.errorCode]||'A última coleta não foi concluída.';
  return {headline:'Instagram: coleta precisa de atenção',detail:reason+' Tentativa em '+date(health.lastAttemptAt)+'. Os dados exibidos mantêm a data da última coleta válida.',tone:'error'};
 }
 if(source?.provider==='meta'&&now-new Date(source.collectedAt).getTime()>2*3600000)return {headline:'Instagram: dados sem atualização recente',detail:'Última coleta válida em '+date(source.collectedAt)+'. Confira a integração antes de usar estes números como atuais.',tone:'warning'};
 return null;
}
