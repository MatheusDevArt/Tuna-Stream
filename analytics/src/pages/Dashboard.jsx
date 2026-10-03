import { Monitor, Instagram, Users } from 'lucide-react';
import { MetricStrip, Panel, PackageTable } from '../components/Metrics.jsx';
import { WeeklyChart, Funnel } from '../components/Charts.jsx';
import { WhatsAppIcon } from '../components/BrandIcons.jsx';
import { getSuggestions } from '../report.js';
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
      <Panel title="Onde melhorar" className="suggestions-panel"><ol className="suggestion-list">{getSuggestions(current).map((item) => <li key={item.title}><div><h3>{item.title}</h3><p>{item.body}</p></div></li>)}</ol></Panel>
    </div>
    <Panel title="Pacotes que despertam interesse" className="packages-panel overview-packages"><PackageTable packages={current.packages} /></Panel>
    <p className="page-footnote">Clique no WhatsApp indica intenção. Conversas e pedidos reais dependem da conexão com o número que recebe seus clientes.</p>
  </>;
}
