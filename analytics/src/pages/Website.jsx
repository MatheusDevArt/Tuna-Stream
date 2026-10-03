import { Monitor, Users, Clock3, Activity, ExternalLink } from 'lucide-react';
import { business } from '../data.js';
import { MetricStrip, Panel, RankedBars, PackageTable } from '../components/Metrics.jsx';
import { Funnel } from '../components/Charts.jsx';
import { formatDuration, formatPercent, formatNumber } from '../report.js';
const clickLabels={whatsapp:'WhatsApp',instagram:'Instagram',navigation:'Navegação',service_tab:'Detalhes dos serviços',package_tab:'Categorias de pacote',portfolio:'Portfólio',faq:'Perguntas frequentes',other_button:'Outros botões',other_link:'Outros links'};

export default function Website({ snapshot }) {
  const { current, previous } = snapshot;
  return <>
    <a className="source-link" href={business.website} target="_blank" rel="noopener noreferrer">{business.website.replace('https://', '')}<ExternalLink size={15} /></a>
    <MetricStrip items={[
      { label: 'Visitas', value: current.visits, previous: previous.visits, icon: Monitor },
      { label: 'Visitantes únicos', value: current.uniqueVisitors, previous: previous.uniqueVisitors, icon: Users },
      { label: 'Tempo médio', value: current.averageDuration, previous: previous.averageDuration, icon: Clock3, format: formatDuration },
      { label: 'Taxa de engajamento', value: current.engagementRate, previous: previous.engagementRate, icon: Activity, format: formatPercent },
    ]} />
    <div className="three-columns"><Panel title="De onde vêm as visitas"><RankedBars items={current.sources} /></Panel><Panel title="Estados em destaque"><RankedBars items={current.regions} /></Panel><Panel title="Dispositivos"><RankedBars items={current.devices} color="mint" /></Panel></div>
    <div className="two-columns"><Panel title="Seções vistas"><RankedBars items={current.sections} percentage={false} /><p className="panel-note">Uma visita pode aparecer em mais de uma seção.</p></Panel><Funnel data={current} /></div>
    <div className="three-columns"><Panel title="Tempo de permanência"><RankedBars items={current.durations} /></Panel><Panel title="Profundidade de rolagem"><RankedBars items={current.scroll} percentage={false} /></Panel><Panel title="Saúde do site"><dl className="detail-list">{current.webVitals.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>Erros JavaScript</dt><dd>{current.jsErrors??'Não disponível'}</dd></div></dl><p className="panel-note">{snapshot.demo?'Valores ilustrativos. A coleta será instalada na próxima etapa.':'Métricas disponíveis na última coleta do site.'}</p></Panel></div>
    <div className="two-columns"><Panel title="Pacotes que despertam interesse"><PackageTable packages={current.packages} /></Panel><Panel title="Público e horários"><dl className="detail-list"><div><dt>Novos visitantes</dt><dd>{formatNumber(current.newVisitors)}</dd></div><div><dt>Visitantes que retornaram</dt><dd>{formatNumber(current.returningVisitors)}</dd></div><div><dt>Taxa de rejeição</dt><dd>{formatPercent(current.bounceRate)}</dd></div><div><dt>Maior movimento</dt><dd>{current.peakDay}</dd></div><div><dt>Horário de pico</dt><dd>{current.peakTime}</dd></div></dl></Panel></div>
    <div className="three-columns"><Panel title="Navegadores"><RankedBars items={current.browsers||[]} /></Panel><Panel title="Sistemas operacionais"><RankedBars items={current.operatingSystems||[]} /></Panel><Panel title="Cliques por tipo"><RankedBars items={(current.buttonClicks||[]).map(([label,value])=>[clickLabels[label]||'Outros',value])} percentage={false}/></Panel></div>
    <div className="three-columns"><Panel title="Páginas vistas"><RankedBars items={current.pages||[]} percentage={false}/></Panel><Panel title="Países · Google Analytics"><RankedBars items={current.countries||[]} percentage={false}/></Panel><Panel title="Cidades do Brasil · Google Analytics"><RankedBars items={current.cities||[]} percentage={false}/><p className="panel-note">Localização aproximada. Esta fonte pode ter atraso e ocultar grupos pequenos.</p></Panel></div>
  </>;
}
