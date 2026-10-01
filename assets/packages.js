/* One catalog powers package cards, comparisons and the custom order form. */
const feature = (id, label, level = 1) => ({id, label, level});
const packageNames = ['START', 'LIVE', 'STREAMER'];
const packageCatalog = {
  configuracao: {label: 'Configuração', plans: {
    START: {cents: 9990, description: 'O essencial para começar com tudo configurado', items: [
      feature('obs', 'OBS configurado do zero'), feature('platforms', 'Configuração de 1 plataforma', 1),
      feature('audio', 'Áudio e microfone'), feature('camera', 'Webcam ou câmera'),
      feature('scenes', '2 cenas principais', 2), feature('hotkeys', 'Teclas de atalho'),
      feature('quality', 'Ajustes básicos de qualidade', 1), feature('test', 'Teste final da transmissão')
    ]},
    LIVE: {cents: 24990, description: 'Sua live em várias plataformas, com interação', items: [
      feature('obs', 'OBS configurado do zero'), feature('platforms', 'Configuração de 3 plataformas', 3),
      feature('optimization', 'OBS otimizado para multistream', 1), feature('audio', 'Áudio e microfone'),
      feature('camera', 'Webcam ou câmera'), feature('scenes', '3 cenas principais', 3),
      feature('hotkeys', 'Teclas de atalho'), feature('alerts', 'Alertas'), feature('livepix', 'LivePix'),
      feature('bot', 'Bot de chat'), feature('quality', 'Ajustes de qualidade e desempenho', 2),
      feature('test', 'Teste final da transmissão')
    ]},
    STREAMER: {cents: 49990, description: 'A estrutura completa para profissionalizar sua live', items: [
      feature('obs', 'OBS configurado do zero'), feature('platforms', 'Configuração de 4 plataformas', 4),
      feature('optimization', 'Otimização completa do OBS', 2), feature('audio', 'Áudio e microfone'),
      feature('camera', 'Webcam ou câmera'), feature('scenes', '5 cenas principais', 5),
      feature('hotkeys', 'Teclas de atalho'), feature('alerts', 'Alertas'), feature('livepix', 'LivePix'),
      feature('bot', 'Bot de chat'), feature('streamelements', 'StreamElements completo'),
      feature('overlay', 'Overlay padrão do StreamElements'), feature('widgets', 'Widgets e elementos da live'),
      feature('commands', 'Comandos e timers'), feature('twitch', 'Canal da Twitch completo'),
      feature('monetization', 'Recursos de monetização'), feature('integration', 'Integração final de tudo'),
      feature('test', 'Teste final da transmissão')
    ]}
  }},
  personalizacao: {label: 'Personalização', plans: {
    START: {cents: 20000, description: 'O visual essencial para dar identidade ao seu canal', items: [
      feature('screen-start', 'Tela de início'), feature('screen-end', 'Tela de fim'), feature('screen-chat', 'Tela de chat'),
      feature('webcam-art', 'Webcam'), feature('banner', 'Banner')
    ]},
    LIVE: {cents: 50000, description: 'Sua identidade em movimento, com mais presença na live', items: [
      feature('screen-start', 'Tela de início (animada)', 2), feature('screen-end', 'Tela de fim (animada)', 2),
      feature('screen-chat', 'Tela de chat (animada)', 2), feature('screen-brb', 'Tela de volto já (animada)', 2),
      feature('webcam-art', 'Webcam'), feature('banner', 'Banner'), feature('panels', 'Painéis (4)', 4),
      feature('alert-art', 'Alertas (3)', 3), feature('transition', 'Transição de cena'),
      feature('branding', 'Identidade visual (lite)', 1)
    ]},
    STREAMER: {cents: 90000, description: 'Uma identidade completa para uma experiência marcante', items: [
      feature('screens', '5 telas animadas (início, fim, chat, offline e volto já)', 5),
      feature('webcam-art', 'Webcam'), feature('banner', 'Banner'), feature('panels', 'Painéis (6)', 6),
      feature('alert-art', 'Alertas (5)', 5), feature('transition', 'Transição de cena'),
      feature('branding', 'Identidade visual (PRO)', 2), feature('badges', 'Distintivos (5)', 5),
      feature('emotes', 'Emotes (5)', 5), feature('charm', 'Amuleto'),
      feature('tiktok-art', 'Versão para TikTok'), feature('chat-art', 'Chat personalizado')
    ]}
  }}
};
const formatPackagePrice = cents => (cents / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
function packageFeatures(kind, name) {
  if (kind === 'ambos') return ['configuracao', 'personalizacao'].flatMap(category => packageFeatures(category, name))
    .map(item => item.id === 'scenes' ? {...item, level: {START: 3, LIVE: 4, STREAMER: 5}[name]} : item);
  const items = packageCatalog[kind].plans[name].items;
  if (kind !== 'personalizacao' || name !== 'STREAMER') return items;
  // Expand the grouped screen line for accurate comparisons and form exclusions.
  return items.flatMap(item => item.id === 'screens'
    ? ['start', 'end', 'chat', 'offline', 'brb'].map(id => feature('screen-' + id, '', 2)) : item);
}
function isPackageUpgrade(kind, name, item) {
  const index = packageNames.indexOf(name);
  if (!index) return false;
  if (item.id === 'screens') return true;
  const previous = packageFeatures(kind, packageNames[index - 1]).find(entry => entry.id === item.id);
  return !previous || item.level > previous.level;
}
packageCatalog.ambos = {label: 'Configuração e personalização', plans: Object.fromEntries(packageNames.map(name => {
  const originalCents = packageCatalog.configuracao.plans[name].cents + packageCatalog.personalizacao.plans[name].cents;
  return [name, {originalCents, cents: Math.round(originalCents * 85 / 100), description: {
    START: 'Seu primeiro setup pronto, com a identidade do seu canal',
    LIVE: 'Mais plataformas e uma identidade animada para sua live',
    STREAMER: 'Configuração completa e identidade visual profissional'
  }[name]}];
}))};

// Combined plans create the artwork and install it in OBS: show each deliverable once.
function combinedPackageGroups(name) {
  const scenes = {
    START: 'Configuração e criação de 3 cenas (início, fim e chat)',
    LIVE: 'Configuração e criação de 4 cenas animadas (início, fim, chat e já volto)',
    STREAMER: 'Configuração e criação de 5 cenas animadas (início, fim, chat, offline e já volto)'
  };
  const configuration = packageCatalog.configuracao.plans[name].items.map(item => {
    if (item.id === 'scenes') return feature('scenes', scenes[name], {START: 3, LIVE: 4, STREAMER: 5}[name]);
    if (item.id === 'camera') return feature('camera', 'Webcam ou câmera configurada com borda personalizada');
    if (item.id === 'alerts') return feature('alert-art', 'Criação e configuração de ' + (name === 'LIVE' ? 3 : 5) + ' alertas', name === 'LIVE' ? 3 : 5);
    return item;
  });
  const design = packageCatalog.personalizacao.plans[name].items.filter(item =>
    !item.id.startsWith('screen') && !['webcam-art', 'alert-art'].includes(item.id));
  return [{label: 'Setup e elementos da live', items: configuration}, {label: 'Identidade visual', items: design}];
}
if (typeof module !== 'undefined' && module.exports) module.exports = {packageCatalog, packageNames, packageFeatures, isPackageUpgrade, formatPackagePrice, combinedPackageGroups};
if (typeof document !== 'undefined') (() => {
  const buttons = [...document.querySelectorAll('[data-package-kind]')];
  const cards = [...document.querySelectorAll('#pacotes .rank-plan')];
  const makeItem = (text, className = '') => {
    const li = document.createElement('li'); li.textContent = text; li.className = className; return li;
  };
  function selectPackages(kind) {
    const category = packageCatalog[kind];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.packageKind === kind)));
    cards.forEach(card => {
      const name = card.querySelector('h3').textContent.trim();
      const plan = category.plans[name];
      card.querySelector('.plan-note').textContent = category.label;
      let pricing = card.querySelector('.package-pricing');
      if (!pricing) {
        pricing = document.createElement('div'); pricing.className = 'package-pricing';
        card.querySelector('.plan-note').after(pricing);
        const original = document.createElement('del'); original.className = 'plan-original-price'; pricing.append(original);
        const price = document.createElement('p'); price.className = 'plan-price'; pricing.append(price);
        const discount = document.createElement('span'); discount.className = 'plan-discount'; pricing.append(discount);
        const description = document.createElement('p'); description.className = 'plan-description'; pricing.after(description);
      }
      pricing.querySelector('.plan-price').textContent = formatPackagePrice(plan.cents);
      pricing.querySelector('del').textContent = plan.originalCents ? formatPackagePrice(plan.originalCents) : '';
      pricing.querySelector('del').hidden = !plan.originalCents;
      const discount = pricing.querySelector('.plan-discount');
      discount.hidden = !plan.originalCents;
      discount.textContent = plan.originalCents ? 'Economize ' + formatPackagePrice(plan.originalCents - plan.cents) : '';
      card.querySelector('.plan-description').textContent = plan.description;
      const list = card.querySelector('ul');
      const items = [];
      if (kind === 'ambos') {
        const index = packageNames.indexOf(name);
        if (index) items.push(makeItem('Tudo do plano ' + packageNames[index - 1] + ' incluído', 'plan-inherited'));
        combinedPackageGroups(name).forEach(group => {
          items.push(makeItem(group.label, 'plan-group-label'));
          group.items.forEach(item => {
            const upgrade = isPackageUpgrade('ambos', name, item);
            if (!index || upgrade) items.push(makeItem(item.label, upgrade ? 'plan-upgrade' : ''));
          });
        });
      } else {
        category.plans[name].items.forEach(item => items.push(makeItem(item.label, isPackageUpgrade(kind, name, item) ? 'plan-upgrade' : '')));
      }
      list.replaceChildren(...items);
      card.querySelector('a.btn').href = 'https://wa.me/5521979978671?text=' + encodeURIComponent(
        'Olá! Quero contratar o pacote ' + name + ' de ' + category.label.toLowerCase() +
        ' (' + formatPackagePrice(plan.cents) + (plan.originalCents ? ', com desconto' : '') + ').');
    });
    document.querySelector('#pacotes .pricing-footnote').textContent = kind === 'ambos'
      ? 'Configuração e personalização juntas, com desconto no pacote completo.'
      : 'Escolha seu pacote de ' + category.label.toLowerCase() + ' e fale com a gente pelo WhatsApp.';
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    document.dispatchEvent(new Event('sectionnavigate')); selectPackages(button.dataset.packageKind);
    requestAnimationFrame(() => {
      const section = document.querySelector('#pacotes'); const marker = section.previousElementSibling;
      const target = marker?.classList.contains('section-marker') ? marker : section;
      window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY, behavior: 'instant'});
    });
  }));
  selectPackages('ambos');
})();
