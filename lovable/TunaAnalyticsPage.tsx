/** Existing dashboard: authentication and data remain in its deployed backend. */
export default function TunaAnalyticsPage() {
  const query = typeof window === 'undefined' ? '' : window.location.search;
  return <iframe src={'https://tunastream-painel.matheusdevart.chatgpt.site/' + query}
    title="TunaStream — painel privado da equipe"
    style={{position:'fixed',inset:0,width:'100%',height:'100dvh',border:0,background:'#0c0812'}} />;
}
