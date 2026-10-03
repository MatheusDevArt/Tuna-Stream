const numberFormatter = new Intl.NumberFormat('pt-BR');
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const formatNumber = (value) => value == null ? 'Não disponível' : numberFormatter.format(value);
export const formatPercent = (value) => value == null ? 'Sem base anterior' : percentFormatter.format(value) + '%';
export const rate = (numerator, denominator) => numerator==null||denominator==null?null:denominator > 0 ? (numerator / denominator) * 100 : 0;

export function variation(current, previous) {
  if (current == null || previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function formatDuration(seconds) {
  if (seconds == null) return 'Não disponível';
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  return minutes ? minutes + 'min ' + (rounded % 60) + 's' : rounded + 's';
}

export function getPreviousCompleteWeek(localDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new Error('Expected YYYY-MM-DD');
  const date = new Date(localDate + 'T12:00:00Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== localDate) throw new Error('Invalid date');
  const dayOffset = (date.getUTCDay() + 6) % 7;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - dayOffset - 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function getSuggestions(data) {
  if (!data || !data.packages || !(data.visits > 0)) return [];
  const suggestions = [];
  const overallRate = rate(data.whatsappClicks, data.packageClicks);
  const mostClicked = [...data.packages].sort((a, b) => b.clicks - a.clicks)[0];
  if (mostClicked && mostClicked.clicks > 0 && mostClicked.whatsapp!=null && overallRate!=null && rate(mostClicked.whatsapp, mostClicked.clicks) < overallRate) {
    suggestions.push({
      title: 'Revise o CTA do ' + mostClicked.name,
      body: formatNumber(mostClicked.clicks) + ' cliques, mas só ' + formatPercent(rate(mostClicked.whatsapp, mostClicked.clicks)) + ' seguem para o WhatsApp. Teste um convite mais específico para conversar.',
    });
  }
  if (data.packagesReached!=null && rate(data.packagesReached, data.visits) < 70) {
    suggestions.push({
      title: 'Leve os pacotes para mais perto',
      body: formatPercent(rate(data.packagesReached, data.visits)) + ' das visitas chegam aos pacotes. Deixe o caminho até eles mais visível no início.',
    });
  }
  const bestPost = [...(data.posts || [])].filter(post=>Number.isFinite(post.reach)).sort((a, b) => b.reach - a.reach)[0];
  if (bestPost) suggestions.push({
    title: 'Repita os temas dos melhores posts',
    body: '“' + bestPost.title + '” liderou o alcance. Teste outro ' + (bestPost.format||'conteúdo').toLowerCase() + ' sobre o mesmo tema.',
  });
  return suggestions.slice(0, 3);
}

function comparisonLine(label, current, previous) {
  const change = variation(current, previous);
  return label + ': ' + (change == null ? 'sem base anterior' : (change >= 0 ? '↑ ' : '↓ ') + formatPercent(Math.abs(change)));
}

export function generateReport(snapshot) {
  const { current, previous, period, demo } = snapshot;
  const bestPost = [...(current.posts || [])].sort((a, b) => b.reach - a.reach)[0];
  const suggestions = getSuggestions(current);
  return [
    demo ? '⚠️ DEMONSTRAÇÃO — dados ilustrativos, sem envio real.' : '📊 TunaStream · relatório semanal',
    '📅 ' + period.label,
    '',
    '🌐 SITE',
    formatNumber(current.visits) + ' visitas · ' + formatNumber(current.uniqueVisitors) + ' visitantes únicos',
    'Tempo médio: ' + formatDuration(current.averageDuration),
    'Região: ' + (current.topRegion || 'Não disponível') + ' · Origem: ' + (current.topSource || 'Não disponível'),
    'Seção mais vista após o início: ' + (current.topSection || 'Não disponível'),
    'Pacote mais clicado: ' + (current.topPackage || 'Não disponível'),
    'WhatsApp: ' + formatNumber(current.whatsappClicks) + ' cliques · ' + formatNumber(current.websiteReceivedContacts) + ' contatos vindos do site',
    'Pedidos de orçamento vindos do site: ' + formatNumber(current.websiteQuoteRequests),
    '',
    '📸 INSTAGRAM',
    'Seguidores: +' + formatNumber(current.followersGained) + ' / −' + formatNumber(current.followersLost) + ' · saldo ' + formatNumber(current.netFollowers),
    'Alcance: ' + formatNumber(current.instagramReach),
    'Perfil: ' + formatNumber(current.profileVisits) + ' visitas · Bio: ' + formatNumber(current.bioClicks) + ' cliques',
    'Melhor post: ' + (bestPost ? bestPost.title + ' (' + bestPost.format + ')' : 'Não disponível'),
    '',
    '↕️ COMPARAÇÃO COM A SEMANA ANTERIOR',
    comparisonLine('Visitas', current.visits, previous.visits),
    comparisonLine('WhatsApp', current.whatsappClicks, previous.whatsappClicks),
    comparisonLine('Alcance', current.instagramReach, previous.instagramReach),
    '',
    '🎯 CLIQUES NO WHATSAPP / VISITAS: ' + formatPercent(rate(current.whatsappClicks, current.visits)),
    'Visita → pacotes → escolha → clique no WhatsApp',
    'Orçamentos atribuídos ao site / visitas: ' + (current.websiteQuoteRequests==null||!(current.visits>0)?'Não disponível':formatPercent(rate(current.websiteQuoteRequests,current.visits))),
    '',
    '💡 PRÓXIMOS PASSOS',
    ...suggestions.map((item, index) => (index + 1) + '. ' + item.title + ': ' + item.body),
    '',
    'Horário de Brasília · semana completa de segunda a domingo',
  ].join('\n');
}
