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
      { label: 'Contatos vindos do site', value: current.websiteReceivedContacts, previous: previous.websiteReceivedContacts, icon: WhatsAppIcon, color: 'mint' },
      { label: 'Alcance no Instagram', value: current.instagramReach, previous: previous.instagramReach, icon: Instagram, color: 'pink' },
      { label: 'Orçamentos pelo site', value: current.websiteQuoteRequests, previous: previous.websiteQuoteRequests, icon: Users },
    ]} />
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
