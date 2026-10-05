import {Users,Layers,CalendarDays,Activity} from 'lucide-react';
import {MetricStrip} from './Metrics.jsx';
export default function InstagramAccount({account}){
 if(!account)return null;
 const decimal=value=>value==null?'Não disponível':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(value);
 return <section className="instagram-account" aria-label="Retrato atual do Instagram"><div className="account-heading"><h2>Conta hoje</h2><span>Independente do período escolhido</span></div><MetricStrip items={[
 {label:'Seguidores atuais',value:account.followersTotal,icon:Users},
 {label:'Publicações na conta',value:account.publicationsTotal,icon:Layers,color:'pink'},
 {label:'Feed e Reels · últimos 30 dias',value:account.publicationsLast30Days,icon:CalendarDays,color:'mint'},
 {label:'Publicações por semana · média de 30 dias',value:account.publicationsPerWeek,icon:Activity,format:decimal},
 ]}/><p className="panel-note">Atualizado em {new Date(account.collectedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}.{account.lastPublicationAt&&' Último Feed ou Reel: '+new Date(account.lastPublicationAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})+'.'} Stories não entram no total de publicações da conta.</p></section>;
}
