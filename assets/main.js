/* Site UI stays in its own scope, including when embedded in Lovable. */
(() => {
function initializeSite(){
 const root=document.querySelector('main#conteudo');
 if(!root || root.dataset.initialized)return;
 root.dataset.initialized='true';

    // No libraries: navigation, viewport reveals and accessible portfolio preview.
    // Reveal each item independently, with short stagger groups; never hide whole sections.
    document.querySelectorAll('.reveal').forEach(el=>el.classList.remove('reveal','delay'));
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    const revealTargets=[...document.querySelectorAll('.eyebrow,h1,h2,.service-text>p,.performance-heading>p,.setup-art,.setup-console,.portrait,.hero-actions,.service-row,.benefit,.support-grid p,.support-grid .btn,.support-symbol,.support-rule,.portfolio-toolbar,.work,.plan,.contact-intro,.contact .btn,.creative-console,.creative-sample,.identity-heading>p,.support-compact>div>p,.support-compact>.btn,.support-promises>span,.custom-art,.custom-intro>h3,.custom-intro>p,.custom-form>.form-field,.custom-form>.request-review,.custom-form>.btn,.custom-form>.form-note,.faq-intro,.faq-item')];
    let revealObserver;
    if('IntersectionObserver' in window&&!reducedMotion.matches){
      document.documentElement.classList.add('js');
      revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}})},{threshold:.06,rootMargin:'0px 0px -25px 0px'});
      document.querySelectorAll('section').forEach(section=>{let index=0;revealTargets.filter(el=>section.contains(el)).forEach(el=>{el.classList.add('reveal');el.style.setProperty('--reveal-delay',((index++%4)*75)+'ms');revealObserver.observe(el)})});
      document.querySelectorAll('.service-list,.plans,.image-column,.benefit-bar').forEach(group=>{[...group.children].forEach((el,i)=>el.style.setProperty('--reveal-delay',((i%4)*75)+'ms'))});
    }
    const serviceTabs=[...document.querySelectorAll('[data-service]')];
    function selectService(index){serviceTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.querySelector('#service-panel-'+i).hidden=i!==index})}
    serviceTabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectService(i));tab.addEventListener('keydown',event=>{let next=i;if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(i+1)%serviceTabs.length;else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(i+serviceTabs.length-1)%serviceTabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=serviceTabs.length-1;else return;event.preventDefault();selectService(next);serviceTabs[next].focus()})});
    const designTabs=[...document.querySelectorAll('[data-design]')];
    function selectDesign(index){designTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.querySelector('#design-panel-'+i).hidden=i!==index})}
    designTabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectDesign(i));tab.addEventListener('keydown',event=>{let next=i;if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(i+1)%designTabs.length;else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(i+designTabs.length-1)%designTabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=designTabs.length-1;else return;event.preventDefault();selectDesign(next);designTabs[next].focus()})});
    const heroFilm=document.querySelector('.hero-film');heroFilm.muted=true;
    const heroVideoObserver=new IntersectionObserver(entries=>{entries.forEach(({isIntersecting})=>{if(isIntersecting&&!document.hidden&&!reducedMotion.matches)heroFilm.play().catch(()=>{});else heroFilm.pause()})},{threshold:.05});heroVideoObserver.observe(heroFilm);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)heroFilm.pause();else{heroVideoObserver.unobserve(heroFilm);heroVideoObserver.observe(heroFilm)}});
    const showcaseVideos=[...document.querySelectorAll('.showcase-video')];
    const videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{const v=entry.target;if(entry.isIntersecting&&!v.closest('.work').hidden&&!document.hidden){if(!v.getAttribute('src')){v.src=v.dataset.src;v.load()}v.muted=true;if(!reducedMotion.matches)v.play().catch(()=>{})}else v.pause()}),{threshold:.12});
    showcaseVideos.forEach(v=>{v.muted=true;videoObserver.observe(v)});
    document.addEventListener('visibilitychange',()=>{showcaseVideos.forEach(v=>{if(document.hidden)v.pause();else{videoObserver.unobserve(v);videoObserver.observe(v)}})});
    let selectedChannel='esquentadinha';
    const typeSelect=document.querySelector('#content-type');
    function filterPortfolio(){
      let count=0;document.querySelectorAll('.work').forEach(work=>{work.hidden=work.dataset.channel!==selectedChannel||(typeSelect.value!=='all'&&work.dataset.category!==typeSelect.value);if(!work.hidden){work.style.setProperty('--reveal-delay',((count++%4)*75)+'ms');if(revealObserver){work.classList.remove('visible');revealObserver.observe(work)}}});
      document.querySelector('#result-count').textContent=count+' projeto'+(count===1?'':'s');
      document.querySelector('#filter-status').textContent=count+' projetos de '+selectedChannel+' exibidos';
      document.querySelector('.empty-results').hidden=count!==0;
      const stage=document.querySelector('.portfolio-stage');stage.classList.toggle('only-images',!document.querySelector('.video-column .work:not([hidden])'));stage.classList.toggle('only-videos',!document.querySelector('.image-column .work:not([hidden])'));
      showcaseVideos.forEach(v=>{v.pause();videoObserver.unobserve(v);videoObserver.observe(v)});
    }
    document.querySelectorAll('[data-channel-filter]').forEach(button=>button.addEventListener('click',()=>{selectedChannel=button.dataset.channelFilter;document.querySelectorAll('[data-channel-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filterPortfolio()}));
    typeSelect.addEventListener('change',filterPortfolio);
    const dialog=document.querySelector('.dialog'),dialogContent=document.querySelector('.dialog-content');let previewTrigger;
    document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{previewTrigger=button;document.querySelector('#preview-title').textContent=button.dataset.title;const media=document.createElement(button.dataset.type==='video'?'video':'img');media.src=button.dataset.preview;if(media.tagName==='VIDEO'){media.controls=false;media.muted=true;media.defaultMuted=true;media.volume=0;media.loop=true;media.autoplay=true;media.playsInline=true;media.disablePictureInPicture=true;media.preload='auto'}else{media.alt=button.dataset.title}dialogContent.replaceChildren(media);const playback=document.querySelector('.dialog-play-toggle');playback.hidden=media.tagName!=='VIDEO';playback.textContent='Pausar vídeo';if(media.tagName==='VIDEO'){media.addEventListener('play',()=>playback.textContent='Pausar vídeo');media.addEventListener('pause',()=>playback.textContent='Reproduzir vídeo');media.play().catch(()=>{})}dialog.showModal();document.body.classList.add('locked')}));
    document.querySelector('.dialog-play-toggle').addEventListener('click',()=>{const media=dialogContent.querySelector('video');if(!media)return;if(media.paused)media.play().catch(()=>{});else media.pause()});
    document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
    dialog.addEventListener('close',()=>{const video=dialog.querySelector('video');if(video)video.pause();dialogContent.replaceChildren();document.body.classList.remove('locked');previewTrigger?.focus()});

    const stackSections=[...document.querySelectorAll('main>.screen')];
    const stackMarkers=new Map();
    stackSections.forEach(section=>{
      const marker=document.createElement('div');
      marker.className='section-marker';
      marker.setAttribute('aria-hidden','true');
      section.before(marker);
      stackMarkers.set(section.id,marker);
    });
    function navigateSection(id,behavior){
      const marker=stackMarkers.get(id==='contato'?'personalizado':id);
      if(!marker)return;
      document.dispatchEvent(new Event('sectionnavigate'));
      scrollTo({top:marker.getBoundingClientRect().top+scrollY,behavior:reducedMotion.matches?'instant':behavior});
    }
    document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
      const id=link.hash.slice(1);
      if(!document.getElementById(id))return;
      event.preventDefault();
      if(location.hash!==link.hash)history.pushState(null,'',link.hash);
      navigateSection(id,'smooth');
    }));
    addEventListener('popstate',()=>navigateSection(location.hash.slice(1)||'inicio','instant'));
    history.scrollRestoration='manual';
    addEventListener('pageshow',()=>requestAnimationFrame(()=>{sizeStack();const reloaded=performance.getEntriesByType('navigation')[0]?.type==='reload';if(reloaded)history.replaceState(null,'',location.pathname+location.search+'#inicio');navigateSection(reloaded?'inicio':location.hash.slice(1)||'inicio','instant')}));
    function sizeStack(){
      stackSections.forEach((section,index)=>{
        section.style.setProperty('--stack-order',index+1);
        section.style.setProperty('--stack-top',Math.min(0,innerHeight-section.offsetHeight)+'px');
      });
    }
    let stackResizeFrame=0;
    const stackSizer=new ResizeObserver(()=>{
      cancelAnimationFrame(stackResizeFrame);
      stackResizeFrame=requestAnimationFrame(sizeStack);
    });
    stackSections.forEach(section=>stackSizer.observe(section));
    addEventListener('resize',sizeStack);
    sizeStack();
    document.documentElement.classList.add('motion-ready');
    const decorationObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-active',entry.isIntersecting)),{threshold:0});
    stackSections.forEach(section=>decorationObserver.observe(section));
    const sectionLinks=[...document.querySelectorAll('.section-nav a')];
    const pageSections=sectionLinks.map(link=>document.querySelector(link.getAttribute('href')));
    let sectionFrame=0;
    function updateSection(){
      sectionFrame=0;
      stackSections.forEach((section,index)=>{
        const top=stackMarkers.get(section.id).getBoundingClientRect().top;
        const next=stackSections[index+1];
        const nextTop=next?stackMarkers.get(next.id).getBoundingClientRect().top:Infinity;
        const covered=nextTop<=1;
        section.classList.toggle('is-covered',covered);
        if(covered&&section.dataset.wasCovered!=='true')section.querySelectorAll('video').forEach(video=>video.pause());
        if(!covered&&section.dataset.wasCovered==='true')section.querySelectorAll('video').forEach(video=>{
          if(video===heroFilm){heroVideoObserver.unobserve(video);heroVideoObserver.observe(video)}
          else{videoObserver.unobserve(video);videoObserver.observe(video)}
        });
        section.dataset.wasCovered=String(covered);
        if(reducedMotion.matches){
          section.style.setProperty('--content-parallax','0px');
          section.style.setProperty('--scene-parallax','0px');
        }else{
          const entering=Math.max(0,Math.min(1,top/innerHeight));
          const leaving=Math.max(0,Math.min(1,1-nextTop/innerHeight));
          const strength=innerWidth<761?.55:1;
          section.style.setProperty('--content-parallax',((entering*55-leaving*100)*strength).toFixed(2)+'px');
          section.style.setProperty('--scene-parallax',((leaving*65-entering*35)*strength).toFixed(2)+'px');
        }
      });
      const marker=innerHeight*.45;
      let current=0;
      pageSections.forEach((section,index)=>{if(stackMarkers.get(section.id).getBoundingClientRect().top<=marker)current=index});
      document.querySelector('.section-nav').dataset.currentLabel=sectionLinks[current].querySelector('span').textContent;
      sectionLinks.forEach((link,index)=>{if(index===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
    }
    function scheduleSection(){if(!sectionFrame)sectionFrame=requestAnimationFrame(updateSection)}
    addEventListener('scroll',scheduleSection,{passive:true});addEventListener('resize',scheduleSection);
    reducedMotion.addEventListener('change',scheduleSection);
    updateSection();
    document.querySelector('#year').textContent=new Date().getFullYear();

}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeSite,{once:true});else initializeSite();
})();
