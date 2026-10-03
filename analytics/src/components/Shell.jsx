import Avatar from './Avatar.jsx';
import { BarChart3, House, Monitor, Instagram, FileText, Link2, Clock3, Menu, X, CalendarDays, Info, MessageCircle, Users, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { periods as demoPeriods } from '../data.js';

const navigation = [
  { id: 'overview', label: 'Visão geral', icon: House },
  { id: 'website', label: 'Site', icon: Monitor },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'integrations', label: 'Integrações', icon: Link2 },
  { id: 'access', label: 'Acesso da equipe', icon: Users },
];

export default function Shell({ profiles=[],userId, page, onPageChange, periodId, onPeriodChange, onReportOpen, periods=demoPeriods, reportAvailable=true, demo=true, updatedAt, sourceUpdatedAt, onRefresh, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const current = navigation.find((item) => item.id === page);
  const subtitles = {
    overview: 'Entenda o caminho entre a visita e o contato.',
    website: 'Veja como as pessoas chegam e navegam pelo seu site.',
    instagram: 'Descubra os conteúdos que aproximam sua audiência.',
    whatsapp: 'Acompanhe quem chegou, pediu orçamento e avançou.',
    reports: 'Seu desempenho da semana, pronto para acompanhar.',
    integrations: 'Conecte as fontes para começar a medir de verdade.',
    access: 'O mesmo painel para vocês, com acessos individuais.',
  };
  function navigate(id) { onPageChange(id); setMenuOpen(false); }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <div className="mobile-bar">
        <span className="brand">Tuna<span>Stream</span></span>
        <button className="icon-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <aside className={'sidebar' + (menuOpen ? ' open' : '')}>
        <div className="brand-block"><div className="brand">Tuna<span>Stream</span></div><p>Painel</p></div>
        <nav aria-label="Navegação principal">
          {navigation.map(({ id, label, icon: Icon }) => <button key={id} className={'nav-item' + (page === id ? ' selected' : '')} aria-current={page === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon size={23} strokeWidth={1.7} /><span>{label}</span></button>)}
        </nav>
        <button className="sidebar-profile" onClick={()=>navigate('access')}><Avatar profile={profiles.find(p=>p.user_id===userId)||profiles[0]} alt="Meu perfil"/><span>{profiles.find(p=>p.user_id===userId)?.display_name||profiles[0]?.display_name||'Meu perfil'}<small>Foto e acesso</small></span></button><div className="sidebar-bottom"><div><Clock3 size={16} />Horário de Brasília</div><p>{demo?'Fontes pendentes':'Acesso da equipe'}</p><small>{demo?'Prévia com dados ilustrativos.':updatedAt?'Atualizado em '+new Date(updatedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Aguardando a primeira coleta.'}</small></div>
      </aside>
      <main className="main-content" id="main-content">
        <header className="page-header">
          <div><h1>{current.label}</h1>{page!=='overview'&&<p>{subtitles[page]}</p>}</div>
          <div className="header-actions">
            <label className="period-control"><CalendarDays size={18} /><select aria-label="Período de análise" value={periodId} onChange={(event) => onPeriodChange(event.target.value)}>{periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}</select></label>
            <button className="button primary" onClick={onReportOpen} disabled={!reportAvailable}><FileText size={17} />Ver relatório</button>
            {!demo&&<button className="icon-button" aria-label="Atualizar métricas" onClick={onRefresh}><RefreshCw size={17}/></button>}
          </div>
        </header>
        {!demo&&sourceUpdatedAt&&<div className="source-freshness" aria-label="Última coleta por fonte">{[['website','Site'],['instagram','Instagram'],['whatsapp','WhatsApp']].map(([id,label])=>{const date=sourceUpdatedAt[id]?new Date(sourceUpdatedAt[id]):new Date(NaN);return <span key={id}><Clock3 size={13}/><strong>{label}:</strong>{Number.isFinite(date.getTime())?date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'Aguardando coleta'}</span>;})}</div>}
        {demo&&<div className="demo-banner"><Info size={24} className="demo-info" /><p><strong>Modo demonstração</strong><span className="banner-dot"> · </span>Os números abaixo são exemplos. <button onClick={() => navigate('integrations')}>Conecte suas contas</button> para ver dados reais.</p></div>}
        {children}
      </main>
    </div>
  );
}
