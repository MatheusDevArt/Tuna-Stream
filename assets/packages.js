// Replace null prices and empty benefit lists when the package details arrive.
// Package names stay fixed; each category has independent content and prices.
const packageCatalog = {
  configuracao: { label:'Configuração', plans:{
    START:{price:null,benefits:[]}, PRO:{price:null,benefits:[]}, ELITE:{price:null,benefits:[]}
  }},
  personalizacao: { label:'Personalização', plans:{
    START:{price:null,benefits:[]}, PRO:{price:null,benefits:[]}, ELITE:{price:null,benefits:[]}
  }},
  ambos: { label:'Configuração e personalização', plans:{
    START:{price:null,benefits:[]}, PRO:{price:null,benefits:[]}, ELITE:{price:null,benefits:[]}
  }}
};

(() => {
  const buttons=[...document.querySelectorAll('[data-package-kind]')];
  const cards=[...document.querySelectorAll('#pacotes .rank-plan')];
  function selectPackages(kind){
    const category=packageCatalog[kind];
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.packageKind===kind)));
    cards.forEach(card=>{
      const name=card.querySelector('h3').textContent.trim();
      const plan=category.plans[name];
      card.querySelector('.plan-note').textContent=category.label;
      let price=card.querySelector('.plan-price');
      if(!price){price=document.createElement('p');price.className='plan-price';card.querySelector('.plan-note').after(price)}
      price.textContent=plan.price??'Valores em breve';
      const items=plan.benefits.length?plan.benefits:['Benefícios de '+category.label.toLowerCase()+' em breve.'];
      card.querySelector('ul').replaceChildren(...items.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
      const link=card.querySelector('a.btn');
      link.href='https://wa.me/5521979978671?text='+encodeURIComponent('Olá! Quero saber mais sobre o pacote '+name+' de '+category.label.toLowerCase()+'.');
    });
    document.querySelector('#pacotes .pricing-footnote').textContent=category.label+': detalhes e valores serão divulgados em breve. Fale com a gente para saber mais.';
  }
  buttons.forEach(button=>button.addEventListener('click',()=>selectPackages(button.dataset.packageKind)));
  selectPackages('configuracao');
})();
