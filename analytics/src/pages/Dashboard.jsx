import { Monitor, Instagram, Users } from 'lucide-react';
import { MetricStrip, Panel, PackageTable } from '../components/Metrics.jsx';
import { WeeklyChart, Funnel } from '../components/Charts.jsx';
import { WhatsAppIcon } from '../components/BrandIcons.jsx';
import {Comparison} from '../components/DataViews.jsx';
import BrazilMap from '../components/BrazilMap.jsx';
import TeamHero from '../components/TeamHero.jsx';

export default function Dashboard({ snapshot, onInsights }) {
  const { current, previous } = snapshot;
  return <>
    <TeamHero onInsights={onInsights}/>
    <MetricStrip items={[
      { label: 'Visitas no site', value: current.visits, previous: previous.visits, icon: Monitor },
      { label: 'Visualizações no Instagram', value: current.instagramViews, previous: previous.instagramViews, icon: Instagram, color: 'purple' },
      { label: current.instagramSource?.provider==='metricool'?'Visualizações informadas':'Alcance no Instagram', value: current.instagramSource?.provider==='metricool'?current.instagramViewsObserved:current.instagramReach, previous: current.instagramSource?.provider==='metricool'?null:previous.instagramReach, icon: Instagram, color: 'pink' },
      { label: 'Vendas fechadas', value: current.closed, previous: previous.closed, icon: Users },
    ]} />
    {current.instagramSource?.provider==='metricool'&&<p className="panel-note">Instagram via Metricool · histórico parcial. Visualizações apenas dos dias disponíveis; abra Instagram para conferir as datas e os posts.</p>}
    <div className="dashboard-grid">
      <BrazilMap snapshot={snapshot}/>
      <Funnel data={current} />
      <WeeklyChart current={current.dailyVisits} previous={previous.dailyVisits} />
      <Panel title="O que mudou na semana" className="suggestions-panel"><Comparison current={current} previous={previous} items={[['visits','Visitas'],['websiteReceivedContacts','Contatos do site'],['websiteQuoteRequests','Orçamentos'],['closed','Vendas fechadas']]}/></Panel>
    </div>
    <Panel title="Pacotes que despertam interesse" className="packages-panel overview-packages"><PackageTable packages={current.packages} /></Panel>
    <p className="page-footnote">Clique indica intenção. O link recebido no WhatsApp permite à equipe confirmar a conversa e acompanhar a venda.</p>
  </>;
}
