export const business = {
  name: 'TunaStream',
  website: 'https://tunastream-ofc.lovable.app',
  instagram: 'https://www.instagram.com/tuna.stream/',
  handle: '@tuna.stream',
  accountType: 'Criador de conteúdo',
  timezone: 'America/Sao_Paulo',
};

export const periods = [
  { id: 'last-week', label: '21 a 27 set. 2026', start: '2026-09-21', end: '2026-09-27' },
  { id: 'previous-week', label: '14 a 20 set. 2026', start: '2026-09-14', end: '2026-09-20' },
];

const recentWeek = {
  websiteReceivedContacts: 28, websiteQuoteRequests: 19,
  receivedContacts: 28, quoteRequests: 19, quoteSent: 12, closed: 6, inboundMessages: 67,
  visits: 1248, uniqueVisitors: 942, newVisitors: 732, returningVisitors: 210,
  averageDuration: 94, engagementRate: 66.5, bounceRate: 33.5,
  packagesReached: 714, packageClicks: 215, whatsappClicks: 86,
  instagramReach: 8420, followersGained: 61, followersLost: 14,
  netFollowers: 47, followersTotal: 2318, profileVisits: 326, bioClicks: 112,
  dailyVisits: [132, 153, 170, 230, 209, 190, 164],
  peakDay: 'Quinta-feira', peakTime: '19h–21h',
  topRegion: 'Rio de Janeiro', topSource: 'Instagram',
  topSection: 'Pacotes', topPackage: 'Live',
  sources: [['Instagram', 62], ['Direto', 18], ['Google', 11], ['WhatsApp', 6], ['Outros', 3]],
  regions: [['Rio de Janeiro', 42], ['São Paulo', 25], ['Minas Gerais', 12], ['Outros estados', 21]],
  devices: [['Celular', 74], ['Computador', 24], ['Tablet', 2]],
  durations: [['Menos de 10s', 18], ['10–30s', 16], ['30–60s', 21], ['1–3min', 30], ['3min ou mais', 15]],
  sections: [['Início', 1248], ['Configuração', 624], ['Design', 585], ['Trabalhos', 540], ['Pacotes', 714], ['FAQ', 354], ['Personalizado', 286]],
  scroll: [['25%', 936], ['50%', 749], ['75%', 524], ['100%', 262]],
  packages: [
    { name: 'Start', clicks: 42, whatsapp: 15 },
    { name: 'Live', clicks: 104, whatsapp: 28 },
    { name: 'Streamer', clicks: 49, whatsapp: 25 },
    { name: 'Combos', clicks: 20, whatsapp: 18 },
  ],
  posts: [
    { id: 'demo-carousel', title: 'Checklist para sua live', format: 'Carrossel', reach: 4200, likes: 218, comments: 17, saves: 94, shares: 42 },
    { id: 'demo-reel', title: 'Antes e depois do overlay', format: 'Reel', reach: 2900, likes: 164, comments: 12, saves: 38, shares: 29 },
    { id: 'demo-static', title: '3 ajustes no OBS', format: 'Estático', reach: 1800, likes: 91, comments: 8, saves: 56, shares: 17 },
  ],
  webVitals: [['LCP · conteúdo principal', '1,8s'], ['INP · resposta ao clique', '148ms'], ['CLS · estabilidade visual', '0,04']],
  jsErrors: 2,
};

const previousWeek = {
  ...recentWeek,
  websiteReceivedContacts: 22, websiteQuoteRequests: 15,
  receivedContacts: 22, quoteRequests: 15, quoteSent: 9, closed: 4, inboundMessages: 53,
  visits: 1056, uniqueVisitors: 813, newVisitors: 630, returningVisitors: 183,
  averageDuration: 88, engagementRate: 62.4, bounceRate: 37.6,
  packagesReached: 601, packageClicks: 184, whatsappClicks: 70,
  instagramReach: 7335, followersGained: 52, followersLost: 10,
  netFollowers: 42, followersTotal: 2271, profileVisits: 284, bioClicks: 96,
  dailyVisits: [110, 126, 138, 185, 177, 170, 150],
  packages: [
    { name: 'Start', clicks: 36, whatsapp: 12 },
    { name: 'Live', clicks: 88, whatsapp: 24 },
    { name: 'Streamer', clicks: 43, whatsapp: 21 },
    { name: 'Combos', clicks: 17, whatsapp: 13 },
  ],
  sections: [['Início', 1056], ['Configuração', 533], ['Design', 492], ['Trabalhos', 461], ['Pacotes', 601], ['FAQ', 302], ['Personalizado', 241]],
  scroll: [['25%', 792], ['50%', 634], ['75%', 443], ['100%', 222]],
  posts: [
    { id: 'demo-setup', title: 'Seu primeiro setup de live', format: 'Carrossel', reach: 3600, likes: 181, comments: 11, saves: 75, shares: 31 },
    { id: 'demo-alerts', title: 'Alertas que combinam com você', format: 'Reel', reach: 2500, likes: 148, comments: 9, saves: 32, shares: 26 },
    { id: 'demo-audio', title: 'Como melhorar seu áudio', format: 'Estático', reach: 1400, likes: 77, comments: 6, saves: 43, shares: 15 },
  ],
  jsErrors: 3,
};

const earlierWeek = {
  ...previousWeek, visits: 902, uniqueVisitors: 721, whatsappClicks: 58,
  receivedContacts: 18, quoteRequests: 12, quoteSent: 7, closed: 3, inboundMessages: 45,
  websiteReceivedContacts: 18, websiteQuoteRequests: 12,
  instagramReach: 6580, netFollowers: 38, followersGained: 45, followersLost: 7,
  dailyVisits: [94, 104, 126, 156, 154, 143, 125],
};

export function getDemoSnapshot(periodId) {
  const isPrevious = periodId === 'previous-week';
  return {
    demo: true,
    period: periods[isPrevious ? 1 : 0],
    current: isPrevious ? previousWeek : recentWeek,
    previous: isPrevious ? earlierWeek : previousWeek,
  };
}
