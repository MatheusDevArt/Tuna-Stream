/* Advance after the readable part of a section, while retaining free scrolling
   inside long sections, service panels and the request form. */
(() => {
  const sections=[...document.querySelectorAll('main>.screen')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let armedUntil=0, frame=0, animation=0, lastWheel=0;
  const topOf=section=>section.previousElementSibling.getBoundingClientRect().top+scrollY;
  function cancelAdvance(){cancelAnimationFrame(animation);animation=0;armedUntil=0}
  function scrollInside(target){
    for(let node=target;node&&node!==document.body;node=node.parentElement){
      if(node.matches('input,select,textarea,form,dialog'))return true;
      if(/auto|scroll/.test(getComputedStyle(node).overflowY)&&node.scrollHeight>node.clientHeight+2)return true;
    }
    return false;
  }
  function advance(section){
    armedUntil=0;
    const from=scrollY,start=performance.now();
    const to=Math.min(topOf(section),document.documentElement.scrollHeight-innerHeight);
    const duration=Math.min(900,Math.max(600,Math.abs(to-from)*.75));
    function tick(now){
      const progress=Math.min(1,(now-start)/duration);
      const ease=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;
      scrollTo({top:from+(to-from)*ease,behavior:'instant'});
      if(progress<1)animation=requestAnimationFrame(tick);
      else {animation=0;history.replaceState(null,'','#'+section.id)}
    }
    animation=requestAnimationFrame(tick);
  }
  function considerAdvance(){
    frame=0;
    if(animation||motion.matches||performance.now()>armedUntil)return;
    for(let i=sections.length-2;i>=0;i--){
      const top=topOf(sections[i]),next=topOf(sections[i+1]);
      if(scrollY<top||scrollY>=next-2)continue;
      const readableEnd=top+Math.max(0,sections[i].offsetHeight-innerHeight);
      const transition=next-readableEnd;
      if(transition>0&&(scrollY-readableEnd)/transition>=.28)advance(sections[i+1]);
      break;
    }
  }
  addEventListener('wheel',event=>{
    if(event.ctrlKey||motion.matches||event.defaultPrevented)return;
    if(event.deltaY<0){cancelAdvance();return}
    if(!event.deltaY||scrollInside(event.target)){armedUntil=0;return}
    if(animation){event.preventDefault();return}
    const now=performance.now();
    // Inertial wheel tails must not trigger several sections in a row.
    if(now-lastWheel>160)armedUntil=now+500;
    else if(armedUntil>now)armedUntil=now+500;
    lastWheel=now;
  },{passive:false});
  addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(considerAdvance)},{passive:true});
  document.addEventListener('sectionnavigate',cancelAdvance);
  addEventListener('keydown',event=>{if(['Escape','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancelAdvance()});
  addEventListener('touchstart',cancelAdvance,{passive:true});
  addEventListener('resize',cancelAdvance);
  motion.addEventListener('change',cancelAdvance);
})();
