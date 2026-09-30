/* Native GET prepares the order; only the visitor submits it to WhatsApp. */
function buildCustomPackageMessage({name, kind, services = [], details = '', mode = 'services', basePlan, configPlan, designPlan}) {
  const labels = {configuracao: 'Configuração', design: 'Personalização', ambos: 'Configuração e personalização'};
  const selection = mode === 'mix'
    ? ['Pacotes escolhidos:', '• Configuração: ' + configPlan, '• Personalização: ' + designPlan, '', 'Quero aproveitar o desconto na combinação de pacotes.']
    : mode === 'extras'
      ? ['Pacote escolhido: ' + basePlan + ' — ' + labels[kind], '', 'Itens adicionais:', ...services.map(item => '• ' + item)]
      : ['Serviços selecionados:', ...services.map(item => '• ' + item)];
  return ['Olá! Quero um pacote personalizado da Tuna Stream.', '', 'Nome: ' + name.trim(),
    'Eu quero: ' + labels[kind], '', ...selection,
    ...(details.trim() ? ['', 'Informações adicionais:', details.trim()] : [])].join('\n');
}
if (typeof module !== 'undefined' && module.exports) module.exports = {buildCustomPackageMessage};
if (typeof document !== 'undefined') (() => {
  const form = document.querySelector('#custom-package-form');
  const name = document.querySelector('#request-name');
  const modes = [...form.querySelectorAll('[name="order-mode"]')];
  const orderMode = () => modes.find(input => input.checked).value;
  const kind = document.querySelector('#request-kind');
  const base = document.querySelector('#request-base-plan');
  const config = document.querySelector('#request-config-plan');
  const design = document.querySelector('#request-design-plan');
  const details = document.querySelector('#request-details');
  const field = document.querySelector('#request-services');
  const options = form.querySelector('.request-service-options');
  const error = document.querySelector('#services-error');
  const count = document.querySelector('#service-selection-count');
  const message = document.querySelector('#whatsapp-message');
  const pool = ['configuracao', 'personalizacao'].flatMap(category => {
    const seen = new Set();
    const items = packageNames.flatMap(plan => packageCatalog[category].plans[plan].items).filter(item => item.id !== 'screens');
    if (category === 'personalizacao') items.push(feature('screen-offline', 'Tela de offline (animada)', 2));
    return items.filter(item => {const key = item.id + ':' + item.level; if (seen.has(key)) return false; seen.add(key); return true;})
      .map(item => ({...item, category}));
  });
  const additional = {
    configuracao: [['audio-output', 'Configuração de saídas de áudio'], ['audio-filters', 'Filtros e melhorias de áudio'],
      ['vertical', 'Configuração de cena horizontal e vertical'], ['obs-backup', 'Backup das configurações do OBS'],
      ['capture', 'Configuração de placa de captura'], ['virtual-camera', 'Câmera virtual ou celular como webcam'],
      ['games', 'Configuração e otimização de jogos'], ['windows', 'Otimização de Windows e placa de vídeo'],
      ['format', 'Formatação e ativação do Windows (10/11)']],
    personalizacao: [['avatar', 'Avatar'], ['buttons', 'Botões'], ['other', 'Outros']]
  };
  Object.entries(additional).forEach(([category, items]) => items.forEach(([id, label]) => pool.push({...feature(id, label), category})));
  const topics = {
    configuracao: [
      ['OBS e transmissão', ['obs', 'platforms', 'optimization', 'scenes', 'hotkeys', 'quality', 'test', 'vertical', 'obs-backup']],
      ['Áudio e vídeo', ['audio', 'camera', 'audio-output', 'audio-filters', 'capture', 'virtual-camera']],
      ['Interatividade e canal', ['alerts', 'livepix', 'bot', 'streamelements', 'overlay', 'widgets', 'commands', 'twitch', 'monetization', 'integration']],
      ['Jogos e sistema', ['games', 'windows', 'format']]
    ],
    personalizacao: [
      ['Telas da transmissão', ['screen-start', 'screen-end', 'screen-chat', 'screen-brb', 'screen-offline']],
      ['Identidade do canal', ['webcam-art', 'banner', 'panels', 'branding', 'tiktok-art', 'avatar']],
      ['Elementos e interação', ['alert-art', 'transition', 'badges', 'emotes', 'charm', 'chat-art', 'buttons', 'other']]
    ]
  };
  const selected = () => [...options.querySelectorAll('input:checked:not(:disabled)')].map(input => input.value);
  function updateMessage() {
    const services = selected();
    const noun = orderMode() === 'extras'
      ? (services.length === 1 ? 'item adicional' : 'itens adicionais')
      : (services.length === 1 ? 'serviço' : 'serviços');
    count.textContent = orderMode() === 'mix' || !kind.value ? ''
      : `${services.length} ${noun} ${services.length === 1 ? 'selecionado' : 'selecionados'}`;
    if (services.length || orderMode() === 'mix') {error.hidden = true; field.removeAttribute('aria-invalid');}
    message.value = kind.value ? buildCustomPackageMessage({name: name.value, kind: kind.value, mode: orderMode(),
      services, basePlan: base.value, configPlan: config.value, designPlan: design.value, details: details.value}) : '';
    document.querySelector('#request-message-preview').textContent = message.value || 'Preencha o formulário para preparar sua mensagem.';
  }
  function updateChoices() {
    const mixing = orderMode() === 'mix';
    kind.disabled = mixing;
    kind.closest('.form-field').hidden = mixing;
    if (mixing) kind.value = 'ambos';
    form.querySelectorAll('[data-order-mode]').forEach(group => {
      const shown = group.dataset.orderMode === orderMode();
      group.hidden = !shown;
      group.querySelectorAll('select').forEach(select => {select.disabled = !shown; select.required = shown;});
    });
    field.hidden = mixing;
    options.replaceChildren();
    const category = kind.value === 'design' ? 'personalizacao' : kind.value;
    const included = orderMode() === 'extras' && base.value && category ? packageFeatures(category, base.value) : [];
    const ready = !mixing && !!kind.value && (orderMode() !== 'extras' || !!base.value);
    ['configuracao', 'personalizacao'].forEach(group => {
      if (!ready || (orderMode() === 'services' && category !== 'ambos' && category !== group)) return;
      const choices = pool.filter(item => item.category === group && !included.some(current => current.id === item.id && current.level >= item.level));
      const container = document.createElement('div'); container.className = 'request-service-group';
      const heading = document.createElement('h4'); heading.textContent = packageCatalog[group].label; container.append(heading);
      topics[group].forEach(([title, ids]) => {
        const items = choices.filter(item => ids.includes(item.id));
        if (!items.length) return;
        const topic = document.createElement('div'); topic.className = 'service-topic';
        const subtitle = document.createElement('h5'); subtitle.textContent = title; topic.append(subtitle);
        items.forEach(item => {
          const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox';
          input.value = item.label; input.dataset.feature = item.id;
          const span = document.createElement('span'); span.textContent = item.label; label.append(input, span); topic.append(label);
        });
        container.append(topic);
      });
      options.append(container);
    });
    field.querySelector('legend').textContent = orderMode() === 'extras' ? 'Itens adicionais' : 'Tipos de serviço';
    document.querySelector('#services-help').textContent = !kind.value ? 'Escolha o que você procura para ver os serviços.'
      : orderMode() === 'extras' ? (base.value ? 'Selecione os extras. Os itens já incluídos no pacote não aparecem aqui.' : 'Escolha um pacote para ver os itens adicionais.')
      : 'Selecione um ou mais serviços.';
    error.hidden = true; field.removeAttribute('aria-invalid'); updateMessage();
  }
  [...modes, kind, base].forEach(input => input.addEventListener('change', updateChoices));
  options.addEventListener('change', event => {
    const input = event.target;
    if (input.checked) options.querySelectorAll('input').forEach(other => {if (other !== input && other.dataset.feature === input.dataset.feature) other.checked = false;});
    updateMessage();
  });
  form.addEventListener('input', updateMessage);
  form.addEventListener('formdata', event => event.formData.delete('order-mode'));
  form.addEventListener('submit', event => {
    name.value = name.value.trim();
    if (!form.checkValidity()) {event.preventDefault(); form.reportValidity(); return;}
    if (orderMode() !== 'mix' && !selected().length) {
      event.preventDefault(); error.textContent = orderMode() === 'extras' ? 'Selecione pelo menos um item adicional.' : 'Selecione pelo menos um serviço.';
      error.hidden = false; field.setAttribute('aria-invalid', 'true'); field.focus(); return;
    }
    updateMessage();
  });
  function updateSelectAlternatives() {
    form.querySelectorAll('select').forEach(select => {
      [...select.options].forEach(option => {option.hidden = option.selected;});
    });
  }
  form.addEventListener('change', updateSelectAlternatives);
  updateChoices();
  updateSelectAlternatives();
})();
