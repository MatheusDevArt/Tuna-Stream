// Shared plan names; independent services and prices for each category.
const packageCatalog = {
  configuracao: { label: 'Configuração', plans: {
    START: {price: 'R$ 99,90', description: 'O essencial para começar com tudo configurado', benefits: [
      'Configuração do OBS do zero para lives e gravações',
      'Configuração para 1 plataforma — Twitch, YouTube, Kick, TikTok ou outra compatível',
      'Configuração de áudio e microfone', 'Configuração de webcam/câmera',
      'Configuração de 2 cenas principais', 'Configuração de teclas de atalho',
      'Ajustes básicos de qualidade e desempenho', 'Teste final de transmissão'
    ]},
    LIVE: {price: 'R$ 249,90', description: 'Sua live preparada para várias plataformas + interação com o público', benefits: [
      'Configuração do OBS do zero para lives e gravações',
      'Configuração para até 3 plataformas — Twitch, YouTube, Kick, TikTok ou outras compatíveis',
      'Otimização do OBS para multistream', 'Configuração de áudio e microfone',
      'Configuração de webcam/câmera', 'Configuração de 3 cenas principais',
      'Configuração de teclas de atalho', 'Configuração de alertas', 'Configuração do LivePix',
      'Configuração de bot de chat', 'Ajustes de qualidade, desempenho e transmissão',
      'Teste final de transmissão'
    ]},
    STREAMER: {price: 'R$ 499,90', description: 'A estrutura completa para profissionalizar sua live', benefits: [
      'Configuração do OBS do zero para lives e gravações',
      'Configuração para até 4 plataformas — Twitch, YouTube, Kick, TikTok ou outras compatíveis',
      'Otimização completa do OBS', 'Configuração de áudio e microfone',
      'Configuração de webcam/câmera', 'Configuração de 5 cenas principais',
      'Configuração de teclas de atalho', 'Configuração de alertas', 'Configuração do LivePix',
      'Configuração de bot de chat', 'Configuração completa do StreamElements',
      'Configuração de overlay padrão do StreamElements',
      'Configuração de widgets, alertas e elementos da transmissão',
      'Configuração de comandos e timers', 'Configuração completa do canal da Twitch',
      'Configuração dos recursos de monetização disponíveis no canal',
      'Ajustes finais e integração de todos os recursos',
      'Teste completo de toda a estrutura de transmissão'
    ]}
  }},
  personalizacao: {label: 'Personalização', plans: {
    START: {price: 'R$ 200,00', benefits: ['Tela de início', 'Tela de fim', 'Tela de chat', 'Webcam', 'Banner']},
    LIVE: {price: 'R$ 500,00', benefits: [
      'Tela de início (animada)', 'Tela de fim (animada)', 'Tela de chat (animada)',
      'Tela de offline (animada)', 'Tela de volto já (animada)', 'Webcam', 'Banner',
      'Painéis (4)', 'Alertas (3)', 'Transição de cena', 'Identidade visual (lite)'
    ]},
    STREAMER: {price: 'R$ 900,00', benefits: [
      '5 telas animadas', 'Webcam', 'Banner', 'Painéis (6)', 'Alertas (5)',
      'Transição de cena', 'Identidade visual (PRO)', 'Distintivos (5)', 'Emotes (5)',
      'Amuleto', 'Versão para TikTok', 'Chat personalizado'
    ]}
  }},
  ambos: {label: 'Configuração e personalização', plans: {
    START: {price: null, benefits: []}, LIVE: {price: null, benefits: []}, STREAMER: {price: null, benefits: []}
  }}
};
(() => {
  const buttons = [...document.querySelectorAll('[data-package-kind]')];
  const cards = [...document.querySelectorAll('#pacotes .rank-plan')];
  function selectPackages(kind) {
    const category = packageCatalog[kind];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.packageKind === kind)));
    cards.forEach(card => {
      const name = card.querySelector('h3').textContent.trim();
      const plan = category.plans[name];
      card.querySelector('.plan-note').textContent = category.label;
      let price = card.querySelector('.plan-price');
      if (!price) {
        price = document.createElement('p'); price.className = 'plan-price';
        card.querySelector('.plan-note').after(price);
      }
      price.textContent = plan.price ?? 'Valores em breve';
      price.classList.toggle('pending', !plan.price);
      let description = card.querySelector('.plan-description');
      if (!description) {
        description = document.createElement('p'); description.className = 'plan-description'; price.after(description);
      }
      description.textContent = plan.description ?? '';
      description.hidden = !plan.description;
      const items = plan.benefits.length ? plan.benefits : ['Itens do pacote em definição.'];
      card.querySelector('ul').replaceChildren(...items.map(text => {
        const li = document.createElement('li'); li.textContent = text; return li;
      }));
      card.querySelector('a.btn').href = 'https://wa.me/5521979978671?text=' + encodeURIComponent(
        'Olá! Quero contratar o pacote ' + name + ' de ' + category.label.toLowerCase() +
        (plan.price ? ' (' + plan.price + ')' : '') + '.'
      );
    });
    document.querySelector('#pacotes .pricing-footnote').textContent = kind === 'ambos'
      ? 'Configuração e personalização: os itens e valores dos pacotes serão anunciados em breve.'
      : 'Escolha seu pacote de ' + category.label.toLowerCase() + ' e fale com a gente pelo WhatsApp.';
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    document.dispatchEvent(new Event('sectionnavigate'));
    selectPackages(button.dataset.packageKind);
    // Keep the category controls in place when shorter lists resize a sticky section.
    requestAnimationFrame(() => {
      const section = document.querySelector('#pacotes');
      const marker = section.previousElementSibling;
      const target = marker?.classList.contains('section-marker') ? marker : section;
      window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY, behavior: 'instant'});
    });
  }));
  selectPackages('configuracao');
})();
