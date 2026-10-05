import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNumber, formatPercent, variation } from '../report.js';

export function MetricCard({ label, value, previous, icon: Icon, color = 'purple', prefix = '', format = formatNumber }) {
  const change = variation(value, previous);
  const Direction = change < 0 ? ArrowDownRight : ArrowUpRight;
  return <article className="metric-card"><div className="metric-label"><Icon size={23} className={'icon-' + color} strokeWidth={1.7} /><h2>{label}</h2></div><div className="metric-value-row"><strong className={value==null?'unavailable-value':undefined}>{value==null?'':prefix}{format(value)}</strong>{change!=null&&<span className={'metric-change' + (change < 0 ? ' negative' : '')}><Direction size={17}/>{(change >= 0 ? '+' : '−') + formatPercent(Math.abs(change))}</span>}</div>{change!=null&&<p>vs. período anterior</p>}</article>;
}

export function MetricStrip({ items }) {
  return <section className="metric-strip" aria-label="Métricas principais">{items.map((item) => <MetricCard key={item.label} {...item} />)}</section>;
}

export function Panel({ title, children, className = '', action }) {
  return <section className={'panel ' + className}><div className="panel-heading"><h2>{title}</h2>{action}</div>{children}</section>;
}

export function RankedBars({ items, percentage = true, color = 'purple' }) {
  const maximum = percentage ? 100 : Math.max(...items.map((item) => item[1]), 1);
  return <div className="ranked-bars">{items.map(([label, value]) => <div className="ranked-row" key={label}><div className="ranked-label"><span>{label}</span><strong>{formatNumber(value)}{percentage ? '%' : ''}</strong></div><div className="bar-track"><div className={'bar-fill ' + color} style={{ width: (value / maximum) * 100 + '%' }} /></div></div>)}</div>;
}

export function PackageTable({ packages }) {
  return <div className="table-scroll"><table><thead><tr><th>Pacote</th><th>Cliques</th><th>WhatsApp</th><th>Conversão</th></tr></thead><tbody>{packages.map((item) => <tr key={item.name}><th scope="row">{item.name}</th><td>{formatNumber(item.clicks)}</td><td>{formatNumber(item.whatsapp)}</td><td>{formatPercent(item.clicks ? item.whatsapp / item.clicks * 100 : 0)}</td></tr>)}</tbody></table></div>;
}
