import {onCLS,onINP,onLCP} from 'web-vitals';
(() => {
 const config=window.TunaAnalyticsConfig;
 let businessPath;try{businessPath=new URL(document.querySelector('#custom-package-form')?.action).pathname.replace(/\/$/,'');}catch{}
 if(!config?.endpoint)return;
 let endpoint;try{endpoint=new URL(config.endpoint,location.origin);if(endpoint.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(endpoint.hostname))return;}catch{return;}
 const key='tuna-analytics-consent-v1',visitorKey='tuna-analytics-visitor-v1',sessionKey='tuna-analytics-session-v1';
 const state={enabled:false,visitor:null,session:null,seconds:0,queue:[],sending:false,started:false,anonymous:false};
 const memory={};const get=k=>{try{return localStorage.getItem(k);}catch{return memory[k]||null;}},set=(k,v)=>{memory[k]=v;try{localStorage.setItem(k,v);}catch{/* Storage may be unavailable. */}};
 const readSession=()=>{try{return JSON.parse(sessionStorage.getItem(sessionKey));}catch{return null;}};
 const source=()=>{let search=location.search,ref=document.referrer;try{if(window.parent!==window&&window.parent.location.origin===location.origin){search=window.parent.location.search;ref=window.parent.document.referrer;}}catch{}const utm=new URLSearchParams(search).get('utm_source')?.toLowerCase()||'';let host='';try{host=new URL(ref).hostname;if(host===location.hostname)host='';}catch{}if(/^(instagram|ig|insta)$/.test(utm)||/(^|\.)instagram\.com$/.test(host))return 'Instagram';if(/^(whatsapp|wa)$/.test(utm))return 'WhatsApp';if(/(^|\.)google\.[a-z.]+$/.test(host))return 'Google';return utm||host?'Outros':'Direto';};
 const device=()=>/ipad|tablet/i.test(navigator.userAgent)?'Tablet':/mobi|android/i.test(navigator.userAgent)?'Celular':'Computador';
 const sectionLabels={inicio:'Início',configuracao:'Configuração',desempenho:'Configuração',design:'Design',identidade:'Design',trabalhos:'Trabalhos',pacotes:'Pacotes',faq:'FAQ',perguntas:'FAQ',personalizado:'Personalizado'};
 function event(kind,label,value=null,context=null){if(!state.enabled)return;state.queue.push({id:crypto.randomUUID(),kind,label,value,context});if(state.queue.length>200)state.queue.shift();}
 function payload(events){return {session_id:state.session,visitor_id:state.visitor,source:source(),device:device(),page:location.pathname,tracking_mode:state.anonymous?'anonymous':'consented',events};}
 async function flush(){
  if(!state.enabled||state.sending||!state.queue.length)return;state.sending=true;
  const events=state.queue.splice(0,20);
  try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload(events)),keepalive:true});if(!response.ok)throw new Error('collection');}
  catch{if(state.enabled)state.queue.unshift(...events);}
  finally{state.sending=false;}
 }
 function start(anonymous=false){
  if(state.started)return;state.started=true;state.enabled=true;state.anonymous=anonymous;
  let visitor;try{visitor=JSON.parse(get(visitorKey));}catch{}
  state.visitor=!anonymous&&visitor?.expires>Date.now()?visitor.id:crypto.randomUUID();if(!anonymous)set(visitorKey,JSON.stringify({id:state.visitor,expires:Date.now()+30*86400000}));
  if(!anonymous&&/^G-[A-Z0-9]+$/.test(config.ga4MeasurementId||'')){
   window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
   window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
   window.gtag('js',new Date());window.gtag('config',config.ga4MeasurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
   let referrer='';try{const ref=new URL(document.referrer);referrer=ref.origin+ref.pathname;}catch{}
   window.gtag('event','page_view',{page_location:location.origin+location.pathname,page_referrer:referrer,page_title:'TunaStream'});
   const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+config.ga4MeasurementId;document.head.append(script);
  }
  const stored=anonymous?null:readSession();state.session=stored?.seen>Date.now()-30*60000?stored.id:crypto.randomUUID();state.seconds=stored?.id===state.session?stored.seconds||0:0;
  const seen=new Set();
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const label=sectionLabels[entry.target.id];if(entry.isIntersecting&&label&&!seen.has(label)){seen.add(label);event('section',label);}}},{threshold:.35});
  document.querySelectorAll('section[id]').forEach(section=>observer.observe(section));
  const scrollSeen=new Set();window.addEventListener('scroll',()=>{if(!state.enabled)return;const height=document.documentElement.scrollHeight-innerHeight;if(height<=0)return;const percent=(scrollY+innerHeight)/document.documentElement.scrollHeight*100;for(const milestone of [25,50,75,100])if(percent>=milestone-.5&&!scrollSeen.has(milestone)){scrollSeen.add(milestone);event('scroll',milestone+'%');}},{passive:true});
  setInterval(()=>{if(state.enabled&&document.visibilityState==='visible'){state.seconds+=5;if(!state.anonymous)try{sessionStorage.setItem(sessionKey,JSON.stringify({id:state.session,seconds:state.seconds,seen:Date.now()}));}catch{}}},5000);
  setInterval(()=>{event('heartbeat','active',state.seconds);flush();},30000);
  for(const metric of [onCLS,onINP,onLCP])metric(value=>event('performance',value.name,value.value),{reportAllChanges:false});
  window.addEventListener('error',()=>event('error','javascript'));
  window.addEventListener('unhandledrejection',()=>event('error','javascript'));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){event('heartbeat','active',state.seconds);flush();}});
  event('heartbeat','active',state.seconds);flush();
 }
 const packFor=element=>{if(element.closest('#custom-package-form'))return 'CUSTOM';const card=element.closest('.rank-plan');if(card){const name=card.querySelector('h3')?.textContent?.trim().toUpperCase();if(['START','LIVE','STREAMER'].includes(name))return name;}return 'GENERAL';};
 const serviceFor=element=>{const form=element?.closest('#custom-package-form');if(!form&&!element?.closest('.rank-plan'))return 'unknown';let kind=form?document.querySelector('#request-kind')?.value:document.querySelector('[data-package-kind][aria-pressed="true"]')?.dataset.packageKind;if(form&&form.querySelector('[name="order-mode"]:checked')?.value==='services'){const groups=new Set([...form.querySelectorAll('.request-service-options input:checked')].map(i=>i.closest('.request-service-group')?.querySelector('h4')?.textContent));kind=groups.size>1?'ambos':[...groups][0]==='Configuração'?'configuracao':'design';}return ({ambos:'both',configuracao:'configuration',personalizacao:'personalization',design:'personalization'})[kind]||'unknown';};
 async function openWhatsApp(url,pack,service='unknown'){
  event('whatsapp',pack);if(pack!=='GENERAL')event('package',pack);flush();
  // Reserve the window during the gesture so mobile browsers do not block it after await.
  const popup=window.open('about:blank','_blank');if(popup){popup.document.title='Abrindo WhatsApp';popup.document.body.textContent='Preparando sua mensagem…';popup.opener=null;}
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'intent',package:pack,service,session_id:state.enabled?state.session:null}),signal:AbortSignal.timeout(8000)});
   const data=await response.json();if(response.ok&&(/^[A-HJ-NP-Z2-9]{5}$/.test(data.reference)||/^TS-(START|LIVE|STREAMER|COMBOS|CUSTOM|GENERAL)-[A-F0-9]{32}$/.test(data.reference))){
    const panel=new URL(config.panelUrl||'/painel/',endpoint.origin);panel.searchParams.set('confirm',data.reference);
    const original=url.searchParams.get('text')||'Olá , gostaria de conversar com a TunaStream.';
    const split=original.indexOf('\n'),greeting=split<0?original:original.slice(0,split),details=split<0?'':original.slice(split).trim();
    url.searchParams.set('text',greeting+'\n\nTicket : '+data.reference+(details?'\n\n'+details:'')+'\n\nConfirmar solicitação (equipe):\n'+panel.href);
   }
  }catch{/* Keep WhatsApp usable when measurement is unavailable. */}
  if(popup){if(!popup.closed)popup.location.replace(url.href);}else location.assign(url.href);
 }
 document.addEventListener('click',click=>{
  const target=click.target.closest?.('a[href],button,summary');
  if(target){const section=target.closest('section')?.id,context=sectionLabels[section]||null;let label=target.matches('button')?'other_button':'other_link';
   if(target.closest('#faq,#perguntas'))label='faq';else if(target.closest('#trabalhos'))label='portfolio';else if(target.hasAttribute('data-package-kind'))label='package_tab';else if(target.closest('.service-tabs'))label='service_tab';else if(target.href?.includes('instagram.com'))label='instagram';else if(target.href?.includes('wa.me'))label='whatsapp';else if(target.getAttribute('href')?.startsWith('#'))label='navigation';
   event('click',label,null,context);
  }
  const link=click.target.closest?.('a[href]');if(!link||click.defaultPrevented||click.button!==0||click.ctrlKey||click.metaKey||click.shiftKey||click.altKey)return;
  let url;try{url=new URL(link.href);}catch{return;}
  if(url.protocol==='https:'&&url.hostname==='wa.me'&&url.pathname.replace(/\/$/,'')===businessPath){click.preventDefault();openWhatsApp(url,packFor(link),serviceFor(link));}
 });
 document.addEventListener('submit',event=>{
  const form=event.target;if(event.defaultPrevented||form.id!=='custom-package-form'||!form.checkValidity())return;
  const message=form.querySelector('[name="text"]')?.value;if(!message)return;
  event.preventDefault();const url=new URL(form.action);url.searchParams.set('text',message);openWhatsApp(url,'CUSTOM',serviceFor(form));
 });
 function choose(choice){set(key,choice);banner.remove();if(choice==='accepted'){if(state.started&&!state.enabled)location.reload();else start();}else state.enabled=false;}
 const banner=document.createElement('aside');banner.setAttribute('aria-label','Preferências de privacidade');
 banner.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:620px;margin:auto;z-index:1000;background:#141019;color:white;border:1px solid #7227dc;border-radius:14px;padding:18px;font:14px Poppins,sans-serif;box-shadow:0 8px 30px #0009';
 const p=document.createElement('p');p.textContent='Podemos medir visitas, navegação e desempenho para melhorar o site? Não coletamos o conteúdo dos formulários. Os botões do WhatsApp incluem uma referência para identificar pedidos vindos do site.';p.style.margin='0 0 14px';banner.append(p);
 for(const [label,choice]of [['Permitir métricas','accepted'],['Recusar métricas','rejected']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='background:'+(choice==='accepted'?'#7227dc':'#28222f')+';color:#fff;border:0;border-radius:8px;padding:10px 14px;margin:0 8px 8px 0;font:inherit;cursor:pointer';button.addEventListener('click',()=>choose(choice));banner.append(button);}
 const privacy=document.createElement('a');privacy.href=config.privacyUrl||'privacidade.html';privacy.textContent='Como tratamos os dados';privacy.style.cssText='color:#dab9ff;display:inline-block;margin-top:8px';banner.append(privacy);
 // No interruption on arrival. Without opt-in use page-memory IDs only; no cross-visit identification or advertising tags.
 if(get(key)==='accepted')start();else if(get(key)!=='rejected'&&config.anonymousMeasurement===true)start(true);
 const footer=document.querySelector('footer');if(footer&&!footer.querySelector('a[href="privacidade.html"]')){const link=document.createElement('a');link.href=config.privacyUrl||'privacidade.html';link.textContent='Privacidade';footer.append(link);}if(footer){const preferences=document.createElement('button');preferences.type='button';preferences.textContent='Preferências de métricas';preferences.style.cssText='border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;padding:8px';preferences.onclick=()=>document.body.append(banner);footer.append(preferences);}
 window.TunaAnalytics={privacy:()=>document.body.append(banner),revoke:()=>{state.enabled=false;state.queue=[];window.gtag?.('consent','update',{analytics_storage:'denied'});set(key,'rejected');try{localStorage.removeItem(visitorKey);sessionStorage.removeItem(sessionKey);}catch{}},openWhatsApp:(url,pack='GENERAL',service='unknown')=>openWhatsApp(new URL(url),pack,service)};
 window.addEventListener('storage',event=>{if(event.key===key&&event.newValue==='rejected'){state.enabled=false;state.queue=[];window.gtag?.('consent','update',{analytics_storage:'denied'});}});
})();
