/* A local form: only its prepared message is passed to WhatsApp on submission. */
function buildCustomPackageMessage({name,kind,services,details}) {
  const labels={configuracao:'Configuração',design:'Design',ambos:'Configuração e design'};
  return [
    'Olá! Quero um pacote personalizado da Tuna Stream.',
    '',
    'Nome: '+name.trim(),
    'Eu quero: '+labels[kind],
    '',
    'Serviços selecionados:',
    ...services.map(service=>'• '+service),
    ...(details.trim()?['','Informações adicionais:',details.trim()]:[])
  ].join('\n');
}

if (typeof module!=='undefined' && module.exports) module.exports={buildCustomPackageMessage};

if (typeof document!=='undefined') {
  const form=document.querySelector('#custom-package-form');
  const nameInput=document.querySelector('#request-name');
  const kindInput=document.querySelector('#request-kind');
  const detailsInput=document.querySelector('#request-details');
  const servicesField=document.querySelector('#request-services');
  const groups=[...form.querySelectorAll('[data-kind]')];
  const error=document.querySelector('#services-error');
  const count=document.querySelector('#service-selection-count');
  const message=document.querySelector('#whatsapp-message');
  const checkedServices=()=>[...form.querySelectorAll('input[type=checkbox]:checked:not(:disabled)')].map(input=>input.value);
  function updateMessage() {
    const services=checkedServices();
    count.textContent=kindInput.value?`${services.length} serviço${services.length===1?'':'s'} selecionado${services.length===1?'':'s'}`:'';
    if(services.length){error.hidden=true;servicesField.removeAttribute('aria-invalid')}
    message.value=kindInput.value?buildCustomPackageMessage({name:nameInput.value,kind:kindInput.value,services,details:detailsInput.value}):'';
    document.querySelector('#request-message-preview').textContent=message.value||'Preencha o formulário para preparar sua mensagem.';
  }
  function updateChoices() {
    groups.forEach(group=>{
      const shown=kindInput.value==='ambos'||kindInput.value===group.dataset.kind;
      group.hidden=!shown;
      group.querySelectorAll('input').forEach(input=>{input.disabled=!shown;if(!shown)input.checked=false});
    });
    document.querySelector('#services-help').textContent=kindInput.value?'Selecione um ou mais serviços.':'Escolha acima o que você procura para ver os serviços.';
    error.hidden=true;servicesField.removeAttribute('aria-invalid');updateMessage();
  }
  kindInput.addEventListener('change',updateChoices);
  form.addEventListener('input',updateMessage);
  form.addEventListener('submit',event=>{
    nameInput.value=nameInput.value.trim();
    if(!form.checkValidity()){event.preventDefault();form.reportValidity();return}
    if(!checkedServices().length){event.preventDefault();error.hidden=false;servicesField.setAttribute('aria-invalid','true');servicesField.focus();return}
    updateMessage();
    // Native GET submission opens the official WhatsApp link with one text parameter.
  });
  updateChoices();
}
